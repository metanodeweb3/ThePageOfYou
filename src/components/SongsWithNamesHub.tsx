import React, { useMemo, useState } from 'react';
import {
  Music,
  Search,
  ArrowRight,
  ExternalLink,
  Disc3,
  Feather,
  BookOpen,
  Film,
  Gamepad2,
  Palette,
  BookMarked,
  Sparkles,
  X,
} from 'lucide-react';
import {
  formatDisplayName,
  getCuratedSongsIndex,
  isValidNameInput,
  stripOuterQuotes,
} from '../utils/seo';
import { getAmazonMusicUrl } from '../utils/amazon';

interface SongsWithNamesHubProps {
  onNavigate: (path: string) => void;
  onSearchName?: (name: string) => void;
  onSearchYourName?: () => void;
}

export const SongsWithNamesHub: React.FC<SongsWithNamesHubProps> = ({
  onNavigate,
  onSearchName,
  onSearchYourName,
}) => {
  const [query, setQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');

  const allSongs = useMemo(() => getCuratedSongsIndex(), []);

  const letters = useMemo(() => {
    const set = new Set(allSongs.map((s) => s.name[0]?.toUpperCase() || '#'));
    return Array.from(set).sort();
  }, [allSongs]);

  const filteredSongs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allSongs.filter((song) => {
      if (selectedLetter !== 'ALL' && song.name[0]?.toUpperCase() !== selectedLetter) {
        return false;
      }
      if (!q) return true;
      return (
        song.name.toLowerCase().includes(q) ||
        song.title.toLowerCase().includes(q) ||
        song.artist.toLowerCase().includes(q) ||
        song.lyricsQuote.toLowerCase().includes(q)
      );
    });
  }, [allSongs, query, selectedLetter]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-12 space-y-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-stone-500 flex items-center gap-2">
        <a
          href="/"
          onClick={(e) => handleLinkClick(e, '/')}
          className="hover:text-emerald-800 transition-colors underline-offset-2 hover:underline"
        >
          Home
        </a>
        <span aria-hidden="true">/</span>
        <span className="text-stone-800 font-medium">Songs &amp; Lyrics</span>
      </nav>

      {/* Rich Emerald Editorial Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-emerald-950 via-stone-900 to-emerald-950 text-emerald-50 p-6 sm:p-10 border border-emerald-700/40 shadow-xl relative overflow-clip">
        <div
          aria-hidden="true"
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none"
        />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-widest">
            <Music className="w-3.5 h-3.5" />
            <span>Curated Music &amp; Etymology Archive</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white leading-tight tracking-tight">
            Iconic Songs &amp; Lyrics Featuring Names
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            From classic rock anthems and soulful ballads to folk legends, explore curated songs celebrating classic and modern names. Filter by name, artist, or song title, then open any name&rsquo;s full etymology and acrostic poem archive.
          </p>
        </div>
      </section>

      {/* Zero-API Filter & A-Z Bar */}
      <section className="rounded-2xl bg-white border border-stone-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name, song title, artist, or lyrics (e.g. Jude, Fleetwood Mac, Eleanor)..."
            aria-label="Filter songs and lyrics"
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-stone-200 bg-stone-50/70 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear filter"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* A-Z Letter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setSelectedLetter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              selectedLetter === 'ALL'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-emerald-50 hover:text-emerald-900'
            }`}
          >
            All
          </button>
          {letters.map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => setSelectedLetter(letter)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                selectedLetter === letter
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </section>

      {/* Song Cards Grid */}
      {filteredSongs.length > 0 ? (
        <section aria-label="Curated songs with names" className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredSongs.map((song) => (
            <article
              key={`${song.slug}-${song.id}`}
              className="rounded-2xl bg-white border border-emerald-200/80 hover:border-emerald-400 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                {/* Top Name & Era Row */}
                <div className="flex items-start justify-between gap-3">
                  <a
                    href={`/name/${song.slug}`}
                    onClick={(e) => handleLinkClick(e, `/name/${song.slug}`)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold transition-colors"
                  >
                    <span>{song.name}</span>
                    <span className="text-emerald-700/70 font-normal">&bull; {song.origin}</span>
                  </a>
                  {song.year && (
                    <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md shrink-0">
                      {song.year}
                    </span>
                  )}
                </div>

                {/* Song Title & Artist */}
                <div>
                  <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900 leading-snug">
                    {song.title}
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-emerald-800 mt-0.5 flex items-center gap-1.5">
                    <Disc3 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{song.artist}</span>
                    {song.albumVibe && (
                      <span className="text-stone-400 font-normal">&middot; {song.albumVibe}</span>
                    )}
                  </p>
                </div>

                {/* Verified Lyric Quote */}
                <blockquote className="pl-3.5 border-l-2 border-emerald-400/80 text-sm font-serif italic text-stone-700 leading-relaxed">
                  &ldquo;{stripOuterQuotes(song.lyricsQuote)}&rdquo;
                </blockquote>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <a
                  href={`/name/${song.slug}`}
                  onClick={(e) => handleLinkClick(e, `/name/${song.slug}`)}
                  className="inline-flex items-center gap-1 font-semibold text-amber-800 hover:text-amber-950 transition-colors"
                >
                  <span>{song.name}&rsquo;s Etymology &amp; Poem</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <a
                  href={getAmazonMusicUrl(song.title, song.artist)}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200/80 transition-colors"
                >
                  <span>Amazon Music</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="rounded-2xl bg-white border border-stone-200 p-10 text-center space-y-4">
          <p className="font-serif text-lg text-stone-800">No curated songs matched &ldquo;{query}&rdquo;.</p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {onSearchName && query.trim() && isValidNameInput(query.trim()).valid && (
              <button
                type="button"
                onClick={() => onSearchName(query.trim())}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-100 text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Search &ldquo;{formatDisplayName(query.trim())}&rdquo;</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedLetter('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Cross-Hub Navigation Banner */}
      <section className="rounded-2xl bg-amber-50/80 border border-amber-200 p-6 flex flex-col gap-4">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900">
            Explore More Cultural Archives
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            Search your own name or continue exploring curated references across books, cinema, video games, fine art, and acrostic poetry.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              if (onSearchYourName) onSearchYourName();
              else onNavigate('/');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 text-amber-100 hover:bg-stone-800 text-xs font-semibold transition-colors shadow-xs"
          >
            <Search className="w-3.5 h-3.5 text-amber-300" />
            <span>Search Your Name</span>
          </a>
          <a
            href="/books"
            onClick={(e) => handleLinkClick(e, '/books')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-amber-900 hover:bg-amber-50 border border-amber-200 text-xs font-semibold transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
            <span>Books</span>
          </a>
          <a
            href="/film-and-tv"
            onClick={(e) => handleLinkClick(e, '/film-and-tv')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-sky-900 hover:bg-sky-50 border border-sky-200 text-xs font-semibold transition-colors"
          >
            <Film className="w-3.5 h-3.5 text-sky-700" />
            <span>Film &amp; TV</span>
          </a>
          <a
            href="/video-games"
            onClick={(e) => handleLinkClick(e, '/video-games')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-violet-900 hover:bg-violet-50 border border-violet-200 text-xs font-semibold transition-colors"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-violet-700" />
            <span>Games</span>
          </a>
          <a
            href="/fine-art"
            onClick={(e) => handleLinkClick(e, '/fine-art')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-rose-900 hover:bg-rose-50 border border-rose-200 text-xs font-semibold transition-colors"
          >
            <Palette className="w-3.5 h-3.5 text-rose-700" />
            <span>Art</span>
          </a>
          <a
            href="/acrostic-name-poems"
            onClick={(e) => handleLinkClick(e, '/acrostic-name-poems')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 text-amber-200 hover:bg-stone-800 text-xs font-semibold transition-colors"
          >
            <Feather className="w-3.5 h-3.5 text-amber-400" />
            <span>Acrostic Poems</span>
          </a>
          <a
            href="/names"
            onClick={(e) => handleLinkClick(e, '/names')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-stone-800 hover:bg-stone-50 border border-stone-300 text-xs font-semibold transition-colors"
          >
            <BookMarked className="w-3.5 h-3.5 text-amber-700" />
            <span>Browse Curated Names A–Z</span>
          </a>
        </div>
      </section>
    </div>
  );
};
