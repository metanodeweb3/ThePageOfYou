import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { NameSearch } from './components/NameSearch';
import { QuoteSection } from './components/QuoteSection';
import { AcrosticPoem } from './components/AcrosticPoem';
import { ShareBanner } from './components/ShareBanner';
import { ShareCardModal } from './components/ShareCardModal';
import { CoffeeModal } from './components/CoffeeModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { CookieBanner } from './components/CookieBanner';
import { PersonNameData } from './types';
import { POPULAR_NAMES_DATA, findFallbackName } from './data/fallbackData';
import { fetchPopularNames, trackNameSearch, getCachedNameData, cacheNameData } from './lib/firebase';
import { Share2, Heart } from 'lucide-react';

declare global {
  interface Window {
    __PRELOADED_NAME_DATA__?: PersonNameData;
    __PRELOADED_NAME__?: string;
  }
}

export function App() {
  // Initialize from server preloaded state if available
  const initialPreloadedData = typeof window !== 'undefined' ? window.__PRELOADED_NAME_DATA__ : undefined;
  const initialPreloadedName = typeof window !== 'undefined' ? window.__PRELOADED_NAME__ : undefined;

  const [currentName, setCurrentName] = useState<string>(initialPreloadedName || 'Jude');
  const [nameData, setNameData] = useState<PersonNameData>(initialPreloadedData || POPULAR_NAMES_DATA.jude);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isCoffeeOpen, setIsCoffeeOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [forceShowCookieBanner, setForceShowCookieBanner] = useState(false);
  const [popularNames, setPopularNames] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  // Auto-hide floating button when footer comes into view
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
    fetchPopularNames().then((names) => {
      if (names && names.length > 0) {
        setPopularNames(names);
      }
    }).catch((err) => console.warn('Failed loading popular names:', err));
  }, []);

  // Dynamically update document title and meta description for SEO
  useEffect(() => {
    const isDedicatedNamePage = typeof window !== 'undefined' && (
      window.location.pathname.startsWith('/name/') ||
      Boolean(new URLSearchParams(window.location.search).get('name'))
    );

    if (isDedicatedNamePage && currentName) {
      const formattedTitle = `${currentName} — Name Meaning, Origin & Custom Acrostic Poem | The Page of You`;
      document.title = formattedTitle;

      // Update Meta Description dynamically
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', `Discover the origin, cultural history, meaning, and bespoke acrostic poem for "${currentName}". Create personalized poems, gifts, and explore verified quotes across literature, music, and film.`);
      }
    } else {
      // Clean brand title for the main homepage
      document.title = 'The Page of You — Personalised Name Origins & Custom Acrostic Poetry';

      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 'Discover baby name meanings, personalised name origins, bespoke acrostic poetry gifts, and cultural references across literature, song lyrics, movies, video games, and fine art.');
      }
    }
  }, [currentName]);

  // Check initial URL path (/name/oliver) or search param (?name=oliver)
  useEffect(() => {
    // If we already hydrated with preloaded data from server, do not re-fetch
    if (initialPreloadedData && initialPreloadedName) {
      return;
    }

    const path = window.location.pathname;
    const nameMatch = path.match(/^\/name\/([^/?#]+)/i);
    if (nameMatch && nameMatch[1]) {
      const decodedName = decodeURIComponent(nameMatch[1]).trim();
      if (decodedName) {
        handleSearchName(decodedName);
        return;
      }
    }

    const params = new URLSearchParams(window.location.search);
    const nameParam = params.get('name');
    if (nameParam && nameParam.trim()) {
      handleSearchName(nameParam.trim());
    }
  }, []);

  const handleCancelSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const handleSearchName = async (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;

    // Abort any ongoing search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setCurrentName(cleanName);
    setIsLoading(true);

    // Track search count in Firebase Firestore asynchronously
    trackNameSearch(cleanName).then(() => {
      // Re-fetch popular names after search
      fetchPopularNames().then((updated) => {
        if (updated && updated.length > 0) setPopularNames(updated);
      });
    }).catch((err) => console.warn('Search tracking failed:', err));

    // Update URL path seamlessly to /name/:slug
    try {
      const safeSlug = encodeURIComponent(cleanName.toLowerCase());
      const newPath = `/name/${safeSlug}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({ name: cleanName }, '', newPath);
      }
    } catch (e) {
      console.warn('History pushState error:', e);
    }

    // 1. Check Firestore Cache first for instant response
    try {
      const cached = await getCachedNameData(cleanName);
      if (cached) {
        setNameData(cached);
        setIsLoading(false);
        abortControllerRef.current = null;
        return;
      }
    } catch (err) {
      console.warn('Firestore cache lookup error:', err);
    }

    // 2. Query server Gemini API for live deep cultural search
    try {
      const res = await fetch('/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName }),
        signal: controller.signal,
      });

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
          // Add unique IDs to books, songs, movies, games, art
          const booksWithIds = (json.books || []).map((b: any, i: number) => ({
            ...b,
            id: `api-b-${i}`,
          }));
          const songsWithIds = (json.songs || []).map((s: any, i: number) => ({
            ...s,
            id: `api-s-${i}`,
          }));
          const moviesWithIds = (json.movies || []).map((m: any, i: number) => ({
            ...m,
            id: `api-m-${i}`,
          }));
          const gamesWithIds = (json.games || []).map((g: any, i: number) => ({
            ...g,
            id: `api-g-${i}`,
          }));
          const artWithIds = (json.art || []).map((a: any, i: number) => ({
            ...a,
            id: `api-a-${i}`,
          }));

          const freshData: PersonNameData = {
            name: cleanName,
            meaning: json.meaning || `Noble & Cherished Name (${cleanName})`,
            origin: json.origin || 'Cultural Heritage',
            adjectives: json.adjectives || ['Luminous', 'Inspiring', 'Creative'],
            acrostic: json.acrostic || [],
            books: booksWithIds,
            songs: songsWithIds,
            movies: moviesWithIds,
            games: gamesWithIds,
            art: artWithIds,
            source: 'gemini',
          };

          setNameData(freshData);
          setIsLoading(false);
          abortControllerRef.current = null;

          // Asynchronously store in Firestore cache
          cacheNameData(freshData).catch((e) => console.warn('Failed to cache name:', e));
          return;
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log('Search aborted by user for:', cleanName);
        return;
      }
      console.warn('Falling back to local curated search engine:', e);
    }

    // 3. Fallback to enhanced search engine (fuzzy Levenshtein, Soundex, diacritic stripping, aliases)
    const fallbackData = findFallbackName(cleanName);
    setNameData(fallbackData);
    setIsLoading(false);
    abortControllerRef.current = null;
  };

  const handleEnrichCategory = async (category: 'books' | 'songs' | 'movies' | 'games' | 'art' | 'all') => {
    if (isEnriching || !nameData.name) return;
    setIsEnriching(true);

    try {
      // Collect existing titles to avoid duplicates
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

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          const newData = result.data;
          setNameData((prev) => {
            const updated: PersonNameData = {
              ...prev,
              books: newData.books
                ? [
                    ...prev.books,
                    ...newData.books.map((b: any, i: number) => ({
                      ...b,
                      id: `enrich-b-${Date.now()}-${i}`,
                    })),
                  ]
                : prev.books,
              songs: newData.songs
                ? [
                    ...prev.songs,
                    ...newData.songs.map((s: any, i: number) => ({
                      ...s,
                      id: `enrich-s-${Date.now()}-${i}`,
                    })),
                  ]
                : prev.songs,
              movies: newData.movies
                ? [
                    ...prev.movies,
                    ...newData.movies.map((m: any, i: number) => ({
                      ...m,
                      id: `enrich-m-${Date.now()}-${i}`,
                    })),
                  ]
                : prev.movies,
              games: newData.games
                ? [
                    ...(prev.games || []),
                    ...newData.games.map((g: any, i: number) => ({
                      ...g,
                      id: `enrich-g-${Date.now()}-${i}`,
                    })),
                  ]
                : prev.games,
              art: newData.art
                ? [
                    ...(prev.art || []),
                    ...newData.art.map((a: any, i: number) => ({
                      ...a,
                      id: `enrich-a-${Date.now()}-${i}`,
                    })),
                  ]
                : prev.art,
            };

            // Update Firestore cache document asynchronously
            cacheNameData(updated).catch((e) => console.warn('Failed to update cache after enrichment:', e));
            return updated;
          });
        }
      }
    } catch (err) {
      console.warn('Enrichment request error:', err);
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 font-sans flex flex-col justify-between selection:bg-amber-200 selection:text-stone-900">
      <Header
        onOpenCoffee={() => setIsCoffeeOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
      />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1">
        {/* Name Search Header Box */}
        <NameSearch
          currentName={currentName}
          onSearch={handleSearchName}
          onCancelSearch={handleCancelSearch}
          isLoading={isLoading}
          popularNames={popularNames}
        />

        {/* Prominent Share Keepsake Banner */}
        <ShareBanner
          data={nameData}
          onOpenShareModal={() => setIsShareOpen(true)}
        />

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
      </main>

      {/* Persistent Floating Share Action Button */}
      <button
        id="btn-floating-share"
        onClick={() => setIsShareOpen(true)}
        className={`fixed bottom-5 right-5 z-40 px-4 py-3 rounded-full bg-stone-900 text-amber-100 hover:bg-stone-800 font-bold text-xs sm:text-sm shadow-xl border border-amber-500/40 transition-all duration-300 flex items-center gap-2 group ${
          isFooterVisible
            ? 'opacity-0 pointer-events-none translate-y-6'
            : 'opacity-100 translate-y-0 hover:scale-105 active:scale-95'
        }`}
        title="Share your personalized keepsake card"
        aria-hidden={isFooterVisible}
        tabIndex={isFooterVisible ? -1 : 0}
      >
        <Share2 className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline">Share {currentName}'s Card</span>
        <span className="sm:hidden">Share Card</span>
      </button>

      {/* Footer */}
      <footer ref={footerRef} className="w-full border-t border-stone-200 bg-stone-900 text-stone-300 py-10 sm:py-12 mt-10 sm:mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center space-y-6">
          <div className="w-fit mx-auto flex flex-col items-center">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-mea-culpa text-amber-200 leading-none py-1 whitespace-nowrap text-center drop-shadow-sm">
              The Page of You
            </h2>
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent my-1 select-none" />
            <p className="text-[11px] sm:text-xs font-serif italic text-amber-200/90 tracking-wide">
              Personalised Name Origins, Acrostic Poetry & Cultural Archive
            </p>
          </div>

          <p className="max-w-2xl text-xs sm:text-sm text-stone-300 leading-relaxed">
            Discover the deep history, origin meanings, and custom acrostic poetry tied to your name. Explore authentic book quotes, famous song lyrics, video game appearances, and fine art pieces celebrating the story behind every name.
          </p>

          <div className="flex items-center flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium pt-1">
            <button
              id="btn-footer-coffee"
              onClick={() => setIsCoffeeOpen(true)}
              className="text-amber-300 hover:text-amber-200 transition-colors underline decoration-amber-400/60 underline-offset-4 flex items-center gap-1.5"
            >
              <span>Buy me a coffee</span>
              <span>☕</span>
            </button>
            <span className="text-stone-700 hidden sm:inline">•</span>
            <button
              id="btn-footer-share"
              onClick={() => setIsShareOpen(true)}
              className="text-stone-300 hover:text-white transition-colors"
            >
              Share Keepsake Card
            </button>
            <span className="text-stone-700 hidden sm:inline">•</span>
            <button
              id="btn-footer-scroll-top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-stone-300 hover:text-white transition-colors"
            >
              Back to Top ↑
            </button>
          </div>

          <div className="pt-4 border-t border-stone-800/80 w-full flex flex-col items-center justify-center gap-3 text-xs text-stone-400">
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
              <p>© {new Date().getFullYear()} <span className="text-amber-200/90 font-medium">thepageofyou.com</span>. Personalised name history & cultural discovery.</p>
              <button
                id="btn-footer-privacy-policy"
                onClick={() => setIsPrivacyOpen(true)}
                className="text-stone-400 hover:text-amber-200 transition-colors underline decoration-stone-600 underline-offset-4 font-medium flex items-center gap-1.5"
              >
                <span>Privacy Policy & Cookies</span>
              </button>
            </div>
            <p id="our-friends-links" className="text-xs text-stone-400 text-center flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="text-stone-300 font-medium">Our Friends:</span>
              <a
                href="https://www.mikegalactic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-400 hover:text-amber-300 transition-colors underline underline-offset-2"
              >
                MikeGalactic
              </a>
              <span className="text-stone-600">•</span>
              <a
                href="https://evolvedpapercraft.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-400 hover:text-amber-300 transition-colors underline underline-offset-2"
              >
                EvolvedPapercraft
              </a>
              <span className="text-stone-600">•</span>
              <a
                href="https://metanode.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-400 hover:text-amber-300 transition-colors underline underline-offset-2"
              >
                Metanode
              </a>
            </p>
            <p id="affiliate-disclosure" className="text-[11px] text-stone-500 text-center max-w-2xl leading-relaxed pt-1">
              <strong className="text-stone-400 font-medium">Affiliate Disclosure:</strong> As an Amazon Associate, The Page of You earns from qualifying purchases made through links on this site at no extra cost to you.
            </p>
          </div>
        </div>
      </footer>

      {/* Modals & Banners */}
      <CoffeeModal
        isOpen={isCoffeeOpen}
        onClose={() => setIsCoffeeOpen(false)}
      />

      <ShareCardModal
        data={nameData}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        onManageCookies={() => setForceShowCookieBanner(true)}
      />

      <CookieBanner
        onOpenPrivacyPolicy={() => setIsPrivacyOpen(true)}
        forceShow={forceShowCookieBanner}
        onDismissForceShow={() => setForceShowCookieBanner(false)}
      />
    </div>
  );
}

export default App;
