/**
 * Server-Side CSS Generator using Tailwind CSS Node API
 *
 * Mirrors the client-side cssGenerator but runs on the server.
 * Used by the /ycode/api/css/generate endpoint so that MCP-created
 * layers (or any API-driven changes) get their CSS generated without
 * needing the browser editor open.
 *
 * Also provides per-page CSS generation for targeted cache invalidation:
 * each page stores its own generated_css so design changes are page-scoped.
 */

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { compile } from 'tailwindcss';
import type { Layer, Component } from '@/types';
import { collectComponentIds } from '@/lib/component-utils';
import { DEFAULT_TEXT_STYLES } from '@/lib/text-format-utils';
import { TAILWIND_CUSTOM_VARIANTS } from '@/lib/tailwind-custom-variants';
import { getAllComponents } from '@/lib/repositories/componentRepository';
import { getAllDraftLayers, getDraftLayers } from '@/lib/repositories/pageLayersRepository';
import { getPageById } from '@/lib/repositories/pageRepository';
import { setSetting } from '@/lib/repositories/settingsRepository';
import { getSupabaseAdmin } from '@/lib/supabase-server';
/**
 * Extract all Tailwind classes from a layer tree.
 * Replicates the client-side extractClassesFromLayers logic.
 */
function extractClassesFromLayers(layers: Layer[]): Set<string> {
  const classes = new Set<string>();
  const processedComponentIds = new Set<string>();

  const extractClasses = (classValue: string | string[] | undefined) => {
    if (!classValue) return;

    if (Array.isArray(classValue)) {
      classValue.forEach(cls => {
        if (cls && typeof cls === 'string') {
          cls.split(/\s+/).forEach(c => c.trim() && classes.add(c.trim()));
        }
      });
    } else if (typeof classValue === 'string') {
      classValue.split(/\s+/).forEach(cls => cls.trim() && classes.add(cls.trim()));
    }
  };

  function processLayer(layer: Layer): void {
    if (layer.settings?.hidden) return;

    if (layer.componentId) {
      if (processedComponentIds.has(layer.componentId)) return;
      processedComponentIds.add(layer.componentId);
    }

    extractClasses(layer.classes);

    if (layer.textStyles) {
      Object.values(layer.textStyles).forEach((style: { classes?: string | string[] }) => {
        extractClasses(style.classes);
      });
    }

    if (layer.variables?.text) {
      Object.values(DEFAULT_TEXT_STYLES).forEach(style => {
        extractClasses(style.classes);
      });
    }

    if (layer.children && Array.isArray(layer.children)) {
      layer.children.forEach(child => processLayer(child));
    }
  }

  layers.forEach(layer => processLayer(layer));
  return classes;
}

let compilerCache: { build: (candidates: string[]) => string } | null = null;

/**
 * Get or create a cached Tailwind compiler instance.
 * The compiler only needs to be created once since we always
 * use the same Tailwind config (the default).
 */
async function getCompiler() {
  if (compilerCache) return compilerCache;

  const twPath = join(process.cwd(), 'node_modules/tailwindcss/index.css');
  const baseInput = await readFile(twPath, 'utf-8');
  // Register custom variants (current:, disabled:) so user classes like
  // `current:opacity-100` on slider bullets compile — mirrors the client
  // generator and app/globals.css.
  const input = `${baseInput}\n${TAILWIND_CUSTOM_VARIANTS}\n`;

  compilerCache = await compile(input, {
    base: process.cwd(),
    async loadStylesheet(id: string, base: string) {
      const fullPath = join(dirname(base), id);
      const content = await readFile(fullPath, 'utf-8');
      return { path: fullPath, content, base: dirname(fullPath) };
    },
  });

  return compilerCache;
}

/**
 * Generate CSS from an array of Tailwind class names.
 */
async function compileCss(classNames: string[]): Promise<string> {
  if (classNames.length === 0) return '/* No classes to generate */';
  const compiler = await getCompiler();
  return compiler.build(classNames);
}

/**
 * Generate CSS from all draft layers and component layers,
 * then save it to the draft_css setting.
 *
 * This is the server-side equivalent of the client's generateAndSaveCSS.
 */
export async function generateAndSaveDraftCSS(): Promise<string> {
  const allLayers: Layer[] = [];

  const draftPageLayers = await getAllDraftLayers();
  for (const pl of draftPageLayers) {
    if (pl.layers && Array.isArray(pl.layers)) {
      allLayers.push(...pl.layers);
    }
  }

  const components: Component[] = await getAllComponents(false);
  for (const component of components) {
    // Collect classes from every variant — without this, classes that only
    // appear in non-primary variants (e.g. `bg-[#35b7d4]` on Variant 3) are
    // missing from the compiled stylesheet and the published instance renders
    // unstyled even though `resolveComponents` picks the right variant tree.
    if (component.variants && component.variants.length > 0) {
      for (const variant of component.variants) {
        if (Array.isArray(variant.layers)) allLayers.push(...variant.layers);
      }
    } else if (Array.isArray(component.layers)) {
      allLayers.push(...component.layers);
    }
  }

  const classes = extractClassesFromLayers(allLayers);
  const classNames = Array.from(classes);
  const css = await compileCss(classNames);

  await setSetting('draft_css', css);

  return css;
}

