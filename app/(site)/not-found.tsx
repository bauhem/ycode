import Link from 'next/link';
import { fetchErrorPage } from '@/lib/page-fetcher';
import { fetchGlobalPageSettings } from '@/lib/generate-page-metadata';
import PageRenderer from '@/components/PageRenderer';

/**
 * Custom 404 page with proper HTTP 404 status.
 * Fetches the custom 404 error page from the database.
 */
export default async function NotFound() {
  let pageData = null;
  let globalSettings = null;

  try {
    [pageData, globalSettings] = await Promise.all([
      fetchErrorPage(404, true),
      fetchGlobalPageSettings(),
    ]);
  } catch {
    // DB not available, render fallback below
  }

  if (pageData && globalSettings) {
    const { page, pageLayers, components, generatedCss } = pageData;
    return (
      <PageRenderer
        page={page}
        layers={pageLayers?.layers || []}
        components={components}
        generatedCss={[generatedCss, globalSettings.publishedCss].filter(Boolean).join('\n') || undefined}
        colorVariablesCss={globalSettings.colorVariablesCss || undefined}
        globalCustomCodeHead={globalSettings.globalCustomCodeHead}
        globalCustomCodeBody={globalSettings.globalCustomCodeBody}
        ycodeBadge={globalSettings.ycodeBadge}
      />
    );
  }

  // Fallback when DB unavailable
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center max-w-md px-4">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
