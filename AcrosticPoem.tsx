import React from 'react';
import { Bookmark, Coffee, Share2 } from 'lucide-react';

interface HeaderProps {
  onOpenCoffee: () => void;
  onOpenShare: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCoffee,
  onOpenShare,
  isBookmarked,
  onToggleBookmark,
}) => {
  return (
    <header className="w-full bg-[#fbf9f5] border-b border-stone-200/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col items-center justify-center gap-3.5 text-center">
        {/* Front & Centre Elegant Mea Culpa Title with Divider Line */}
        <div className="w-fit mx-auto flex flex-col items-center">
          <h1 id="brand-title" className="text-4xl sm:text-5xl md:text-6xl font-mea-culpa text-stone-900 leading-none py-1 whitespace-nowrap text-center drop-shadow-sm">
            The Page of You
          </h1>
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-stone-400/80 to-transparent my-1 select-none" />
          <h2 id="brand-subtitle" className="text-[11px] sm:text-xs font-serif italic text-stone-600 tracking-wide">
            Personalised Name Origins, Acrostic Poetry & Cultural Archive
          </h2>
        </div>

        {/* Action Buttons on the line below */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            id="btn-header-bookmark"
            onClick={onToggleBookmark}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              isBookmarked
                ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-sm'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
            title="Bookmark this page for quick access"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-600 text-amber-700' : ''}`} />
            <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>

          <button
            id="btn-header-share"
            onClick={onOpenShare}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-900 hover:bg-amber-800 text-amber-100 text-xs font-semibold shadow-sm transition-all active:scale-95 border border-amber-700/60"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-300" />
            <span>Share Card</span>
          </button>

          <button
            id="btn-header-coffee"
            onClick={onOpenCoffee}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-700" />
            <span>Buy me a coffee</span>
          </button>
        </div>
      </div>
    </header>
  );
};

