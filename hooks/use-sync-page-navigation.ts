'use client';

import { useEffect } from 'react';
import { usePagesStore } from '@/stores/usePagesStore';
import { useCollectionsStore } from '@/stores/useCollectionsStore';
import { useLocalisationStore } from '@/stores/useLocalisationStore';
import {
  PAGE_NAVIGATION_COLLECTION,
  PAGE_NAVIGATION_COLLECTION_ID,
  PAGE_NAVIGATION_CHILDREN_COUNT_FIELD_ID,
  PAGE_NAVIGATION_HAS_CHILDREN_FIELD_ID,
  PAGE_NAVIGATION_LABEL_FIELD_ID,
  PAGE_NAVIGATION_PARENT_FIELD_ID,
  PAGE_NAVIGATION_ORDER_FIELD_ID,
  PAGE_NAVIGATION_URL_FIELD_ID,
  buildPageNavigationCollectionItems,
} from '@/lib/page-navigation';
import type { CollectionItemWithValues } from '@/types';

// Helper to compare navigation items to avoid redundant updates
const areNavigationItemsEqual = (a: CollectionItemWithValues[], b: CollectionItemWithValues[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const itemA = a[i];
    const itemB = b[i];
    if (itemA.id !== itemB.id) return false;
    if (itemA.manual_order !== itemB.manual_order) return false;
    
    const valA = itemA.values || {};
    const valB = itemB.values || {};
    
    if (valA[PAGE_NAVIGATION_LABEL_FIELD_ID] !== valB[PAGE_NAVIGATION_LABEL_FIELD_ID]) return false;
    if (valA[PAGE_NAVIGATION_URL_FIELD_ID] !== valB[PAGE_NAVIGATION_URL_FIELD_ID]) return false;
    if (valA[PAGE_NAVIGATION_PARENT_FIELD_ID] !== valB[PAGE_NAVIGATION_PARENT_FIELD_ID]) return false;
    if (valA[PAGE_NAVIGATION_ORDER_FIELD_ID] !== valB[PAGE_NAVIGATION_ORDER_FIELD_ID]) return false;
    if (valA[PAGE_NAVIGATION_HAS_CHILDREN_FIELD_ID] !== valB[PAGE_NAVIGATION_HAS_CHILDREN_FIELD_ID]) return false;
    if (valA[PAGE_NAVIGATION_CHILDREN_COUNT_FIELD_ID] !== valB[PAGE_NAVIGATION_CHILDREN_COUNT_FIELD_ID]) return false;
  }
  return true;
};

export function useSyncPageNavigation() {
  const pages = usePagesStore((state) => state.pages);
  const folders = usePagesStore((state) => state.folders);
  const collections = useCollectionsStore((state) => state.collections);
  const fields = useCollectionsStore((state) => state.fields);
  const items = useCollectionsStore((state) => state.items);
  const locales = useLocalisationStore((state) => state.locales);
  const selectedLocaleId = useLocalisationStore((state) => state.selectedLocaleId);
  const translations = useLocalisationStore((state) => state.translations);

  useEffect(() => {
    if (!pages || pages.length === 0) return;

    // Resolve active locale
    const selectedLocale = locales.find((l) => l.id === selectedLocaleId) || null;

    // Find collection IDs that are relevant for dynamic dropdown items
    const collectionIds = Array.from(new Set(
      pages
        .filter(page => page.settings?.dropdown_mode === 'collection_items' && page.settings?.dropdown_collection_id)
        .map(page => page.settings?.dropdown_collection_id)
        .filter((value): value is string => Boolean(value))
    ));

    const matchingCollections = collections.filter(collection => collectionIds.includes(collection.id));
    const collectionFieldsByCollectionId: Record<string, any[]> = {};
    const collectionItemsByCollectionId: Record<string, any[]> = {};

    matchingCollections.forEach((collection) => {
      collectionFieldsByCollectionId[collection.id] = fields[collection.id] || [];
      collectionItemsByCollectionId[collection.id] = items[collection.id] || [];
    });

    const activeTranslations = selectedLocaleId ? translations[selectedLocaleId] : undefined;

    try {
      const navigationItems = buildPageNavigationCollectionItems({
        pages,
        folders,
        target: 'nav',
        locale: selectedLocale,
        translations: activeTranslations,
        collections: matchingCollections,
        collectionFieldsByCollectionId,
        collectionItemsByCollectionId,
      });

      const currentItems = useCollectionsStore.getState().items[PAGE_NAVIGATION_COLLECTION_ID] || [];

      if (!areNavigationItemsEqual(currentItems, navigationItems)) {
        useCollectionsStore.setState((state) => {
          const hasNavCollection = state.collections.some(
            (c) => c.id === PAGE_NAVIGATION_COLLECTION_ID
          );
          return {
            items: {
              ...state.items,
              [PAGE_NAVIGATION_COLLECTION_ID]: navigationItems,
            },
            itemsTotalCount: {
              ...state.itemsTotalCount,
              [PAGE_NAVIGATION_COLLECTION_ID]: navigationItems.length,
            },
            collections: hasNavCollection
              ? state.collections
              : [...state.collections, PAGE_NAVIGATION_COLLECTION],
          };
        });
      }
    } catch (err) {
      console.error('[SYNC-PAGE-NAV] Failed to regenerate page navigation collection items:', err);
    }
  }, [
    pages,
    folders,
    collections,
    fields,
    items,
    locales,
    selectedLocaleId,
    translations
  ]);
}
