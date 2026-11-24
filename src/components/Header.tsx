import React from 'react';
import { Coffee, Share2, BookMarked, Music, Feather } from 'lucide-react';

interface HeaderProps {
  activeView: 'home' | 'name' | 'directory' | 'songs-hub' | 'acrostic-hub';
  onNavigate: (path: string) => void;
  onOpenCoffee: () => void;
  onOpenShare?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onNavigate,
  onOpenCoffee,
  onOpenShare,
}) => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(path);
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
        <nav aria-label="Primary navigation" className="flex flex-wrap items-center justify-center gap-2">
          <a
            id="nav-browse-names"
            href="/names"
            onClick={(e) => handleLinkClick(e, '/names')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all active:scale-95 border ${
              activeView === 'directory'
                ? 'bg-stone-900 text-amber-200 border-stone-800'
                : 'bg-white hover:bg-amber-50 text-stone-800 border-amber-200/80'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5 text-amber-700" />
            <span>Names A–Z</span>
          </a>

          <a
            id="nav-songs-hub"
            href="/songs-with-names"
            onClick={(e) => handleLinkClick(e, '/songs-with-names')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all active:scale-95 border ${
              activeView === 'songs-hub'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-800'
                : 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 border-emerald-200/80'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-emerald-700" />
            <span>Songs With Names</span>
          </a>

          <a
            id="nav-acrostic-hub"
            href="/acrostic-name-poems"
            onClick={(e) => handleLinkClick(e, '/acrostic-name-poems')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all active:scale-95 border ${
              activeView === 'acrostic-hub'
                ? 'bg-stone-900 text-amber-200 border-amber-600/60'
                : 'bg-violet-50/80 hover:bg-violet-100 text-violet-900 border-violet-200/80'
            }`}
          >
            <Feather className="w-3.5 h-3.5 text-violet-700" />
            <span>Acrostic Poems</span>
          </a>

          {activeView === 'name' && onOpenShare && (
            <button
              id="btn-header-share"
              type="button"
              onClick={onOpenShare}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-900 hover:bg-amber-800 text-amber-100 text-xs font-semibold shadow-sm transition-all active:scale-95 border border-amber-700/60 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Share Card</span>
            </button>
          )}

          <button
            id="btn-header-coffee"
            type="button"
            onClick={onOpenCoffee}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-700" />
            <span>Buy me a coffee</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
