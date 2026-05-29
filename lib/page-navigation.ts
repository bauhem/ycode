import type {
  Collection,
  CollectionField,
  CollectionItemWithValues,
  Locale,
  Page,
  PageFolder,
  Translation,
} from '@/types';
import { buildLocalizedDynamicPageUrl, buildLocalizedSlugPath } from '@/lib/page-utils';
import { getTranslatableKey, getTranslationValue } from '@/lib/locale-runtime';

export const PAGE_NAVIGATION_COLLECTION_ID = '__page_navigation__';
export const PAGE_NAVIGATION_LABEL_FIELD_ID = '__page_navigation_label__';
export const PAGE_NAVIGATION_URL_FIELD_ID = '__page_navigation_url__';
export const PAGE_NAVIGATION_PARENT_FIELD_ID = '__page_navigation_parent__';
export const PAGE_NAVIGATION_ORDER_FIELD_ID = '__page_navigation_order__';
export const PAGE_NAVIGATION_HAS_CHILDREN_FIELD_ID = '__page_navigation_has_children__';
export const PAGE_NAVIGATION_CHILDREN_COUNT_FIELD_ID = '__page_navigation_children_count__';

export const PAGE_NAVIGATION_COLLECTION: Collection = {
  id: PAGE_NAVIGATION_COLLECTION_ID,
  name: 'Page Navigation',
  uuid: PAGE_NAVIGATION_COLLECTION_ID,
  created_at: '',
  updated_at: '',
  deleted_at: null,
  sorting: null,
  order: -1,
  is_published: false,
  draft_items_count: 0,
  has_published_version: true,
};

export type PageNavigationTarget = 'nav' | 'footer';

export interface PageNavigationItem {
  id: string;
  type: 'page' | 'folder' | 'collection_item';
  label: string;
  href: string;
  pageId?: string;
  folderId?: string;
  collectionId?: string;
  collectionItemId?: string;
  children: PageNavigationItem[];
}

export interface BuildPageNavigationOptions {
  pages: Page[];
  folders: PageFolder[];
  target?: PageNavigationTarget;
  locale?: Locale | null;
  translations?: Record<string, Translation>;
  collections?: Collection[];
  collectionFieldsByCollectionId?: Record<string, CollectionField[]>;
  collectionItemsByCollectionId?: Record<string, CollectionItemWithValues[]>;
}

export const PAGE_NAVIGATION_FIELDS: CollectionField[] = [
  {
    id: PAGE_NAVIGATION_LABEL_FIELD_ID,
    name: 'Label',
    key: 'name',
    type: 'text',
    default: null,
    fillable: false,
    order: 0,
    collection_id: PAGE_NAVIGATION_COLLECTION_ID,
    reference_collection_id: null,
    created_at: '',
    updated_at: '',
    deleted_at: null,
    hidden: false,
    is_computed: false,
    data: {},
    is_published: true,
  },
  {
    id: PAGE_NAVIGATION_URL_FIELD_ID,
    name: 'URL',
    key: 'url',
    type: 'text',
    default: null,
    fillable: false,
    order: 1,
    collection_id: PAGE_NAVIGATION_COLLECTION_ID,
    reference_collection_id: null,
    created_at: '',
    updated_at: '',
    deleted_at: null,
    hidden: false,
    is_computed: false,
    data: {},
    is_published: true,
  },
  {
    id: PAGE_NAVIGATION_PARENT_FIELD_ID,
    name: 'Parent',
    key: 'parent',
    type: 'reference',
    default: null,
    fillable: false,
    order: 2,
    collection_id: PAGE_NAVIGATION_COLLECTION_ID,
    reference_collection_id: PAGE_NAVIGATION_COLLECTION_ID,
    created_at: '',
    updated_at: '',
    deleted_at: null,
    hidden: false,
    is_computed: false,
    data: {},
    is_published: true,
  },
  {
    id: PAGE_NAVIGATION_ORDER_FIELD_ID,
    name: 'Order',
    key: 'order',
    type: 'number',
    default: null,
    fillable: false,
    order: 3,
    collection_id: PAGE_NAVIGATION_COLLECTION_ID,
    reference_collection_id: null,
    created_at: '',
    updated_at: '',
    deleted_at: null,
    hidden: false,
    is_computed: false,
    data: {},
    is_published: true,
  },
  {
    id: PAGE_NAVIGATION_HAS_CHILDREN_FIELD_ID,
    name: 'Has Children',
    key: 'has_children',
    type: 'boolean',
    default: null,
    fillable: false,
    order: 4,
    collection_id: PAGE_NAVIGATION_COLLECTION_ID,
    reference_collection_id: null,
    created_at: '',
    updated_at: '',
    deleted_at: null,
    hidden: false,
    is_computed: true,
    data: {},
    is_published: true,
  },
  {
    id: PAGE_NAVIGATION_CHILDREN_COUNT_FIELD_ID,
    name: 'Children Count',
    key: 'children_count',
    type: 'number',
    default: null,
    fillable: false,
    order: 5,
    collection_id: PAGE_NAVIGATION_COLLECTION_ID,
    reference_collection_id: null,
    created_at: '',
    updated_at: '',
    deleted_at: null,
    hidden: false,
    is_computed: true,
    data: {},
    is_published: true,
  },
];

