import React, { useState, useMemo } from 'react';
import { Search, ArrowRight, BookMarked, Sparkles } from 'lucide-react';
import {
  DirectoryNameEntry,
  formatDisplayName,
  getCuratedDirectoryNames,
  getNameSlug,
  isValidNameInput,
} from '../utils/seo';

interface NameDirectoryProps {
  onNavigate: (path: string) => void;
  onSearchName?: (name: string) => void;
  onSearchYourName?: () => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const NameDirectory: React.FC<NameDirectoryProps> = ({
  onNavigate,
  onSearchName,
  onSearchYourName,
}) => {
  const [filterText, setFilterText] = useState('');
  const [activeLetter, setActiveLetter] = useState<string>('ALL');

  const allEntries: DirectoryNameEntry[] = useMemo(() => {
    return getCuratedDirectoryNames();
  }, []);

  const availableLetters = useMemo(() => {
    const set = new Set<string>();
    allEntries.forEach((e) => {
      const first = e.name.trim()[0]?.toUpperCase();
      if (first) set.add(first);
    });
    return set;
  }, [allEntries]);

  const filteredEntries = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    return allEntries.filter((entry) => {
      const matchesLetter =
        activeLetter === 'ALL' || entry.name.trim().toUpperCase().startsWith(activeLetter);
      const matchesQuery =
        !q ||
        entry.name.toLowerCase().includes(q) ||
        entry.origin.toLowerCase().includes(q) ||
        entry.meaning.toLowerCase().includes(q);
      return matchesLetter && matchesQuery;
    });
  }, [allEntries, activeLetter, filterText]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-stone-500 flex items-center gap-1.5">
        <a
          href="/"
          onClick={(e) => handleLinkClick(e, '/')}
          className="text-amber-900 hover:underline font-medium"
        >
          Home
        </a>
        <span>/</span>
        <span className="text-stone-700 font-medium">Browse Curated Names A–Z</span>
      </nav>

      {/* Directory Header */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-8 shadow-xs">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-amber-800 mb-2">
          <BookMarked className="w-3.5 h-3.5" />
          <span>Curated A–Z Cultural Index</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tight">
          Curated Name Etymology &amp; Cultural Archive
        </h1>
        <p className="text-sm text-stone-600 mt-2 max-w-2xl leading-relaxed">
          Browse our curated archive of verified name etymologies, origins, custom acrostic poems, and appearances across books, songs, films, video games, and fine art — or search any name in the world from the homepage.
        </p>

        {/* Instant Zero-API Filter Input */}
        <div className="mt-5 relative max-w-md">
          <label htmlFor="directory-filter-input" className="sr-only">
            Filter directory by name, origin, or meaning
          </label>
          <input
            id="directory-filter-input"
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter by name, origin (e.g. Hebrew, Greek, Welsh)..."
            className="w-full bg-stone-50 border border-stone-300 focus:border-stone-800 focus:bg-white text-stone-900 text-sm rounded-xl px-4 py-2.5 pl-10 focus:outline-none transition-all"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* A-Z Letter Filter Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveLetter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              activeLetter === 'ALL'
                ? 'bg-stone-900 text-amber-100 border-stone-900'
                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            All
          </button>
          {ALPHABET.map((letter) => {
            const hasNames = availableLetters.has(letter);
            return (
              <button
                key={letter}
                type="button"
                disabled={!hasNames}
                onClick={() => setActiveLetter(letter)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold border transition-all ${
                  activeLetter === letter
                    ? 'bg-stone-900 text-amber-100 border-stone-900 cursor-pointer'
                    : hasNames
                    ? 'bg-white text-stone-700 border-stone-200 hover:bg-amber-50 hover:border-amber-300 cursor-pointer'
                    : 'bg-stone-50/50 text-stone-300 border-stone-100 cursor-not-allowed'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Directory Grid */}
      {filteredEntries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.map((entry) => {
            const href = `/name/${getNameSlug(entry.name)}`;
            return (
              <a
                key={entry.slug}
                href={href}
                onClick={(e) => handleLinkClick(e, href)}
                className="group bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs hover:shadow-md hover:border-amber-300/80 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-xl font-serif font-bold text-stone-900 group-hover:text-amber-900 transition-colors">
                      {entry.name}
                    </h2>
                  </div>
                  <p className="text-xs font-medium text-stone-500 mt-1">{entry.origin}</p>
                  <p className="text-sm font-serif italic text-stone-700 mt-2 leading-relaxed">
                    &ldquo;{entry.meaning}&rdquo;
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-amber-900">
                  <span>Open {entry.name}&rsquo;s Archive</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </a>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-8 text-center space-y-4">
          <p className="text-sm sm:text-base font-serif text-stone-700">
            No curated names match &ldquo;{filterText}&rdquo; yet.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {onSearchName && filterText.trim() && isValidNameInput(filterText.trim()).valid ? (
              <button
                type="button"
                onClick={() => onSearchName(filterText.trim())}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-100 text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Search &ldquo;{formatDisplayName(filterText.trim())}&rdquo;</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <a
                href="/"
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                  e.preventDefault();
                  if (onSearchYourName) onSearchYourName();
                  else onNavigate('/');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-100 text-xs sm:text-sm font-semibold shadow-sm transition-all"
              >
                <Search className="w-4 h-4 text-amber-300" />
                <span>Search Your Name</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => {
                setFilterText('');
                setActiveLetter('ALL');
              }}
              className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        </div>
      )}

      {/* Invite Visitors to Search Any Name */}
      <section className="rounded-2xl bg-amber-50/80 border border-amber-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-serif font-bold text-stone-900">
            Don&rsquo;t see your name in the curated list?
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            Search any name in the world to uncover its etymology, verified cultural appearances, and custom acrostic poem.
          </p>
        </div>
        <a
          href="/"
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            e.preventDefault();
            if (onSearchYourName) onSearchYourName();
            else onNavigate('/');
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-100 text-xs font-semibold shadow-xs transition-all shrink-0"
        >
          <Search className="w-3.5 h-3.5 text-amber-300" />
          <span>Search Your Name</span>
        </a>
      </section>
    </div>
  );
};
