import React, { useMemo, useState, useEffect } from 'react';
import {
  BookOpen,
  Film,
  Gamepad2,
  Palette,
  Search,
  ArrowRight,
  ExternalLink,
  Music,
  Feather,
  BookMarked,
  Sparkles,
  X,
} from 'lucide-react';
import {
  formatDisplayName,
  getCuratedBooksIndex,
  getCuratedMoviesIndex,
  getCuratedGamesIndex,
  getCuratedArtIndex,
  isValidNameInput,
  stripOuterQuotes,
} from '../utils/seo';
import {
  getAmazonBookUrl,
  getAmazonMovieUrl,
  getAmazonGameUrl,
  getAmazonArtUrl,
} from '../utils/amazon';

export type MediaHubCategory = 'books' | 'movies' | 'games' | 'art';

interface MediaHubProps {
  category: MediaHubCategory;
  onNavigate: (path: string) => void;
  onSearchName?: (name: string) => void;
  onSearchYourName?: () => void;
}

interface UnifiedMediaEntry {
  id: string;
  slug: string;
  name: string;
  origin: string;
  title: string;
  subtitle: string;
  meta?: string;
  year?: string;
  quote: string;
  amazonUrl: string;
  amazonLabel: string;
}

const HUB_CONFIG: Record<
  MediaHubCategory,
  {
    breadcrumb: string;
    badge: string;
    heading: string;
    description: string;
    placeholder: string;
    emptyNoun: string;
    heroBg: string;
    heroGlow: string;
    badgeClasses: string;
    pillActive: string;
    pillHover: string;
    cardBorder: string;
    nameChip: string;
    subtitleColor: string;
    quoteBorder: string;
    amazonClasses: string;
    searchRing: string;
    searchIconColor: string;
    icon: React.ReactNode;
  }
