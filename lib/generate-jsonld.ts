/**
 * JSON-LD Structured Data Generator
 *
 * Generates Schema.org JSON-LD blocks for site pages based on page context
 * (page type, folder path, collection item data). Replaces the static
 * custom_code_head JSON-LD with dynamic, page-aware structured data.
 *
 * SERVER-ONLY: This module should never be imported in client code.
 */

import type { CollectionItemWithValues, Page } from '@/types';
import { getSiteBaseUrl } from '@/lib/url-utils';

/** Organization data shared across all schema blocks */
const ORGANIZATION = {
  name: 'Bauhem',
  description:
    'Bauhem conçoit des sites, portails et systèmes web structurés pour aider les PME à être mieux comprises par leurs clients, Google et les outils d\'IA.',
  foundingDate: '2012',
  founder: {
    '@type': 'Person' as const,
    name: 'Guillaume Gosselin',
  },
  address: {
    '@type': 'PostalAddress' as const,
    addressLocality: 'Alma',
    addressRegion: 'Québec',
    addressCountry: 'CA',
  },
} as const;

export interface JsonLdContext {
  page: Page;
  baseUrl: string;
  pagePath: string;
  title: string;
  description: string;
  collectionItem?: CollectionItemWithValues | null;
}

/**
 * Determine the page's content type from its folder path / slug structure.
 */
function detectPageType(page: Page, pagePath: string): 'home' | 'service' | 'solution' | 'blog' | 'realisation' | 'generic' {
  if (pagePath === '/' || pagePath === '') return 'home';
  if (pagePath.startsWith('/services/') || pagePath === '/services') return 'service';
  if (pagePath.startsWith('/solutions/') || pagePath === '/solutions') return 'solution';
  if (pagePath.startsWith('/blog/') || pagePath === '/blog') return 'blog';
  if (pagePath.startsWith('/realisations/')) return 'realisation';
  return 'generic';
}

/**
 * Build the full JSON-LD graph for a page. Returns an array of top-level
 * schema objects (Organization, WebSite, WebPage, BreadcrumbList, plus
 * page-type-specific types like Service or BlogPosting).
 */
export function buildJsonLd(context: JsonLdContext): object[] {
  const { page, baseUrl, pagePath, title, description, collectionItem } = context;
  const pageType = detectPageType(page, pagePath);

  const graph: object[] = [];

  // Always include Organization and WebSite
  graph.push({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    ...ORGANIZATION,
    url: baseUrl,
  });

  graph.push({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Bauhem',
    url: baseUrl,
    description: ORGANIZATION.description,
    inLanguage: pagePath.startsWith('/en') ? 'en' : 'fr',
  });

  // WebPage
  const pageUrl = pagePath === '/' ? baseUrl : `${baseUrl}${pagePath}`;
  graph.push({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    url: pageUrl,
    description,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Bauhem',
      url: baseUrl,
    },
  });

  // BreadcrumbList
  const breadcrumbs = buildBreadcrumbs(pagePath, baseUrl);
  if (breadcrumbs.length > 0) {
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, i) => ({
        '@type': 'ListItem' as const,
        position: i + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    });
  }

  // Page-type-specific schema
  switch (pageType) {
    case 'service': {
      const serviceName = extractPageNameFromPath(pagePath, 'services');
      graph.push({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: serviceName || page.name,
        url: pageUrl,
        description,
        provider: {
          '@type': 'Organization',
          name: ORGANIZATION.name,
          url: baseUrl,
        },
        areaServed: {
          '@type': 'Country',
          name: 'Canada',
        },
      });
      break;
    }
    case 'blog': {
      // Derive author/date from collection item if available
      const authorName = collectionItem?.values?.['author'] || 'Guillaume Gosselin';
      const datePublished = collectionItem?.values?.['published_date'] || page.updated_at || page.created_at;
      graph.push({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        url: pageUrl,
        description,
        author: {
          '@type': 'Person',
          name: authorName,
        },
        datePublished,
        dateModified: page.updated_at || datePublished,
        publisher: {
          '@type': 'Organization',
          name: ORGANIZATION.name,
          url: baseUrl,
        },
        image: undefined, // Will be filled by collection item image if available
      });
      break;
    }
    case 'solution': {
      graph.push({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: page.name,
        url: pageUrl,
        description,
        provider: {
          '@type': 'Organization',
          name: ORGANIZATION.name,
          url: baseUrl,
        },
        areaServed: {
          '@type': 'Country',
          name: 'Canada',
        },
      });
      break;
    }
    // realisation, generic, home — no extra type needed beyond WebPage
  }

  return graph;
}

/**
 * Build breadcrumb trail from a page path.
 */
function buildBreadcrumbs(pagePath: string, baseUrl: string): { name: string; url: string }[] {
  if (pagePath === '/' || pagePath === '') {
    return [{ name: 'Accueil', url: baseUrl }];
  }

  const crumbs: { name: string; url: string }[] = [{ name: 'Accueil', url: baseUrl }];
  const segments = pagePath.replace(/^\//, '').replace(/\/$/, '').split('/');

  let accumulatedPath = '';
  for (const segment of segments) {
    accumulatedPath += '/' + segment;
    const name = segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({ name, url: `${baseUrl}${accumulatedPath}` });
  }

  return crumbs;
}

/**
 * Extract a human-readable page name from the last path segment,
 * optionally stripping a known prefix.
 */
function extractPageNameFromPath(pagePath: string, prefix: string): string {
  const segments = pagePath.replace(/^\//, '').replace(/\/$/, '').split('/');
  const last = segments[segments.length - 1] || '';
  return last
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Serialize JSON-LD graph to a <script> tag string for injection in <head>.
 */
export function renderJsonLd(graph: object[]): string {
  return graph.map((obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`).join('\n');
}
