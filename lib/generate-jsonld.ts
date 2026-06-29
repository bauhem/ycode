/**
 * JSON-LD Structured Data Generator
 *
 * Generates Schema.org JSON-LD blocks for site pages based on page context
 * (page type, folder path, collection item data). Replaces the static
 * custom_code_head JSON-LD with dynamic, page-aware structured data.
 *
 * SERVER-ONLY: This module should never be imported in client code.
 */

import { getSiteBaseUrl } from '@/lib/url-utils';
import type { CollectionItemWithValues, Locale, Page } from '@/types';

/** Organization data shared across all schema blocks */
function getOrganization(locale?: Locale | null) {
  const isEn = locale?.code === 'en';
  return {
    name: 'Bauhem',
    description: isEn
      ? 'Bauhem designs structured websites, portals and web systems that help SMBs be better understood by their clients, Google and AI tools.'
      : 'Bauhem conçoit des sites, portails et systèmes web structurés pour aider les PME à être mieux comprises par leurs clients, Google et les outils d\'IA.',
    foundingDate: '2012-01-01',
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
}

export interface JsonLdContext {
  page: Page;
  baseUrl: string;
  pagePath: string;
  title: string;
  description: string;
  collectionItem?: CollectionItemWithValues | null;
  locale?: Locale | null;
}

/**
 * Determine the page's content type from its folder path / slug structure.
 */
function detectPageType(page: Page, pagePath: string): 'home' | 'service' | 'solution' | 'blog' | 'realisation' | 'generic' {
  const canonicalPath = stripLocalePrefix(pagePath);

  if (canonicalPath === '/' || canonicalPath === '') return 'home';
  if (canonicalPath.startsWith('/services/') || canonicalPath === '/services') return 'service';
  if (canonicalPath.startsWith('/solutions/') || canonicalPath === '/solutions') return 'solution';
  if (canonicalPath.startsWith('/blog/') || canonicalPath === '/blog') return 'blog';
  if (canonicalPath.startsWith('/realisations/')) return 'realisation';
  return 'generic';
}

function stripLocalePrefix(pagePath: string): string {
  return pagePath.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
}

function getPrimaryTitle(title: string): string {
  const titleParts = title.split('|');
  if (titleParts.length < 2) {
    return title;
  }

  const firstPart = titleParts[0]?.trim() || '';
  const lastPart = titleParts[titleParts.length - 1]?.trim() || '';

  if (/^bauhem\b/i.test(firstPart)) {
    return lastPart || firstPart || title;
  }

  if (/^bauhem\b/i.test(lastPart)) {
    return firstPart || lastPart || title;
  }

  return lastPart || firstPart || title;
}

/**
 * Build the full JSON-LD graph for a page. Returns an array of top-level
 * schema objects (Organization, WebSite, WebPage, BreadcrumbList, plus
 * page-type-specific types like Service or BlogPosting).
 */
export function buildJsonLd(context: JsonLdContext): object[] {
  const { page, baseUrl, pagePath, title, description, collectionItem, locale } = context;
  const pageType = detectPageType(page, pagePath);
  const organization = getOrganization(locale);

  const graph: object[] = [];

  // Always include Organization and WebSite
  graph.push({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    ...organization,
    url: baseUrl,
  });

  graph.push({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Bauhem',
    url: baseUrl,
    description: organization.description,
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
  const breadcrumbs = buildBreadcrumbs(pagePath, baseUrl, locale);
  if (breadcrumbs.length > 0) {
    // Override the last breadcrumb name with the actual page title
    const lastCrumb = breadcrumbs[breadcrumbs.length - 1];
    if (lastCrumb) {
      lastCrumb.name = getPrimaryTitle(title);
    }
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
      const serviceName = getPrimaryTitle(title) || extractPageNameFromPath(pagePath);
      graph.push({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: serviceName || page.name,
        serviceType: 'Technical SEO, AEO and GEO Consulting',
        url: pageUrl,
        description,
        provider: {
          '@type': 'Organization',
          name: organization.name,
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
          name: organization.name,
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
        name: getPrimaryTitle(title) || page.name,
        serviceType: 'Digital Solutions',
        url: pageUrl,
        description,
        provider: {
          '@type': 'Organization',
          name: organization.name,
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
function buildBreadcrumbs(pagePath: string, baseUrl: string, locale?: Locale | null): { name: string; url: string }[] {
  const homeLabel = locale?.code === 'en' ? 'Home' : 'Accueil';
  if (pagePath === '/' || pagePath === '') {
    return [{ name: homeLabel, url: baseUrl }];
  }

  const crumbs: { name: string; url: string }[] = [{ name: homeLabel, url: baseUrl }];
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
function extractPageNameFromPath(pagePath: string): string {
  const segments = stripLocalePrefix(pagePath).replace(/^\//, '').replace(/\/$/, '').split('/');
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