function getTranslatedNavLabel(
  page: Page,
  locale: Locale | null | undefined,
  translations: Record<string, Translation> | undefined
): string | null {
  const localeOverride = getNavLocaleOverride(page, locale);
  if (localeOverride?.nav_label?.trim()) {
    return localeOverride.nav_label.trim();
  }

  const label = page.settings?.nav_label?.trim();
  if (!label) return null;

  const key = getTranslatableKey({
    source_type: 'page',
    source_id: page.id,
    content_key: 'nav:label',
  });

  return translations?.[key]?.content_value || label;
}

function getNavLocaleOverride(
  page: Page,
  locale: Locale | null | undefined
): { hide_in_nav?: boolean; hide_in_footer?: boolean; nav_label?: string | null } | null {
  if (!locale) return null;
  return page.settings?.nav_locale_overrides?.[locale.id]
    || page.settings?.nav_locale_overrides?.[locale.code]
    || null;
}

function getPageLabel(
  page: Page,
  locale: Locale | null | undefined,
  translations: Record<string, Translation> | undefined
): string {
  return getTranslatedNavLabel(page, locale, translations) || page.name;
}

function getItemLabel(
  item: CollectionItemWithValues,
  fields: CollectionField[],
  translations: Record<string, Translation> | undefined
): string {
  const labelField = fields.find(field => field.key === 'name')
    || fields.find(field => field.key === 'title')
    || fields.find(field => field.key === 'slug')
    || fields.find(field => field.type === 'text' && !field.hidden);

  const translatedLabel = labelField
    ? getTranslatedItemFieldValue(item, labelField, translations)
    : null;
  if (translatedLabel) return translatedLabel;

  const label = labelField ? item.values?.[labelField.id] : null;
  return label && String(label).trim() ? String(label) : `Item ${item.id.slice(0, 8)}`;
}

function getTranslatedItemFieldValue(
  item: CollectionItemWithValues,
  field: CollectionField,
  translations: Record<string, Translation> | undefined
): string | null {
  if (!translations) return null;

  const contentKeys = [
    field.id,
    field.key ? `field:key:${field.key}` : `field:id:${field.id}`,
  ];

  for (const contentKey of contentKeys) {
    const translation = translations[getTranslatableKey({
      source_type: 'cms',
      source_id: item.id,
      content_key: contentKey,
    })];
    const value = getTranslationValue(translation);
    if (value) return value;
  }

  return null;
}

function getDynamicItemSlug(
  item: CollectionItemWithValues,
  targetPage: Page,
  fields: CollectionField[],
  translations: Record<string, Translation> | undefined
): string | null {
  const slugFieldId = targetPage.settings?.cms?.slug_field_id;
  if (!slugFieldId) return null;

  const slugField = fields.find(field => field.id === slugFieldId);
  if (slugField) {
    const translatedSlug = getTranslatedItemFieldValue(item, slugField, translations);
    if (translatedSlug) return translatedSlug;
  }

  const slug = item.values?.[slugFieldId];
  return slug && String(slug).trim() ? String(slug) : null;
}

