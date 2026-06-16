import '@/app/site.css';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import RootLayoutShell, { defaultMetadata } from '@/components/RootLayoutShell';
import { fetchGlobalPageSettings } from '@/lib/generate-page-metadata';
import { renderRootLayoutHeadCode } from '@/lib/parse-head-html';

/**
 * Detect the page locale from the request pathname.
 * Bauhem default: "fr". Paths under /en/ → "en".
 * Falls back to "en" for non-site routes (builder, preview, etc.).
 */
function detectLocaleFromPathname(pathname: string): string {
  // Normalize: strip trailing slash, get segments
  const normalized = pathname.replace(/\/$/, '');
  const segments = normalized.split('/').filter(Boolean);

  if (segments[0] === 'en') return 'en';
  // If the first segment is a known non-locale path (ycode, api, etc.), keep "en"
  // For all other paths (including "/"), default to French
  if (segments.length === 0 || !['ycode', 'api', '_next'].includes(segments[0])) {
    return 'fr';
  }
  return 'en';
}

export async function generateMetadata(): Promise<Metadata> {
  if (process.env.SKIP_SETUP === 'true') {
    return defaultMetadata;
  }

  try {
    const globalSettings = await fetchGlobalPageSettings();
    const metadata: Metadata = { ...defaultMetadata };

    if (globalSettings.faviconUrl || globalSettings.webClipUrl) {
      metadata.icons = {};
      if (globalSettings.faviconUrl) {
        metadata.icons.icon = globalSettings.faviconUrl;
      }
      if (globalSettings.webClipUrl) {
        metadata.icons.apple = globalSettings.webClipUrl;
      }
    }

    return metadata;
  } catch {
    return defaultMetadata;
  }
}

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let headElements: React.ReactNode[] = [];

  // Resolve the page language from the request pathname.
  // x-pathname is injected by proxy.ts as a request header from
  // request.nextUrl.pathname (available in both local dev and Netlify).
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || headersList.get('x-next-pathname') || '/';
  const lang = detectLocaleFromPathname(pathname);

  // Cloud mode uses ISR with explicit tenantId. Cloud injects global head
  // code from PageRenderer instead of the layout.
  if (process.env.SKIP_SETUP !== 'true') {
    try {
      const globalSettings = await fetchGlobalPageSettings();
      if (globalSettings.globalCustomCodeHead) {
        headElements = renderRootLayoutHeadCode(globalSettings.globalCustomCodeHead);
      }
    } catch {
      // Supabase not configured — skip custom code
    }
  }

  // Published sites render text with the browser-default (`auto`) font
  // smoothing — matching legacy output. Forcing `antialiased` here would render
  // glyphs thinner/lighter than the original site.
  return (
    <RootLayoutShell
      headElements={headElements} bodyClassName="font-sans"
      lang={lang}
    >
      {children}
    </RootLayoutShell>
  );
}
