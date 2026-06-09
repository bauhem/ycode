'use client';

import type { Locale } from '@/types';

interface LocaleSelectorProps {
  currentLocale?: Locale | null;
  availableLocales: Locale[];
  currentPageSlug: string;
  isPublished: boolean;
  /** Pre-computed map of localeId → full URL path (e.g. { "en": "/solutions/modernization-aging-websites-systems" }) */
  localizedPageUrls?: Record<string, string>;
}

/**
 * Client-side locale selector for generated pages.
 * Renders an invisible <select> overlay that redirects to the correct
 * localized URL — using pre-computed URLs when available (translates CMS
 * slugs), falling back to naive locale-code prefixing for pages without
 * pre-computed data.
 */
export default function LocaleSelector({
  currentLocale,
  availableLocales,
  currentPageSlug,
  isPublished,
  localizedPageUrls,
}: LocaleSelectorProps) {
  // Detect if we're in preview mode
  const isPreviewMode = typeof window !== 'undefined' && window.location.pathname.startsWith('/ycode/preview');

  // Get default locale (fallback when no locale is detected)
  const defaultLocale = availableLocales.find(l => l.is_default) || availableLocales[0];
  const displayLocale = currentLocale || defaultLocale;

  const handleLocaleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLocaleId = event.target.value;
    const selectedLocale = availableLocales.find(l => l.id === selectedLocaleId);

    if (!selectedLocale) return;

    // Use pre-computed URL when available (handles CMS slug translation correctly).
    if (localizedPageUrls?.[selectedLocaleId]) {
      const prefix = isPreviewMode ? '/ycode/preview' : '';
      console.log('[LocaleSelector] Using pre-computed URL for locale:', selectedLocaleId, '→', localizedPageUrls[selectedLocaleId]);
      window.location.href = `${prefix}${localizedPageUrls[selectedLocaleId]}`;
      return;
    }

    // Fallback: naive locale-code prefixing (legacy behaviour for pages
    // where localizedPageUrls was not computed).
    console.warn('[LocaleSelector] localizedPageUrls missing for locale:', selectedLocaleId, 'available keys:', localizedPageUrls ? Object.keys(localizedPageUrls) : 'undefined');
    const newUrl = buildLocalizedUrl(currentPageSlug, selectedLocale, currentLocale || null, isPreviewMode);
    window.location.href = newUrl;
  };

  return (
    <select
      value={displayLocale?.id || ''}
      onChange={handleLocaleChange}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0,
        cursor: 'pointer',
      }}
      aria-label="Select language"
    >
      {availableLocales.map((locale) => (
        <option key={locale.id} value={locale.id}>
          {locale.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Build localized URL for locale switching (fallback when localizedPageUrls is unavailable).
 * Handles both default and non-default locales.
 * Preserves preview mode prefix when in preview.
 */
function buildLocalizedUrl(
  currentPageSlug: string,
  targetLocale: Locale,
  currentLocale: Locale | null,
  isPreviewMode: boolean
): string {
  // Remove current locale prefix if present
  let pathWithoutLocale = currentPageSlug;
  if (currentLocale && !currentLocale.is_default) {
    const localePrefix = `${currentLocale.code}/`;
    pathWithoutLocale = pathWithoutLocale.startsWith(localePrefix)
      ? pathWithoutLocale.slice(localePrefix.length)
      : pathWithoutLocale === currentLocale.code ? '' : pathWithoutLocale;
  }

  // Build localized path
  const localizedPath = targetLocale.is_default
    ? pathWithoutLocale
    : pathWithoutLocale ? `${targetLocale.code}/${pathWithoutLocale}` : targetLocale.code;

  // Add appropriate prefix
  const prefix = isPreviewMode ? '/ycode/preview' : '';
  return localizedPath ? `${prefix}/${localizedPath}` : (prefix || '/');
}