function pageSortValue(page: Page): number {
  return page.settings?.nav_order ?? page.order ?? 0;
}

function itemSortValue(item: Page | PageFolder): number {
  return 'is_dynamic' in item
    ? item.settings?.nav_order ?? item.order ?? 0
    : item.order ?? 0;
}

function sortPagesForNavigation(a: Page, b: Page): number {
  const orderDiff = pageSortValue(a) - pageSortValue(b);
  if (orderDiff !== 0) return orderDiff;
  return a.name.localeCompare(b.name);
}

function sortMixedForNavigation(
  a: { type: 'page'; data: Page } | { type: 'folder'; data: PageFolder },
  b: { type: 'page'; data: Page } | { type: 'folder'; data: PageFolder }
): number {
  const orderDiff = itemSortValue(a.data) - itemSortValue(b.data);
  if (orderDiff !== 0) return orderDiff;
  return a.data.name.localeCompare(b.data.name);
}

function shouldHidePage(
  page: Page,
  target: PageNavigationTarget,
  locale?: Locale | null
): boolean {
  const localeOverride = getNavLocaleOverride(page, locale);
  if (target === 'footer' && localeOverride?.hide_in_footer !== undefined) {
    return localeOverride.hide_in_footer;
  }
  if (target === 'nav' && localeOverride?.hide_in_nav !== undefined) {
    return localeOverride.hide_in_nav;
  }

  return target === 'footer'
    ? page.settings?.hide_in_footer === true
    : page.settings?.hide_in_nav === true;
}

function buildPageItem(
  page: Page,
  folders: PageFolder[],
  options: BuildPageNavigationOptions
): PageNavigationItem {
  return {
    id: `page:${page.id}`,
    type: 'page',
    label: getPageLabel(page, options.locale, options.translations),
    href: buildLocalizedSlugPath(
      page,
      folders,
      'page',
      options.locale,
      options.translations
    ),
    pageId: page.id,
    folderId: page.page_folder_id || undefined,
    children: [],
  };
}

function getVisibleFolderPages(
  folderId: string,
  options: BuildPageNavigationOptions
): Page[] {
  return options.pages
    .filter(candidate =>
      candidate.page_folder_id === folderId &&
      candidate.deleted_at === null &&
      candidate.error_page === null &&
      candidate.is_dynamic !== true &&
      !shouldHidePage(candidate, options.target || 'nav', options.locale)
    )
    .sort(sortPagesForNavigation);
}

function buildFolderItem(
  folder: PageFolder,
  options: BuildPageNavigationOptions
): PageNavigationItem | null {
  const children = getVisibleFolderPages(folder.id, options)
    .map(candidate => buildPageItem(candidate, options.folders, options));

  if (children.length === 0) return null;

  return {
    id: `folder:${folder.id}`,
    type: 'folder',
    label: folder.name,
    href: buildLocalizedSlugPath(
      folder,
      options.folders,
      'folder',
      options.locale,
      options.translations
    ),
    folderId: folder.id,
    children,
  };
}

function buildFolderPageChildren(
  page: Page,
  options: BuildPageNavigationOptions
): PageNavigationItem[] {
  const folderId = page.settings?.dropdown_folder_id;
  if (!folderId) return [];

  return getVisibleFolderPages(folderId, options)
    .filter(candidate => candidate.id !== page.id)
    .map(candidate => buildPageItem(candidate, options.folders, options));
}