/**
 * Generate per-page CSS for a single page.
 *
 * Extracts classes from the page's draft layers and any components
 * referenced by those layers, compiles via Tailwind, and stores the
 * result in the page_layers.generated_css column. The content_hash
 * is recalculated automatically since it includes generated_css.
 */
export async function generateCSSForPage(pageId: string): Promise<string | null> {
  const pageLayers = await getDraftLayers(pageId);
  if (!pageLayers?.layers) return null;

  const [components, page] = await Promise.all([
    getAllComponents(false),
    getPageById(pageId, false),
  ]);

  const layersForCss = page?.is_dynamic
    ? collectLayersWithAllComponents(pageLayers.layers, components)
    : collectLayersWithComponents(pageLayers.layers, components);
  const classes = extractClassesFromLayers(layersForCss);
  const css = await compileCss(Array.from(classes));

  await updatePageGeneratedCss(pageId, pageLayers, css);

  return css;
}

/**
 * Generate per-page CSS for multiple pages in batch.
 * Loads components once and shares them across all pages.
 */
export async function generateCSSForPages(pageIds: string[]): Promise<number> {
  if (pageIds.length === 0) return 0;

  const components = await getAllComponents(false);
  let updated = 0;

  for (const pageId of pageIds) {
    const pageLayers = await getDraftLayers(pageId);
    if (!pageLayers?.layers) continue;

    const layersForCss = collectLayersWithComponents(pageLayers.layers, components);
    const classes = extractClassesFromLayers(layersForCss);
    const css = await compileCss(Array.from(classes));

    await updatePageGeneratedCss(pageId, pageLayers, css);
    updated++;
  }

  return updated;
}

/**
 * Collect a page's layers plus the layers of any components it references.
 * This ensures the per-page CSS includes all classes needed to render
 * component instances on that page.
 */
function collectLayersWithComponents(pageLayers: Layer[], components: Component[]): Layer[] {
  const result: Layer[] = [...pageLayers];
  const componentMap = new Map(components.map(component => [component.id, component]));
  const visitedComponentIds = new Set<string>();

  function visitComponent(componentId: string): void {
    if (visitedComponentIds.has(componentId)) return;
    visitedComponentIds.add(componentId);

    const component = componentMap.get(componentId);
    if (!component) return;

    const componentLayerGroups = component.variants && component.variants.length > 0
      ? component.variants.map(variant => variant.layers ?? [])
      : [component.layers ?? []];

    for (const layers of componentLayerGroups) {
      result.push(...layers);

      const nestedComponentIds = collectComponentIds(layers);
      for (const nestedComponentId of nestedComponentIds) {
        visitComponent(nestedComponentId);
      }
    }
  }

  const pageComponentIds = collectComponentIds(pageLayers);
  for (const componentId of pageComponentIds) {
    visitComponent(componentId);
  }

  return result;
}

/**
 * Dynamic CMS pages can render extra components from collection-item rich text,
 * which are not visible in the template layer tree alone. For those pages,
 * include every component layer so published routes cannot miss CSS that is
 * only referenced inside CMS rich-text content.
 */
function collectLayersWithAllComponents(pageLayers: Layer[], components: Component[]): Layer[] {
  const result: Layer[] = [...pageLayers];

  for (const component of components) {
    if (component.variants && component.variants.length > 0) {
      for (const variant of component.variants) {
        result.push(...(variant.layers ?? []));
      }
      continue;
    }

    result.push(...(component.layers ?? []));
  }

  return result;
}

/**
 * Write generated_css to the draft page_layers row and recalculate its
 * content_hash so that publish-time hash comparison reflects CSS changes.
 */
async function updatePageGeneratedCss(
  pageId: string,
  pageLayers: { id: string; layers: Layer[] },
  css: string,
): Promise<void> {
  const { generatePageLayersHash } = await import('@/lib/hash-utils');
  const client = await getSupabaseAdmin();
  if (!client) return;

  const contentHash = generatePageLayersHash({
    layers: pageLayers.layers,
    generated_css: css,
  });

  await client
    .from('page_layers')
    .update({
      generated_css: css,
      content_hash: contentHash,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pageLayers.id)
    .eq('is_published', false);
}
