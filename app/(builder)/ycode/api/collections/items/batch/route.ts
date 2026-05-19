import { NextRequest } from 'next/server';
import { getTopItemsWithValuesPerCollection, enrichItemsWithStatus, fetchPublishedHashMap } from '@/lib/repositories/collectionItemRepository';
import { enrichItemsWithCountValues } from '@/lib/repositories/collectionCountRepository';
import { getAllFields } from '@/lib/repositories/collectionFieldRepository';
import { findStatusFieldId } from '@/lib/collection-field-utils';
import { noCache } from '@/lib/api-response';
import type { CollectionField } from '@/types';
import {
  PAGE_NAVIGATION_COLLECTION_ID,
  buildPageNavigationCollectionItems,
} from '@/lib/page-navigation';
import { getAllPages } from '@/lib/repositories/pageRepository';
import { getAllPageFolders } from '@/lib/repositories/pageFolderRepository';
import { getAllCollections } from '@/lib/repositories/collectionRepository';
import { getFieldsByCollectionId } from '@/lib/repositories/collectionFieldRepository';
import { getItemsWithValues } from '@/lib/repositories/collectionItemRepository';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /ycode/api/collections/items/batch
 * Get top N items with values for multiple collections in 2 optimized queries.
 *
 * Body:
 *  - collectionIds: string[]
 *  - limit?: number
 *  - skipEnrichment?: boolean — skip status + count computation. Use when the
 *    consumer (e.g. reference-field display lookup) only needs raw values and
 *    cannot benefit from the extra DB round-trips.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { collectionIds, limit = 10, skipEnrichment = false } = body;

    if (!collectionIds || !Array.isArray(collectionIds)) {
      return noCache({ error: 'collectionIds must be an array' }, 400);
    }

    if (collectionIds.length === 0) {
      return noCache({ data: { items: {} } });
    }

    const needsPageNavigation = collectionIds.includes(PAGE_NAVIGATION_COLLECTION_ID);
    const databaseCollectionIds = collectionIds.filter(id => id !== PAGE_NAVIGATION_COLLECTION_ID);

    const pageNavigationResult: Record<string, { items: any[] }> = {};
    if (needsPageNavigation) {
      const pages = await getAllPages({ is_published: false });
      const folders = await getAllPageFolders({ is_published: false });
      const collectionIdsFromPages = Array.from(new Set(
        pages
          .filter(page => page.settings?.dropdown_mode === 'collection_items' && page.settings?.dropdown_collection_id)
          .map(page => page.settings?.dropdown_collection_id)
          .filter((value): value is string => Boolean(value))
      ));

      const allCollections = collectionIdsFromPages.length > 0
        ? await getAllCollections({ is_published: false, deleted: false })
        : [];
      const matchingCollections = allCollections.filter(collection => collectionIdsFromPages.includes(collection.id));
      const collectionFieldsByCollectionId: Record<string, CollectionField[]> = {};
      const collectionItemsByCollectionId: Record<string, any[]> = {};

      await Promise.all(matchingCollections.map(async (collection) => {
        collectionFieldsByCollectionId[collection.id] = await getFieldsByCollectionId(collection.id, false, { excludeComputed: true });
        const { items } = await getItemsWithValues(collection.id, false, undefined);
        collectionItemsByCollectionId[collection.id] = items;
      }));

      const navigationItems = buildPageNavigationCollectionItems({
        pages,
        folders,
        target: 'nav',
        collections: matchingCollections,
        collectionFieldsByCollectionId,
        collectionItemsByCollectionId,
      });

      pageNavigationResult[PAGE_NAVIGATION_COLLECTION_ID] = {
        items: navigationItems.slice(0, limit),
      };
    }

    if (databaseCollectionIds.length === 0) {
      return noCache({ data: { items: pageNavigationResult } });
    }

    // When skipping enrichment, avoid the getAllFields query and all
    // per-collection enrichment work — reference lookups don't use those.
    if (skipEnrichment) {
      const result = await getTopItemsWithValuesPerCollection(databaseCollectionIds, false, limit);
      return noCache({ data: { items: { ...result, ...pageNavigationResult } } });
    }

    // Fetch items and a single shared field map in parallel. One getAllFields()
    // call replaces N parallel per-collection fetches, and the resulting maps
    // are reused by both status and count enrichment to avoid redundant lookups.
    const [result, allFields] = await Promise.all([
      getTopItemsWithValuesPerCollection(databaseCollectionIds, false, limit),
      getAllFields(false),
    ]);

    const fieldsByCollection = new Map<string, CollectionField[]>();
    const fieldsById = new Map<string, CollectionField>();
    for (const field of allFields) {
      fieldsById.set(field.id, field);
      const list = fieldsByCollection.get(field.collection_id);
      if (list) {
        list.push(field);
      } else {
        fieldsByCollection.set(field.collection_id, [field]);
      }
    }

    // Fetch published hashes for every item across every collection in a
    // single query, then reuse the shared map when enriching each collection.
    // Replaces N parallel per-collection round-trips against collection_items.
    const allItemIds: string[] = [];
    for (const collectionId of databaseCollectionIds) {
      const items = result[collectionId]?.items || [];
      for (const item of items) allItemIds.push(item.id);
    }
    const publishedHashMap = await fetchPublishedHashMap(allItemIds);

    // Enrich each collection's items with computed status and count values.
    // Count enrichment runs after status so both computed fields are present
    // in the preloaded payload that the CMS table renders from.
    await Promise.all(
      databaseCollectionIds.map((collectionId) => {
        const items = result[collectionId]?.items || [];
        const fields = fieldsByCollection.get(collectionId) || [];
        return enrichItemsWithStatus(items, collectionId, findStatusFieldId(fields), publishedHashMap);
      })
    );
    await Promise.all(
      databaseCollectionIds.map((collectionId) => {
        const items = result[collectionId]?.items || [];
        const fields = fieldsByCollection.get(collectionId) || [];
        return enrichItemsWithCountValues(items, collectionId, false, fields, fieldsById);
      })
    );

    return noCache({ data: { items: { ...result, ...pageNavigationResult } } });
  } catch (error) {
    console.error('Error fetching batch items:', error);
    return noCache(
      { error: error instanceof Error ? error.message : 'Failed to fetch batch items' },
      500
    );
  }
}