> = {
  books: {
    breadcrumb: 'Books & Literature',
    badge: 'Curated Literary Archive',
    heading: 'Books & Literary Quotes Featuring Names',
    description:
      'Discover celebrated novels, classic literature, and memorable passages tied to names. Filter by name, author, or title, then explore each name’s full etymology and bespoke acrostic poem.',
    placeholder: 'Filter by name, book title, author, or quote (e.g. Jane Austen, Eleanor, Gatsby)...',
    emptyNoun: 'books',
    heroBg: 'from-amber-950 via-stone-900 to-amber-950 text-amber-50 border-amber-700/40',
    heroGlow: 'bg-amber-500/15',
    badgeClasses: 'bg-amber-500/15 border-amber-400/30 text-amber-300',
    pillActive: 'bg-amber-800 text-white shadow-2xs',
    pillHover: 'bg-stone-100 text-stone-600 hover:bg-amber-50 hover:text-amber-900',
    cardBorder: 'border-amber-200/80 hover:border-amber-400',
    nameChip: 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900',
    subtitleColor: 'text-amber-800',
    quoteBorder: 'border-amber-400/80',
    amazonClasses: 'text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border-amber-200/80',
    searchRing: 'focus:ring-amber-600/30 focus:border-amber-600',
    searchIconColor: 'text-amber-700',
    icon: <BookOpen className="w-3.5 h-3.5" />,
  },
  movies: {
    breadcrumb: 'Film & TV',
    badge: 'Curated Cinema & Television Archive',
    heading: 'Iconic Film & TV Quotes Featuring Names',
    description:
      'Explore unforgettable characters, classic cinema dialogue, and television moments connected to names. Filter by name, title, character, or actor, then open any name’s complete cultural profile.',
    placeholder: 'Filter by name, film/TV title, character, or actor (e.g. Breaking Bad, Alice, Jude)...',
    emptyNoun: 'film and TV references',
    heroBg: 'from-sky-950 via-stone-900 to-sky-950 text-sky-50 border-sky-700/40',
    heroGlow: 'bg-sky-500/15',
    badgeClasses: 'bg-sky-500/15 border-sky-400/30 text-sky-300',
    pillActive: 'bg-sky-800 text-white shadow-2xs',
    pillHover: 'bg-stone-100 text-stone-600 hover:bg-sky-50 hover:text-sky-900',
    cardBorder: 'border-sky-200/80 hover:border-sky-400',
    nameChip: 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-900',
    subtitleColor: 'text-sky-800',
    quoteBorder: 'border-sky-400/80',
    amazonClasses: 'text-sky-900 hover:text-sky-950 bg-sky-50 hover:bg-sky-100 border-sky-200/80',
    searchRing: 'focus:ring-sky-600/30 focus:border-sky-600',
    searchIconColor: 'text-sky-700',
    icon: <Film className="w-3.5 h-3.5" />,
  },
  games: {
    breadcrumb: 'Video Games',
    badge: 'Curated Gaming & Lore Archive',
    heading: 'Video Games & Gaming Lore Featuring Names',
    description:
      'Browse celebrated PC and console video games, iconic characters, and gaming lore connected to names. Filter by name, game title, or studio, then uncover each name’s etymology and poem.',
    placeholder: 'Filter by name, game title, character, or studio (e.g. Zelda, Maya, Nintendo)...',
    emptyNoun: 'video games',
    heroBg: 'from-violet-950 via-stone-900 to-violet-950 text-violet-50 border-violet-700/40',
    heroGlow: 'bg-violet-500/15',
    badgeClasses: 'bg-violet-500/15 border-violet-400/30 text-violet-300',
    pillActive: 'bg-violet-800 text-white shadow-2xs',
    pillHover: 'bg-stone-100 text-stone-600 hover:bg-violet-50 hover:text-violet-900',
    cardBorder: 'border-violet-200/80 hover:border-violet-400',
    nameChip: 'bg-violet-50 hover:bg-violet-100 border-violet-200 text-violet-900',
    subtitleColor: 'text-violet-800',
    quoteBorder: 'border-violet-400/80',
    amazonClasses: 'text-violet-900 hover:text-violet-950 bg-violet-50 hover:bg-violet-100 border-violet-200/80',
    searchRing: 'focus:ring-violet-600/30 focus:border-violet-600',
    searchIconColor: 'text-violet-700',
    icon: <Gamepad2 className="w-3.5 h-3.5" />,
  },
  art: {
    breadcrumb: 'Fine Art',
    badge: 'Curated Fine Art & Masters Archive',
    heading: 'Fine Art & Famous Artists Connected to Names',
    description:
      'Explore museum masterpieces, celebrated portraits, and renowned artists tied to names. Filter by name, artwork, or artist, then open any name’s etymology and custom acrostic keepsake.',
    placeholder: 'Filter by name, artwork, artist, or medium (e.g. Monet, Salvador, Oil on canvas)...',
    emptyNoun: 'artworks',
    heroBg: 'from-rose-950 via-stone-900 to-rose-950 text-rose-50 border-rose-700/40',
    heroGlow: 'bg-rose-500/15',
    badgeClasses: 'bg-rose-500/15 border-rose-400/30 text-rose-300',
    pillActive: 'bg-rose-800 text-white shadow-2xs',
    pillHover: 'bg-stone-100 text-stone-600 hover:bg-rose-50 hover:text-rose-900',
    cardBorder: 'border-rose-200/80 hover:border-rose-400',
    nameChip: 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-900',
    subtitleColor: 'text-rose-800',
    quoteBorder: 'border-rose-400/80',
    amazonClasses: 'text-rose-900 hover:text-rose-950 bg-rose-50 hover:bg-rose-100 border-rose-200/80',
    searchRing: 'focus:ring-rose-600/30 focus:border-rose-600',
    searchIconColor: 'text-rose-700',
    icon: <Palette className="w-3.5 h-3.5" />,
  },
};

