import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { NameSearch } from './components/NameSearch';
import { HomeShowcase } from './components/HomeShowcase';
import { NameHeroHeader, NameFaqAndRelated } from './components/NamePageExtras';
import { InlineKeepsakePreview } from './components/InlineKeepsakePreview';
import { QuoteSection } from './components/QuoteSection';
import { AcrosticPoem } from './components/AcrosticPoem';
import { ShareBanner } from './components/ShareBanner';
import { CookieBanner } from './components/CookieBanner';
import { PersonNameData } from './types';
import { POPULAR_NAMES_DATA, findFallbackName } from './data/fallbackData';
import { fetchPopularNames, trackNameSearch, getCachedNameData, cacheNameData } from './lib/firebase';
import {
  buildAcrosticHubSeo,
  buildDirectorySeo,
  buildHomeSeo,
  buildNameSeo,
  buildSongsHubSeo,
  formatDisplayName,
  getNameSlug,
  isValidNameInput,
  PageSeoMeta,
  safeDecodeURIComponent,
} from './utils/seo';
import { normalizeText } from './utils/searchEngine';
import { Share2 } from 'lucide-react';

// Lazy-load secondary hubs and modals to reduce initial JS parse/execution time
const NameDirectory = lazy(() =>
  import('./components/NameDirectory').then((m) => ({ default: m.NameDirectory }))
);
const SongsWithNamesHub = lazy(() =>
  import('./components/SongsWithNamesHub').then((m) => ({ default: m.SongsWithNamesHub }))
);
const AcrosticPoemsHub = lazy(() =>
  import('./components/AcrosticPoemsHub').then((m) => ({ default: m.AcrosticPoemsHub }))
);
const ShareCardModal = lazy(() =>
  import('./components/ShareCardModal').then((m) => ({ default: m.ShareCardModal }))
);
const CoffeeModal = lazy(() =>
  import('./components/CoffeeModal').then((m) => ({ default: m.CoffeeModal }))
);
const PrivacyPolicyModal = lazy(() =>
  import('./components/PrivacyPolicyModal').then((m) => ({ default: m.PrivacyPolicyModal }))
);

declare global {
  interface Window {
    __PRELOADED_NAME_DATA__?: PersonNameData;
    __PRELOADED_NAME__?: string;
    __PRELOADED_RESOLVED__?: boolean;
  }
}

type AppView = 'home' | 'name' | 'directory' | 'songs-hub' | 'acrostic-hub';

