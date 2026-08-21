import React, { useState, useEffect } from 'react';
import { Search, Sparkles, RefreshCcw, Square, ArrowDown, CheckCircle2, BookOpen, Music2, Feather, Image } from 'lucide-react';

interface NameSearchProps {
  currentName: string;
  onSearch: (name: string) => void;
  onCancelSearch?: () => void;
  isLoading: boolean;
  popularNames?: string[];
  onScrollToResults?: () => void;
}

const DEFAULT_SAMPLE_NAMES = ['Jude', 'Eleanor', 'Sarah', 'Michael', 'Rhiannon', 'Maya', 'Daniel', 'Alice'];

export const NameSearch: React.FC<NameSearchProps> = ({
  currentName,
  onSearch,
  onCancelSearch,
  isLoading,
  popularNames = DEFAULT_SAMPLE_NAMES,
  onScrollToResults,
}) => {
  const [inputVal, setInputVal] = useState(currentName);
  const [justGenerated, setJustGenerated] = useState(false);
  const displayNames = popularNames && popularNames.length > 0 ? popularNames.slice(0, 10) : DEFAULT_SAMPLE_NAMES;

  useEffect(() => {
    setInputVal(currentName);
  }, [currentName]);

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

  const handleSelectPreset = (name: string) => {
    if (isLoading && onCancelSearch) {
      onCancelSearch();
    }
    setInputVal(name);
    setJustGenerated(true);
    onSearch(name);
  };

  const handleExploreClick = () => {
    if (onScrollToResults) {
      onScrollToResults();
    } else {
      const target = document.getElementById('vibe-meter-section') || document.getElementById('quote-section');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto my-6 sm:my-8 px-4 sm:px-6">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-stone-200/80 text-center relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-stone-100/60 rounded-full blur-3xl pointer-events-none" />

        <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tight mb-2">
          Enter Your Name
        </h2>
        <p className="text-sm text-stone-600 max-w-xl mx-auto mb-5">
          Discover books, songs, movies, video games, and fine art where your name lives in cultural history.
        </p>

        {/* Feature Output Badges - Instant clarity on what gets created */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100/90 text-stone-700 border border-stone-200/90 text-xs font-medium">
            <BookOpen className="w-3.5 h-3.5 text-stone-600" />
            <span>Origin & Meaning</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100/90 text-stone-700 border border-stone-200/90 text-xs font-medium">
            <Music2 className="w-3.5 h-3.5 text-stone-600" />
            <span>Literature & Song Quotes</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100/90 text-stone-700 border border-stone-200/90 text-xs font-medium">
            <Feather className="w-3.5 h-3.5 text-stone-600" />
            <span>Custom Acrostic Poem</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100/90 text-stone-700 border border-stone-200/90 text-xs font-medium">
            <Image className="w-3.5 h-3.5 text-stone-600" />
            <span>Keepsake Cards</span>
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto">
          <div className="relative w-full">
            <input
              id="input-name-search"
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="e.g. Eleanor, Jude, Sarah, Maya..."
              maxLength={30}
              className="w-full bg-stone-50/80 border border-stone-300 focus:border-stone-800 focus:bg-white text-stone-900 text-base rounded-xl px-4 py-3.5 pl-11 shadow-inner focus:outline-none transition-all placeholder:text-stone-400 font-medium"
            />
            <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="btn-search-submit"
              type="submit"
              disabled={!inputVal.trim()}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-100 font-semibold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
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
                className="px-4 py-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-sm border border-rose-200 transition-all active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs"
                title="Stop search"
              >
                <Square className="w-4 h-4 fill-rose-600 text-rose-600" />
                <span>Stop</span>
              </button>
            )}
          </div>
        </form>

        {/* Completion Prompt Banner when search finishes */}
        {!isLoading && justGenerated && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200/80 max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-stone-800 text-xs sm:text-sm animate-fade-in shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-medium">
                Page ready for <strong className="font-serif text-stone-900">{currentName}</strong>!
              </span>
            </div>
            <button
              type="button"
              onClick={handleExploreClick}
              className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-200 font-semibold text-xs flex items-center gap-1 transition-all active:scale-95 shrink-0"
            >
              <span>Explore Results</span>
              <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            </button>
          </div>
        )}

        {/* Quick Sample Presets */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-stone-500 font-medium">Popular:</span>
          {displayNames.map((sample) => (
            <button
              key={sample}
              id={`preset-btn-${sample.toLowerCase()}`}
              type="button"
              onClick={() => handleSelectPreset(sample)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                currentName.toLowerCase() === sample.toLowerCase()
                  ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                  : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
              }`}
            >
              {sample}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

