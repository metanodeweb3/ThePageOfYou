import React from 'react';
import {
  Search,
  Coffee,
  Share2,
  BookMarked,
  BookOpen,
  Music,
  Film,
  Gamepad2,
  Palette,
  Feather,
} from 'lucide-react';

export type HeaderActiveView =
  | 'home'
  | 'name'
  | 'directory'
  | 'books-hub'
  | 'songs-hub'
  | 'movies-hub'
  | 'games-hub'
  | 'art-hub'
  | 'acrostic-hub';

interface HeaderProps {
  activeView: HeaderActiveView;
  onNavigate: (path: string) => void;
  onSearchYourName?: () => void;
  onOpenCoffee: () => void;
  onOpenShare?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onNavigate,
  onSearchYourName,
  onOpenCoffee,
  onOpenShare,
}) => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(path);
  };

  const handleSearchClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (onSearchYourName) {
      onSearchYourName();
    } else {
      onNavigate('/');
    }
  };

  return (
    <header className="w-full bg-gradient-to-b from-[#fdfaf3] to-[#faf7f0] border-b border-amber-200/70">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col items-center justify-center gap-3.5 text-center">
        {/* Calligraphic Brand Title (uses <a> rather than <h1> so every page has a unique topical <h1>) */}
        <div className="w-fit mx-auto flex flex-col items-center">
          <a
            id="brand-title"
            href="/"
            onClick={(e) => handleLinkClick(e, '/')}
            className="text-4xl sm:text-5xl md:text-6xl font-mea-culpa text-stone-900 hover:text-amber-900 transition-colors leading-none py-1 whitespace-nowrap text-center drop-shadow-sm"
          >
            The Page of You
          </a>
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent my-1 select-none" />
          <p id="brand-subtitle" className="text-[11px] sm:text-xs font-serif italic text-stone-600 tracking-wide">
            Personalised Name Etymology, Acrostic Poetry &amp; Cultural Archive
          </p>
        </div>

        {/* Navigation & Action Bar */}
        <nav aria-label="Primary navigation" className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          <a
            id="nav-search-name"
            href="/"
            onClick={handleSearchClick}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all active:scale-95 border ${
              activeView === 'home'
                ? 'bg-stone-900 text-amber-200 border-amber-500/70 ring-2 ring-amber-400/30'
                : 'bg-stone-900 hover:bg-stone-800 text-amber-100 border-stone-800'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-amber-300" />
            <span>Search Your Name</span>
          </a>

          <a
            id="nav-browse-names"
            href="/names"
            onClick={(e) => handleLinkClick(e, '/names')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all active:scale-95 border ${
              activeView === 'directory'
                ? 'bg-stone-900 text-amber-200 border-stone-800'
                : 'bg-white hover:bg-amber-50 text-stone-800 border-amber-200/80'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5 text-amber-700" />
            <span>Names A–Z</span>
          </a>

          <a
            id="nav-books-hub"
            href="/books"
            onClick={(e) => handleLinkClick(e, '/books')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all active:scale-95 border ${
              activeView === 'books-hub'
                ? 'bg-amber-900 text-amber-100 border-amber-800'
                : 'bg-amber-50/80 hover:bg-amber-100 text-amber-950 border-amber-200/80'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
            <span>Books</span>
          </a>

          <a
            id="nav-songs-hub"
            href="/songs-with-names"
            onClick={(e) => handleLinkClick(e, '/songs-with-names')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all active:scale-95 border ${
              activeView === 'songs-hub'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-800'
                : 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 border-emerald-200/80'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-emerald-700" />
            <span>Songs</span>
          </a>

          <a
            id="nav-movies-hub"
            href="/film-and-tv"
            onClick={(e) => handleLinkClick(e, '/film-and-tv')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all active:scale-95 border ${
              activeView === 'movies-hub'
                ? 'bg-sky-900 text-sky-100 border-sky-800'
                : 'bg-sky-50/80 hover:bg-sky-100 text-sky-900 border-sky-200/80'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-sky-700" />
            <span>Film &amp; TV</span>
          </a>

          <a
            id="nav-games-hub"
            href="/video-games"
            onClick={(e) => handleLinkClick(e, '/video-games')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all active:scale-95 border ${
              activeView === 'games-hub'
                ? 'bg-violet-900 text-violet-100 border-violet-800'
                : 'bg-violet-50/80 hover:bg-violet-100 text-violet-900 border-violet-200/80'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 text-violet-700" />
            <span>Games</span>
          </a>

          <a
            id="nav-art-hub"
            href="/fine-art"
            onClick={(e) => handleLinkClick(e, '/fine-art')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all active:scale-95 border ${
              activeView === 'art-hub'
                ? 'bg-rose-900 text-rose-100 border-rose-800'
                : 'bg-rose-50/80 hover:bg-rose-100 text-rose-900 border-rose-200/80'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-rose-700" />
            <span>Art</span>
          </a>

          <a
            id="nav-acrostic-hub"
            href="/acrostic-name-poems"
            onClick={(e) => handleLinkClick(e, '/acrostic-name-poems')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all active:scale-95 border ${
              activeView === 'acrostic-hub'
                ? 'bg-stone-900 text-amber-200 border-amber-600/60'
                : 'bg-stone-100 hover:bg-stone-200/80 text-stone-800 border-stone-300/80'
            }`}
          >
            <Feather className="w-3.5 h-3.5 text-amber-700" />
            <span>Acrostic Poems</span>
          </a>

          {activeView === 'name' && onOpenShare && (
            <button
              id="btn-header-share"
              type="button"
              onClick={onOpenShare}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-900 hover:bg-amber-800 text-amber-100 text-xs font-semibold shadow-sm transition-all active:scale-95 border border-amber-700/60 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Share Card</span>
            </button>
          )}

          <button
            id="btn-header-coffee"
            type="button"
            onClick={onOpenCoffee}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-700" />
            <span>Buy me a coffee</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