function parseLocationRoute(): { view: AppView; name?: string } {
  if (typeof window === 'undefined') return { view: 'home' };
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';

  if (pathname === '/names') {
    return { view: 'directory' };
  }

  if (pathname === '/songs-with-names') {
    return { view: 'songs-hub' };
  }

  if (pathname === '/acrostic-name-poems') {
    return { view: 'acrostic-hub' };
  }

  const nameMatch = pathname.match(/^\/name\/([^/?#]+)/i);
  if (nameMatch && nameMatch[1]) {
    const decoded = safeDecodeURIComponent(nameMatch[1]).trim();
    if (decoded) {
      return { view: 'name', name: formatDisplayName(decoded) };
    }
  }

  const params = new URLSearchParams(window.location.search);
  const queryName = params.get('name');
  if (queryName && queryName.trim()) {
    return { view: 'name', name: formatDisplayName(queryName.trim()) };
  }

  return { view: 'home' };
}

function syncDocumentHead(meta: PageSeoMeta) {
  if (typeof document === 'undefined') return;
  document.title = meta.title;

  const setMeta = (selector: string, attr: string, value: string) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  };

  setMeta('meta[name="description"]', 'content', meta.description);
  setMeta('meta[name="robots"]', 'content', meta.robots);
  setMeta('link[rel="canonical"]', 'href', meta.canonical);
  setMeta('meta[property="og:url"]', 'content', meta.canonical);
  setMeta('meta[property="og:title"]', 'content', meta.title);
  setMeta('meta[property="og:description"]', 'content', meta.description);
  setMeta('meta[property="og:image"]', 'content', meta.ogImage);
  setMeta('meta[property="og:image:alt"]', 'content', meta.ogImageAlt);
  setMeta('meta[name="twitter:title"]', 'content', meta.title);
  setMeta('meta[name="twitter:description"]', 'content', meta.description);
  setMeta('meta[name="twitter:image"]', 'content', meta.ogImage);
  setMeta('meta[name="twitter:image:alt"]', 'content', meta.ogImageAlt);
}

export function App() {
  const initialRoute = parseLocationRoute();
  const initialPreloadedData =
    typeof window !== 'undefined' && window.__PRELOADED_RESOLVED__
      ? window.__PRELOADED_NAME_DATA__
      : undefined;
  const initialPreloadedName =
    typeof window !== 'undefined' ? window.__PRELOADED_NAME__ : undefined;

  const [view, setView] = useState<AppView>(initialRoute.view);
  const [currentName, setCurrentName] = useState<string>(
    initialPreloadedName || initialRoute.name || ''
  );
  const [nameData, setNameData] = useState<PersonNameData | null>(
    initialPreloadedData ||
      (initialRoute.view === 'name' && initialRoute.name
        ? POPULAR_NAMES_DATA[initialRoute.name.toLowerCase()] ||
          POPULAR_NAMES_DATA[normalizeText(initialRoute.name)] ||
          findFallbackName(initialRoute.name)
        : null)
  );
  const [isResolvedData, setIsResolvedData] = useState<boolean>(
    Boolean(
      initialPreloadedData ||
        (initialRoute.view === 'name' &&
          initialRoute.name &&
          (POPULAR_NAMES_DATA[initialRoute.name.toLowerCase()] ||
            POPULAR_NAMES_DATA[normalizeText(initialRoute.name)]))
    )
  );

  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichingCategory, setEnrichingCategory] = useState<
    'books' | 'songs' | 'movies' | 'games' | 'art' | 'all' | null
  >(null);
  const [enrichStatus, setEnrichStatus] = useState<{
    category: 'books' | 'songs' | 'movies' | 'games' | 'art' | 'all';
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    setEnrichStatus(null);
  }, [currentName, view]);
  const [isCoffeeOpen, setIsCoffeeOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [forceShowCookieBanner, setForceShowCookieBanner] = useState(false);
  const [popularNames, setPopularNames] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  // Auto-hide floating share button when footer comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Load dynamic popular names from Firestore on mount
  useEffect(() => {
    fetchPopularNames()
      .then((names) => {
        if (names && names.length > 0) {
          setPopularNames(names);
        }
      })
      .catch((err) => console.warn('Failed loading popular names:', err));
  }, []);

  // Sync <title>, meta description, robots, OG tags, and <link rel="canonical"> on every route change
  useEffect(() => {
    if (view === 'home') {
      syncDocumentHead(buildHomeSeo());
    } else if (view === 'directory') {
      syncDocumentHead(buildDirectorySeo());
    } else if (view === 'songs-hub') {
      syncDocumentHead(buildSongsHubSeo());
    } else if (view === 'acrostic-hub') {
      syncDocumentHead(buildAcrosticHubSeo());
    } else if (view === 'name' && nameData) {
      syncDocumentHead(buildNameSeo(nameData, currentName || nameData.name, isResolvedData));
    }
  }, [view, currentName, nameData, isResolvedData]);

  const handleCancelSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const handleSearchName = useCallback(
    async (rawName: string, options: { pushHistory?: boolean } = { pushHistory: true }) => {
      const validation = isValidNameInput(rawName);
      if (!validation.valid) {
        setValidationError(validation.reason || 'Please enter a valid name.');
        return;
      }

      setValidationError(null);
      const cleanName = formatDisplayName(rawName);
      const lower = cleanName.toLowerCase();
      const norm = normalizeText(cleanName);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setView('name');
      setCurrentName(cleanName);

      if (options.pushHistory !== false) {
        try {
          const newPath = `/name/${getNameSlug(cleanName)}`;
          if (window.location.pathname !== newPath) {
            window.history.pushState({ view: 'name', name: cleanName }, '', newPath);
          }
        } catch (e) {
          console.warn('History pushState error:', e);
        }
      }

      // 0. Check instant curated static dictionary first ($0 cost, 0ms)
      const curated = POPULAR_NAMES_DATA[lower] || POPULAR_NAMES_DATA[norm];
      if (curated) {
        setNameData(curated);
        setIsResolvedData(true);
        setIsLoading(false);
        abortControllerRef.current = null;
        trackNameSearch(cleanName).catch(() => {});
        return;
      }

      setIsLoading(true);
      // Show provisional layout while loading so page transitions immediately
      setNameData((prev) => (prev?.name.toLowerCase() === lower ? prev : findFallbackName(cleanName)));
      setIsResolvedData(false);

      // 1. Check Firestore Cache first for instant response ($0 Gemini cost)
      try {
        const cached = await getCachedNameData(cleanName);
        if (cached) {
          setNameData(cached);
          setIsResolvedData(true);
          setIsLoading(false);
          abortControllerRef.current = null;
          trackNameSearch(cleanName).catch(() => {});
          return;
        }
      } catch (err) {
        console.warn('Firestore cache lookup error:', err);
      }

      // 2. Query server API for cached or live cultural lookup
      try {
        const res = await fetch('/api/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cleanName }),
          signal: controller.signal,
        });

        if (res.status === 400) {
          const errJson = await res.json().catch(() => ({}));
          setValidationError(errJson.error || 'Please enter a valid name.');
          setIsLoading(false);
          abortControllerRef.current = null;
          return;
        }

        if (res.ok || res.status === 429) {
          const json = await res.json();
          const hasResults =
            (json.books && json.books.length > 0) ||
            (json.songs && json.songs.length > 0) ||
            (json.movies && json.movies.length > 0) ||
            (json.games && json.games.length > 0) ||
            (json.art && json.art.length > 0) ||
            (json.acrostic && json.acrostic.length > 0);

          if (json && hasResults) {
            const booksWithIds = (json.books || []).map((b: any, i: number) => ({
              ...b,
              id: b.id || `api-b-${i}`,
            }));
            const songsWithIds = (json.songs || []).map((s: any, i: number) => ({
              ...s,
              id: s.id || `api-s-${i}`,
            }));
            const moviesWithIds = (json.movies || []).map((m: any, i: number) => ({
              ...m,
              id: m.id || `api-m-${i}`,
            }));
            const gamesWithIds = (json.games || []).map((g: any, i: number) => ({
              ...g,
              id: g.id || `api-g-${i}`,
            }));
            const artWithIds = (json.art || []).map((a: any, i: number) => ({
              ...a,
              id: a.id || `api-a-${i}`,
            }));

            const resolvedSource = json.source && json.source !== 'fallback';
            const freshData: PersonNameData = {
              name: cleanName,
              meaning: json.meaning || `Meaning & Etymology of ${cleanName}`,
              origin: json.origin || 'Cultural Heritage',
              adjectives: json.adjectives || ['Luminous', 'Inspiring', 'Creative'],
              acrostic: json.acrostic || [],
              books: booksWithIds,
              songs: songsWithIds,
              movies: moviesWithIds,
              games: gamesWithIds,
              art: artWithIds,
              source: resolvedSource ? 'gemini' : 'fallback',
            };

            setNameData(freshData);
            setIsResolvedData(Boolean(resolvedSource));
            setIsLoading(false);
            abortControllerRef.current = null;

            if (resolvedSource) {
              cacheNameData(freshData).catch(() => {});
              trackNameSearch(cleanName)
                .then(() => fetchPopularNames())
                .then((updated) => {
                  if (updated && updated.length > 0) setPopularNames(updated);
                })
                .catch(() => {});
            }
            return;
          }
        }
      } catch (e: any) {
        if (e.name === 'AbortError') {
          return;
        }
        console.warn('Falling back to local curated search engine:', e);
      }

      // 3. Fallback if network or Gemini unavailable
      const fallbackData = findFallbackName(cleanName);
      setNameData(fallbackData);
      setIsResolvedData(false);
      setIsLoading(false);
      abortControllerRef.current = null;
    },
    []
  );

  // Clean SPA navigation helper for all internal <a href="..."> links
  const navigateTo = useCallback(
    (path: string) => {
      setValidationError(null);
      const cleanPath = path.replace(/\/+$/, '') || '/';

      if (cleanPath === '/') {
        handleCancelSearch();
        setView('home');
        setCurrentName('');
        if (window.location.pathname !== '/') {
          window.history.pushState({ view: 'home' }, '', '/');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (cleanPath === '/names') {
        handleCancelSearch();
        setView('directory');
        if (window.location.pathname !== '/names') {
          window.history.pushState({ view: 'directory' }, '', '/names');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (cleanPath === '/songs-with-names') {
        handleCancelSearch();
        setView('songs-hub');
        if (window.location.pathname !== '/songs-with-names') {
          window.history.pushState({ view: 'songs-hub' }, '', '/songs-with-names');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (cleanPath === '/acrostic-name-poems') {
        handleCancelSearch();
        setView('acrostic-hub');
        if (window.location.pathname !== '/acrostic-name-poems') {
          window.history.pushState({ view: 'acrostic-hub' }, '', '/acrostic-name-poems');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const nameMatch = cleanPath.match(/^\/name\/([^/?#]+)/i);
      if (nameMatch && nameMatch[1]) {
        const decoded = safeDecodeURIComponent(nameMatch[1]).trim();
        if (decoded) {
          handleSearchName(decoded, { pushHistory: true });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    },
    [handleCancelSearch, handleSearchName]
  );

  // On initial mount: if landed on an UNRESOLVED /name/:slug (not in curated/cache), trigger live lookup for real browsers
  // Skip automated webdriver bots so headless crawlers never trigger paid Gemini calls passively
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.webdriver) return;
    if (initialRoute.view === 'name' && initialRoute.name && !initialPreloadedData) {
      const lower = initialRoute.name.toLowerCase();
      const norm = normalizeText(initialRoute.name);
      if (!POPULAR_NAMES_DATA[lower] && !POPULAR_NAMES_DATA[norm]) {
        handleSearchName(initialRoute.name, { pushHistory: false });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Browser Back / Forward support (popstate listener)
  useEffect(() => {
    const handlePopState = () => {
      const nextRoute = parseLocationRoute();
      setValidationError(null);
      if (nextRoute.view === 'home') {
        handleCancelSearch();
        setView('home');
        setCurrentName('');
      } else if (nextRoute.view === 'directory') {
        handleCancelSearch();
        setView('directory');
      } else if (nextRoute.view === 'songs-hub') {
        handleCancelSearch();
        setView('songs-hub');
      } else if (nextRoute.view === 'acrostic-hub') {
        handleCancelSearch();
        setView('acrostic-hub');
      } else if (nextRoute.view === 'name' && nextRoute.name) {
        handleSearchName(nextRoute.name, { pushHistory: false });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleCancelSearch, handleSearchName]);

  const handleEnrichCategory = async (
    category: 'books' | 'songs' | 'movies' | 'games' | 'art' | 'all'
  ) => {
    if (isEnriching || enrichingCategory || !nameData?.name) return;
    setIsEnriching(true);
    setEnrichingCategory(category);
    setEnrichStatus(null);

    const categoryLabels: Record<typeof category, string> = {
      books: 'Books',
      songs: 'Songs',
      movies: 'Films & TV',
      games: 'Video Games',
      art: 'Art & Artists',
      all: 'Cultural references',
    };

    try {
      const existingTitles: string[] = [
        ...nameData.books.map((b) => b.title),
        ...nameData.songs.map((s) => s.title),
        ...nameData.movies.map((m) => m.title),
        ...(nameData.games || []).map((g) => g.title),
        ...(nameData.art || []).map((a) => a.title),
      ];

      const res = await fetch('/api/enrich-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameData.name,
          category,
          existingTitles,
        }),
      });

      let result: any = null;
      try {
        result = await res.json();
      } catch {
        result = null;
      }

      if (!res.ok) {
        setEnrichStatus({
          category,
          type: 'error',
          message:
            result?.error ||
            result?.message ||
            'Live archive discovery is temporarily unavailable. Please try again shortly.',
        });
        return;
      }

      if (!result || typeof result !== 'object') {
        setEnrichStatus({
          category,
          type: 'error',
          message: 'The archive service returned an unexpected response. Please try again shortly.',
        });
        return;
      }

      if (result.success && result.data) {
        const newData = result.data;
        const mergeUnique = <T extends { title: string }>(
          prevList: T[],
          incoming: any[] | undefined,
          idPrefix: string
        ): { merged: T[]; added: number } => {
          if (!Array.isArray(incoming) || incoming.length === 0) {
            return { merged: prevList, added: 0 };
          }
          const existingSet = new Set(prevList.map((item) => item.title.trim().toLowerCase()));
          const fresh = incoming
            .filter((item) => {
              const key = String(item?.title || '').trim().toLowerCase();
              if (!key || existingSet.has(key)) return false;
              existingSet.add(key);
              return true;
            })
            .map((item, i) => ({
              ...item,
              id: item.id || `${idPrefix}-${Date.now()}-${i}`,
            }));
          return { merged: [...prevList, ...fresh], added: fresh.length };
        };

        let totalAdded = 0;
        setNameData((prev) => {
          if (!prev) return prev;
          const bRes = mergeUnique(prev.books, newData.books, 'enrich-b');
          const sRes = mergeUnique(prev.songs, newData.songs, 'enrich-s');
          const mRes = mergeUnique(prev.movies, newData.movies, 'enrich-m');
          const gRes = mergeUnique(prev.games || [], newData.games, 'enrich-g');
          const aRes = mergeUnique(prev.art || [], newData.art, 'enrich-a');
          totalAdded = bRes.added + sRes.added + mRes.added + gRes.added + aRes.added;

          const updated: PersonNameData = {
            ...prev,
            books: bRes.merged,
            songs: sRes.merged,
            movies: mRes.merged,
            games: gRes.merged,
            art: aRes.merged,
          };

          if (totalAdded > 0) {
            cacheNameData(updated).catch(() => {});
          }
          return updated;
        });

        const reportedAdded = typeof result.addedCount === 'number' ? result.addedCount : totalAdded;
        if (reportedAdded > 0) {
          setEnrichStatus({
            category,
            type: 'success',
            message: `Added ${reportedAdded} new ${categoryLabels[category]} ${reportedAdded === 1 ? 'entry' : 'entries'} for ${nameData.name}.`,
          });
        } else {
          setEnrichStatus({
            category,
            type: 'info',
            message: `No new ${categoryLabels[category]} entries were found beyond what is already listed.`,
          });
        }
      } else {
        setEnrichStatus({
          category,
          type: 'info',
          message:
            result?.message ||
            result?.error ||
            `No additional verified ${categoryLabels[category]} entries were found right now.`,
        });
      }
    } catch (err) {
      console.warn('Enrichment request error:', err);
      setEnrichStatus({
        category,
        type: 'error',
        message: 'Could not reach the archive service. Please check your connection and try again.',
      });
    } finally {
      setIsEnriching(false);
      setEnrichingCategory(null);
    }
  };

  const handleFooterNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navigateTo(path);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 font-sans flex flex-col justify-between selection:bg-amber-200 selection:text-stone-900">
      <Header
        activeView={view}
        onNavigate={navigateTo}
        onOpenCoffee={() => setIsCoffeeOpen(true)}
        onOpenShare={view === 'name' && nameData ? () => setIsShareOpen(true) : undefined}
      />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1">
        {view === 'home' && (
          <>
            <NameSearch
              currentName=""
              isHomeHero
              onSearch={(n) => handleSearchName(n, { pushHistory: true })}
              onNavigate={navigateTo}
              onCancelSearch={handleCancelSearch}
              isLoading={isLoading}
              popularNames={popularNames}
              validationError={validationError}
              onClearError={() => setValidationError(null)}
            />
            <HomeShowcase onNavigate={navigateTo} />
          </>
        )}

        <Suspense
          fallback={
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center text-sm font-serif italic text-stone-500">
              Loading archive...
            </div>
          }
        >
          {view === 'directory' && <NameDirectory onNavigate={navigateTo} />}

          {view === 'songs-hub' && <SongsWithNamesHub onNavigate={navigateTo} />}

          {view === 'acrostic-hub' && <AcrosticPoemsHub onNavigate={navigateTo} />}
        </Suspense>

        {view === 'name' && nameData && (
          <>
            {/* Topical H1 + Breadcrumbs + Etymology Summary */}
            <NameHeroHeader data={nameData} onNavigate={navigateTo} />

            {/* Search Another Name Box */}
            <NameSearch
              currentName={currentName || nameData.name}
              isHomeHero={false}
              onSearch={(n) => handleSearchName(n, { pushHistory: true })}
              onNavigate={navigateTo}
              onCancelSearch={handleCancelSearch}
              isLoading={isLoading}
              popularNames={popularNames}
              validationError={validationError}
              onClearError={() => setValidationError(null)}
            />

            {/* Prominent Share Keepsake Banner */}
            <ShareBanner data={nameData} onOpenShareModal={() => setIsShareOpen(true)} />

            {/* Books, Songs, Movie Quotes, Video Games & Art Sections */}
            <QuoteSection
              personName={nameData.name}
              books={nameData.books}
              songs={nameData.songs}
              movies={nameData.movies}
              games={nameData.games}
              art={nameData.art}
              onEnrichCategory={handleEnrichCategory}
              isEnriching={isEnriching}
              enrichingCategory={enrichingCategory}
              enrichStatus={enrichStatus}
              onDismissEnrichStatus={() => setEnrichStatus(null)}
            />

            {/* Acrostic Poem Generator */}
            <AcrosticPoem
              name={nameData.name}
              meaning={nameData.meaning}
              origin={nameData.origin}
              adjectives={nameData.adjectives}
              acrostic={nameData.acrostic}
              data={nameData}
            />

            {/* Live Framed Keepsake Print & Cultural Card Preview Studio */}
            <InlineKeepsakePreview
              data={nameData}
              onOpenShareModal={() => setIsShareOpen(true)}
            />

            {/* Visible Schema-Matched FAQs + Internal Related Name Links */}
            <NameFaqAndRelated data={nameData} onNavigate={navigateTo} />
          </>
        )}
      </main>

      {/* Persistent Floating Share Action Button (only on name profile pages) */}
      {view === 'name' && nameData && (
        <button
          id="btn-floating-share"
          type="button"
          onClick={() => setIsShareOpen(true)}
          className={`fixed bottom-5 right-5 z-40 px-4 py-3 rounded-full bg-stone-900 text-amber-100 hover:bg-stone-800 font-bold text-xs sm:text-sm shadow-xl border border-amber-500/40 transition-all duration-300 flex items-center gap-2 group cursor-pointer ${
            isFooterVisible
              ? 'opacity-0 pointer-events-none translate-y-6'
              : 'opacity-100 translate-y-0 hover:scale-105 active:scale-95'
          }`}
          title="Share your personalised keepsake card"
          aria-hidden={isFooterVisible}
          tabIndex={isFooterVisible ? -1 : 0}
        >
          <Share2 className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">Share {nameData.name}&rsquo;s Card</span>
          <span className="sm:hidden">Share Card</span>
        </button>
      )}

      {/* Footer */}
      <footer
        ref={footerRef}
        className="w-full border-t border-stone-200 bg-stone-900 text-stone-300 py-10 sm:py-12 mt-10 sm:mt-12"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center space-y-6">
          <div className="w-fit mx-auto flex flex-col items-center">
            <a
              href="/"
              onClick={(e) => handleFooterNav(e, '/')}
              className="text-4xl sm:text-5xl md:text-6xl font-mea-culpa text-amber-200 hover:text-amber-100 transition-colors leading-none py-1 whitespace-nowrap text-center drop-shadow-sm"
            >
              The Page of You
            </a>
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent my-1 select-none" />
            <p className="text-[11px] sm:text-xs font-serif italic text-amber-200/90 tracking-wide">
              Personalised Name Etymology, Acrostic Poetry &amp; Cultural Archive
            </p>
          </div>

          <p className="max-w-2xl text-xs sm:text-sm text-stone-300 leading-relaxed">
            Discover the linguistic etymology, historical origins, and custom acrostic poetry tied to your name. Explore authentic book quotes, famous song lyrics, cinema dialogue, video game lore, and fine art celebrating the story behind every name.
          </p>

          <div className="flex items-center flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium pt-1">
            <a
              href="/names"
              onClick={(e) => handleFooterNav(e, '/names')}
              className="text-stone-200 hover:text-amber-200 transition-colors underline decoration-stone-600 underline-offset-4"
            >
              Browse Names A–Z
            </a>
            <span className="text-stone-700 hidden sm:inline">&bull;</span>
            <a
              href="/songs-with-names"
              onClick={(e) => handleFooterNav(e, '/songs-with-names')}
              className="text-emerald-300 hover:text-emerald-200 transition-colors underline decoration-emerald-700 underline-offset-4"
            >
              Songs With Names
            </a>
            <span className="text-stone-700 hidden sm:inline">&bull;</span>
            <a
              href="/acrostic-name-poems"
              onClick={(e) => handleFooterNav(e, '/acrostic-name-poems')}
              className="text-amber-200 hover:text-amber-100 transition-colors underline decoration-amber-700 underline-offset-4"
            >
              Acrostic Name Poems
            </a>
            <span className="text-stone-700 hidden sm:inline">&bull;</span>
            <button
              id="btn-footer-coffee"
              type="button"
              onClick={() => setIsCoffeeOpen(true)}
              className="text-amber-300 hover:text-amber-200 transition-colors underline decoration-amber-400/60 underline-offset-4 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Buy me a coffee</span>
              <span>☕</span>
            </button>
            {view === 'name' && nameData && (
              <>
                <span className="text-stone-700 hidden sm:inline">&bull;</span>
                <button
                  id="btn-footer-share"
                  type="button"
                  onClick={() => setIsShareOpen(true)}
                  className="text-stone-300 hover:text-white transition-colors cursor-pointer"
                >
                  Share Keepsake Card
                </button>
              </>
            )}
            <span className="text-stone-700 hidden sm:inline">&bull;</span>
            <button
              id="btn-footer-scroll-top"
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-stone-300 hover:text-white transition-colors cursor-pointer"
            >
              Back to Top &uarr;
            </button>
          </div>

          <div className="pt-4 border-t border-stone-800/80 w-full flex flex-col items-center justify-center gap-3 text-xs text-stone-400">
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
              <p>
                &copy; {new Date().getFullYear()}{' '}
                <span className="text-amber-200/90 font-medium">thepageofyou.com</span>. Personalised name etymology &amp; cultural discovery.
              </p>
              <button
                id="btn-footer-privacy-policy"
                type="button"
                onClick={() => setIsPrivacyOpen(true)}
                className="text-stone-400 hover:text-amber-200 transition-colors underline decoration-stone-600 underline-offset-4 font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <span>Privacy Policy &amp; Cookies</span>
              </button>
            </div>
            <p
              id="our-friends-links"
              className="text-xs text-stone-400 text-center flex flex-wrap items-center justify-center gap-2 pt-1"
            >
              <span className="text-stone-300 font-medium">Our Friends:</span>
              <a
                href="https://www.mikegalactic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-400 hover:text-amber-300 transition-colors underline underline-offset-2"
              >
                MikeGalactic
              </a>
              <span className="text-stone-600">&bull;</span>
              <a
                href="https://evolvedpapercraft.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-400 hover:text-amber-300 transition-colors underline underline-offset-2"
              >
                EvolvedPapercraft
              </a>
              <span className="text-stone-600">&bull;</span>
              <a
                href="https://metanode.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-400 hover:text-amber-300 transition-colors underline underline-offset-2"
              >
                Metanode
              </a>
            </p>
            <p
              id="affiliate-disclosure"
              className="text-[11px] text-stone-500 text-center max-w-2xl leading-relaxed pt-1"
            >
              <strong className="text-stone-400 font-medium">Affiliate Disclosure:</strong> As an Amazon Associate, The Page of You earns from qualifying purchases made through links on this site at no extra cost to you.
            </p>
          </div>
        </div>
      </footer>

      {/* Lazy-Loaded Modals & Cookie Banner */}
      <Suspense fallback={null}>
        {isCoffeeOpen && <CoffeeModal isOpen={isCoffeeOpen} onClose={() => setIsCoffeeOpen(false)} />}

        {isShareOpen && nameData && (
          <ShareCardModal
            data={nameData}
            isOpen={isShareOpen}
            onClose={() => setIsShareOpen(false)}
          />
        )}

        {isPrivacyOpen && (
          <PrivacyPolicyModal
            isOpen={isPrivacyOpen}
            onClose={() => setIsPrivacyOpen(false)}
            onManageCookies={() => setForceShowCookieBanner(true)}
          />
        )}
      </Suspense>

      <CookieBanner
        onOpenPrivacyPolicy={() => setIsPrivacyOpen(true)}
        forceShow={forceShowCookieBanner}
        onDismissForceShow={() => setForceShowCookieBanner(false)}
      />
    </div>
  );
}

export default App;
