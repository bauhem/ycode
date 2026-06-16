import { buildJsonLd } from '@/lib/generate-jsonld';
import type { CollectionItemWithValues, Locale, Page } from '@/types';

interface JsonLdProps {
  page: Page;
  baseUrl: string;
  pagePath: string;
  title: string;
  description: string;
  collectionItem?: CollectionItemWithValues | null;
  locale?: Locale | null;
}

/**
 * Renders Schema.org JSON-LD structured data in a <script> block.
 * Google and other search engines parse JSON-LD regardless of
 * whether it's in <head> or <body>, so this component can be
 * placed anywhere in the page tree.
 */
export default function JsonLd({ page, baseUrl, pagePath, title, description, collectionItem, locale }: JsonLdProps) {
  const graph = buildJsonLd({ page, baseUrl, pagePath, title, description, collectionItem, locale });

  return (
    <>
      {graph.map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}
    </>
  );
}
