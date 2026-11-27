import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  RefreshCcw,
  Square,
  ArrowDown,
  CheckCircle2,
  BookOpen,
  Music2,
  Film,
  Gamepad2,
  Palette,
  Feather,
  AlertCircle,
} from 'lucide-react';
import { getNameSlug } from '../utils/seo';

interface NameSearchProps {
  currentName: string;
  isHomeHero?: boolean;
  onSearch: (name: string) => void;
  onNavigate: (path: string) => void;
  onCancelSearch?: () => void;
  isLoading: boolean;
  popularNames?: string[];
  validationError?: string | null;
  onClearError?: () => void;
  onScrollToResults?: () => void;
}

const DEFAULT_SAMPLE_NAMES = [
  'Eleanor',
  'Jude',
  'Sarah',
  'Michael',
  'Rhiannon',
  'Maya',
  'Daniel',
  'Alice',
];

export const NameSearch: React.FC<NameSearchProps> = ({
  currentName,
  isHomeHero = false,
  onSearch,
  onNavigate,
  onCancelSearch,
  isLoading,
  popularNames = DEFAULT_SAMPLE_NAMES,
  validationError = null,
  onClearError,
  onScrollToResults,
}) => {
  const [inputVal, setInputVal] = useState(isHomeHero ? '' : currentName);
  const [justGenerated, setJustGenerated] = useState(false);
  const displayNames =
    popularNames && popularNames.length > 0 ? popularNames.slice(0, 10) : DEFAULT_SAMPLE_NAMES;

  useEffect(() => {
    setInputVal(isHomeHero ? '' : currentName);
  }, [currentName, isHomeHero]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      if (isLoading && onCancelSearch) {
        onCancelSearch();
      }
      setJustGenerated(true);
      onSearch(inputVal.trim());
    }
  };

  const handlePresetClick = (e: React.MouseEvent<HTMLAnchorElement>, sample: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (isLoading && onCancelSearch) {
      onCancelSearch();
    }
    setInputVal(sample);
    setJustGenerated(true);
    onSearch(sample);
  };

  const handleDirectoryLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate('/names');
  };

  const handleHubLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(path);
  };

  const handleExploreClick = () => {
    if (onScrollToResults) {
      onScrollToResults();
    } else {
      const target =
        document.getElementById('quote-section') ||
        document.getElementById('acrostic-section') ||
        document.getElementById('name-hero-section');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div id="name-search-section" className="w-full max-w-5xl mx-auto my-5 sm:my-7 px-4 sm:px-6 scroll-mt-6">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-stone-200/80 text-center relative overflow-clip">
        {/* Subtle decorative background glow */}
        <div aria-hidden="true" className="absolute inset-0 overflow-clip rounded-2xl pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-100/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-stone-100/60 rounded-full blur-3xl" />
        </div>

        {isHomeHero ? (
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tight mb-2.5 max-w-2xl mx-auto leading-tight">
            Discover the Etymology &amp; Cultural Story Behind Any Name
          </h1>
        ) : (
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight mb-1.5">
            Explore Another Name
          </h2>
        )}

        <p className="text-sm text-stone-600 max-w-xl mx-auto mb-5">
          Uncover linguistic etymology, verified references across books, songs, films, video games, and fine art, plus a custom acrostic poem.
        </p>

        {/* Colour-Coded Clickable Category Exploration Highlights */}
        {isHomeHero && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6 max-w-2xl mx-auto">
            <a
              href="/books"
              onClick={(e) => handleHubLinkClick(e, '/books')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 text-xs font-semibold transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              <span>Books</span>
            </a>
            <a
              href="/songs-with-names"
              onClick={(e) => handleHubLinkClick(e, '/songs-with-names')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/90 text-xs font-semibold transition-colors"
            >
              <Music2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Songs &amp; Lyrics</span>
            </a>
            <a
              href="/film-and-tv"
              onClick={(e) => handleHubLinkClick(e, '/film-and-tv')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200/90 text-xs font-semibold transition-colors"
            >
              <Film className="w-3.5 h-3.5 text-sky-700" />
              <span>Film &amp; TV</span>
            </a>
            <a
              href="/video-games"
              onClick={(e) => handleHubLinkClick(e, '/video-games')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 hover:bg-violet-100 text-violet-900 border border-violet-200/90 text-xs font-semibold transition-colors"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-violet-700" />
              <span>Video Games</span>
            </a>
            <a
              href="/fine-art"
              onClick={(e) => handleHubLinkClick(e, '/fine-art')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200/90 text-xs font-semibold transition-colors"
            >
              <Palette className="w-3.5 h-3.5 text-rose-700" />
              <span>Fine Art</span>
            </a>
            <a
              href="/acrostic-name-poems"
              onClick={(e) => handleHubLinkClick(e, '/acrostic-name-poems')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 hover:bg-stone-200/80 text-stone-800 border border-stone-300/90 text-xs font-semibold transition-colors"
            >
              <Feather className="w-3.5 h-3.5 text-amber-700" />
              <span>Acrostic Poems</span>
            </a>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto"
        >
          <div className="relative w-full">
            <label htmlFor="input-name-search" className="sr-only">
              Enter a name to explore its etymology, cultural quotes, and acrostic poem
            </label>
            <input
              id="input-name-search"
              type="text"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                if (validationError && onClearError) onClearError();
              }}
              placeholder="e.g. Eleanor, Jude, Sarah, Maya..."
              maxLength={40}
              className="block w-full h-12 bg-stone-50/80 border border-stone-300 focus:border-stone-800 focus:bg-white text-stone-900 text-base leading-normal rounded-xl pr-4 pl-11 py-0 appearance-none shadow-inner focus:outline-none transition-all placeholder:text-stone-400 font-medium"
            />
            <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="btn-search-submit"
              type="submit"
              disabled={!inputVal.trim()}
              className="w-full sm:w-auto h-12 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-100 font-semibold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{inputVal.trim() ? `Discover ${inputVal.trim()}` : 'Discover'}</span>
                </>
              )}
            </button>

            {isLoading && onCancelSearch && (
              <button
                id="btn-search-stop"
                type="button"
                onClick={onCancelSearch}
                className="h-12 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-sm border border-rose-200 transition-all active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs cursor-pointer"
                title="Stop search"
              >
                <Square className="w-4 h-4 fill-rose-600 text-rose-600" />
                <span>Stop</span>
              </button>
            )}
          </div>
        </form>

        {/* Inline input validation error (saves API costs by catching invalid strings early) */}
        {validationError && (
          <div
            role="alert"
            className="mt-3 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm max-w-xl mx-auto flex items-center justify-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Completion Prompt Banner when search finishes on a name page */}
        {!isHomeHero && !isLoading && justGenerated && currentName && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200/80 max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-stone-800 text-xs sm:text-sm shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-medium">
                Page ready for <strong className="font-serif text-stone-900">{currentName}</strong>!
              </span>
            </div>
            <button
              type="button"
              id="btn-jump-to-results"
              onClick={handleExploreClick}
              className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-200 font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 shrink-0 cursor-pointer shadow-xs hover:shadow"
            >
              <span>Jump to Results</span>
              <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            </button>
          </div>
        )}

        {/* Crawlable Internal <a href="/name/..."> Links for Popular Names */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-stone-500 font-medium">Popular:</span>
          {displayNames.map((sample) => {
            const slug = getNameSlug(sample);
            const isActive = !isHomeHero && currentName.toLowerCase() === sample.toLowerCase();
            return (
              <a
                key={sample}
                id={`preset-link-${sample.toLowerCase()}`}
                href={`/name/${slug}`}
                onClick={(e) => handlePresetClick(e, sample)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                    : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                }`}
              >
                {sample}
              </a>
            );
          })}
          <a
            href="/names"
            onClick={handleDirectoryLinkClick}
            className="text-xs px-2.5 py-1 rounded-lg border border-amber-200/80 bg-amber-50/70 hover:bg-amber-100 text-amber-900 font-semibold transition-all"
          >
            Browse Curated Names A–Z &rarr;
          </a>
        </div>
      </div>
    </div>
  );
};