function buildCollectionChildren(
  page: Page,
  options: BuildPageNavigationOptions
): PageNavigationItem[] {
  const collectionId = page.settings?.dropdown_collection_id;
  const targetPageId = page.settings?.dropdown_target_page_id;
  if (!collectionId || !targetPageId) return [];

  const targetPage = options.pages.find(candidate =>
    candidate.id === targetPageId &&
    candidate.is_dynamic &&
    candidate.settings?.cms?.collection_id === collectionId
  );
  if (!targetPage) return [];

  const fields = options.collectionFieldsByCollectionId?.[collectionId] || [];
  const items = options.collectionItemsByCollectionId?.[collectionId] || [];
  const selectedIds = page.settings?.dropdown_selected_item_ids || [];
  const filteredItems = page.settings?.dropdown_items_mode === 'selected'
    ? items.filter(item => selectedIds.includes(item.id))
    : items;

  return filteredItems.flatMap((item): PageNavigationItem[] => {
    const slug = getDynamicItemSlug(item, targetPage, fields, options.translations);
    if (!slug) return [];

    return [{
      id: `collection_item:${item.id}`,
      type: 'collection_item',
      label: getItemLabel(item, fields, options.translations),
      href: buildLocalizedDynamicPageUrl(
        targetPage,
        options.folders,
        slug,
        options.locale,
        options.translations
      ),
      pageId: targetPage.id,
      collectionId,
      collectionItemId: item.id,
      children: [],
    }];
  });
}

function buildDropdownChildren(
  page: Page,
  options: BuildPageNavigationOptions
): PageNavigationItem[] {
  switch (page.settings?.dropdown_mode) {
    case 'folder_pages':
      return buildFolderPageChildren(page, options);
    case 'collection_items':
      return buildCollectionChildren(page, options);
    default:
      return [];
  }
}

/**
 * Builds navigation directly from real Ycode pages.
 *
 * Pages are visible by default. Folder hierarchy supplies automatic page
 * dropdowns, while page settings can opt into folder or CMS-driven children.
 * All hrefs are resolved through the same localized page-routing helpers used
 * by public links.
 */
export function buildPageDrivenNavigation(options: BuildPageNavigationOptions): PageNavigationItem[] {
  const target = options.target || 'nav';
  const effectiveOptions = { ...options, target };
  const rootPages = options.pages
    .filter(page =>
      page.deleted_at === null &&
      page.error_page === null &&
      page.page_folder_id === null &&
      !shouldHidePage(page, target, options.locale)
    )
    .map(data => ({ type: 'page' as const, data }));

  const rootFolders = options.folders
    .filter(folder =>
      folder.deleted_at === null &&
      folder.page_folder_id === null
    )
    .map(data => ({ type: 'folder' as const, data }));

  return [...rootPages, ...rootFolders]
    .sort(sortMixedForNavigation)
    .flatMap((entry): PageNavigationItem[] => {
      if (entry.type === 'folder') {
        const item = buildFolderItem(entry.data, effectiveOptions);
        return item ? [item] : [];
      }

      return [{
        ...buildPageItem(entry.data, options.folders, effectiveOptions),
        children: buildDropdownChildren(entry.data, effectiveOptions),
      }];
    });
}

export function buildPageNavigationCollectionItems(
  options: BuildPageNavigationOptions
): CollectionItemWithValues[] {
  const navItems = buildPageDrivenNavigation(options);
  const flattened: CollectionItemWithValues[] = [];

  const addItem = (item: PageNavigationItem, parentId: string | null, order: number) => {
    const childrenCount = item.children.length;
    flattened.push({
      id: item.id,
      collection_id: PAGE_NAVIGATION_COLLECTION_ID,
      created_at: '',
      updated_at: '',
      deleted_at: null,
      manual_order: order,
      is_published: true,
      is_publishable: true,
      content_hash: null,
      values: {
        [PAGE_NAVIGATION_LABEL_FIELD_ID]: item.label,
        [PAGE_NAVIGATION_URL_FIELD_ID]: item.href,
        [PAGE_NAVIGATION_PARENT_FIELD_ID]: parentId || '',
        [PAGE_NAVIGATION_ORDER_FIELD_ID]: String(order),
        [PAGE_NAVIGATION_HAS_CHILDREN_FIELD_ID]: childrenCount > 0 ? 'true' : 'false',
        [PAGE_NAVIGATION_CHILDREN_COUNT_FIELD_ID]: String(childrenCount),
      },
    });

    item.children.forEach((child, index) => addItem(child, item.id, index));
  };

  navItems.forEach((item, index) => addItem(item, null, index));

  return flattened;
}