export const MediaHub: React.FC<MediaHubProps> = ({
  category,
  onNavigate,
  onSearchName,
  onSearchYourName,
}) => {
  const [query, setQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');

  useEffect(() => {
    setQuery('');
    setSelectedLetter('ALL');
  }, [category]);

  const cfg = HUB_CONFIG[category];

  const allItems: UnifiedMediaEntry[] = useMemo(() => {
    if (category === 'books') {
      return getCuratedBooksIndex().map((b) => ({
        id: b.id,
        slug: b.slug,
        name: b.name,
        origin: b.origin,
        title: b.title,
        subtitle: `by ${b.author}`,
        meta: b.context,
        year: b.year,
        quote: b.quote,
        amazonUrl: getAmazonBookUrl(b.title, b.author),
        amazonLabel: 'Amazon Books',
      }));
    }
    if (category === 'movies') {
      return getCuratedMoviesIndex().map((m) => ({
        id: m.id,
        slug: m.slug,
        name: m.name,
        origin: m.origin,
        title: m.title,
        subtitle: [m.character, m.actor ? `(${m.actor})` : ''].filter(Boolean).join(' ') || 'Featured Screen Reference',
        year: m.year,
        quote: m.quote,
        amazonUrl: getAmazonMovieUrl(m.title),
        amazonLabel: 'Prime Video',
      }));
    }
    if (category === 'games') {
      return getCuratedGamesIndex().map((g) => ({
        id: g.id,
        slug: g.slug,
        name: g.name,
        origin: g.origin,
        title: g.title,
        subtitle: [g.character, g.developer].filter(Boolean).join(' • ') || 'Video Game Archive',
        year: g.year,
        quote: g.quote,
        amazonUrl: getAmazonGameUrl(g.title),
        amazonLabel: 'Amazon Games',
      }));
    }
    return getCuratedArtIndex().map((a) => ({
      id: a.id,
      slug: a.slug,
      name: a.name,
      origin: a.origin,
      title: a.title,
      subtitle: `by ${a.artist}`,
      meta: a.medium,
      year: a.year,
      quote: a.quote,
      amazonUrl: getAmazonArtUrl(a.title, a.artist),
      amazonLabel: 'Art Prints',
    }));
  }, [category]);

  const letters = useMemo(() => {
    const set = new Set(allItems.map((item) => item.name[0]?.toUpperCase() || '#'));
    return Array.from(set).sort();
  }, [allItems]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems.filter((item) => {
      if (selectedLetter !== 'ALL' && item.name[0]?.toUpperCase() !== selectedLetter) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.quote.toLowerCase().includes(q) ||
        (item.meta || '').toLowerCase().includes(q)
      );
    });
  }, [allItems, query, selectedLetter]);

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
          className="hover:text-amber-800 transition-colors underline-offset-2 hover:underline"
        >
          Home
        </a>
        <span aria-hidden="true">/</span>
        <span className="text-stone-800 font-medium">{cfg.breadcrumb}</span>
      </nav>

      {/* Editorial Hero */}
      <section className={`rounded-3xl bg-gradient-to-br ${cfg.heroBg} p-6 sm:p-10 border shadow-xl relative overflow-clip`}>
        <div
          aria-hidden="true"
          className={`absolute -top-16 -right-16 w-64 h-64 rounded-full ${cfg.heroGlow} blur-3xl pointer-events-none`}
        />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest ${cfg.badgeClasses}`}>
            {cfg.icon}
            <span>{cfg.badge}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white leading-tight tracking-tight">
            {cfg.heading}
          </h1>
          <p className="text-sm sm:text-base text-stone-200/90 leading-relaxed">
            {cfg.description}
          </p>
        </div>
      </section>

      {/* Zero-API Filter & A-Z Bar */}
      <section className="rounded-2xl bg-white border border-stone-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="relative">
          <Search className={`w-4 h-4 ${cfg.searchIconColor} absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none`} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={cfg.placeholder}
            aria-label={`Filter ${cfg.breadcrumb}`}
            className={`w-full pl-10 pr-9 py-2.5 rounded-xl border border-stone-200 bg-stone-50/70 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 ${cfg.searchRing}`}
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
              selectedLetter === 'ALL' ? cfg.pillActive : cfg.pillHover
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
                selectedLetter === letter ? cfg.pillActive : cfg.pillHover
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </section>

      {/* Cards Grid */}
      {filteredItems.length > 0 ? (
        <section aria-label={`Curated ${cfg.breadcrumb}`} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredItems.map((item) => (
            <article
              key={`${item.slug}-${item.id}`}
              className={`rounded-2xl bg-white border ${cfg.cardBorder} shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between gap-4`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <a
                    href={`/name/${item.slug}`}
                    onClick={(e) => handleLinkClick(e, `/name/${item.slug}`)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors ${cfg.nameChip}`}
                  >
                    <span>{item.name}</span>
                    <span className="opacity-70 font-normal">&bull; {item.origin}</span>
                  </a>
                  {item.year && (
                    <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md shrink-0">
                      {item.year}
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900 leading-snug">
                    {item.title}
                  </h2>
                  <p className={`text-xs sm:text-sm font-medium mt-0.5 ${cfg.subtitleColor}`}>
                    {item.subtitle}
                    {category === 'art' && item.meta ? (
                      <span className="text-stone-400 font-normal"> &middot; {item.meta}</span>
                    ) : null}
                  </p>
                </div>

                <blockquote className={`pl-3.5 border-l-2 ${cfg.quoteBorder} text-sm font-serif italic text-stone-700 leading-relaxed`}>
                  &ldquo;{stripOuterQuotes(item.quote)}&rdquo;
                </blockquote>

                {category === 'books' && item.meta && (
                  <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">{item.meta}</p>
                )}
              </div>

              <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <a
                  href={`/name/${item.slug}`}
                  onClick={(e) => handleLinkClick(e, `/name/${item.slug}`)}
                  className="inline-flex items-center gap-1 font-semibold text-amber-800 hover:text-amber-950 transition-colors"
                >
                  <span>{item.name}&rsquo;s Etymology &amp; Poem</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <a
                  href={item.amazonUrl}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  className={`inline-flex items-center gap-1 font-medium px-2.5 py-1 rounded-lg border transition-colors ${cfg.amazonClasses}`}
                >
                  <span>{item.amazonLabel}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="rounded-2xl bg-white border border-stone-200 p-10 text-center space-y-4">
          <p className="font-serif text-lg text-stone-800">
            No curated {cfg.emptyNoun} matched &ldquo;{query}&rdquo;.
          </p>
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
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer"
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
            Search your own name or continue exploring curated references across literature, music, cinema, video games, fine art, and acrostic poetry.
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
          {category !== 'books' && (
            <a
              href="/books"
              onClick={(e) => handleLinkClick(e, '/books')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-amber-900 hover:bg-amber-50 border border-amber-200 text-xs font-semibold transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              <span>Books</span>
            </a>
          )}
          <a
            href="/songs-with-names"
            onClick={(e) => handleLinkClick(e, '/songs-with-names')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 border border-emerald-200 text-xs font-semibold transition-colors"
          >
            <Music className="w-3.5 h-3.5 text-emerald-700" />
            <span>Songs</span>
          </a>
          {category !== 'movies' && (
            <a
              href="/film-and-tv"
              onClick={(e) => handleLinkClick(e, '/film-and-tv')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-sky-900 hover:bg-sky-50 border border-sky-200 text-xs font-semibold transition-colors"
            >
              <Film className="w-3.5 h-3.5 text-sky-700" />
              <span>Film &amp; TV</span>
            </a>
          )}
          {category !== 'games' && (
            <a
              href="/video-games"
              onClick={(e) => handleLinkClick(e, '/video-games')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-violet-900 hover:bg-violet-50 border border-violet-200 text-xs font-semibold transition-colors"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-violet-700" />
              <span>Games</span>
            </a>
          )}
          {category !== 'art' && (
            <a
              href="/fine-art"
              onClick={(e) => handleLinkClick(e, '/fine-art')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-rose-900 hover:bg-rose-50 border border-rose-200 text-xs font-semibold transition-colors"
            >
              <Palette className="w-3.5 h-3.5 text-rose-700" />
              <span>Art</span>
            </a>
          )}
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
