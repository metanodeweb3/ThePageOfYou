import React, { useMemo } from 'react';
import {
  BookOpen,
  Music,
  Film,
  Gamepad2,
  Palette,
  Feather,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { POPULAR_NAMES_DATA } from '../data/names';
import { getCuratedDirectoryNames, getNameSlug } from '../utils/seo';

interface HomeShowcaseProps {
  onNavigate: (path: string) => void;
}

const ACCENT_STYLES = [
  {
    border: 'border-t-4 border-t-amber-500 border-stone-200/80 hover:border-amber-400',
    badge: 'bg-amber-50 text-amber-900 border-amber-200/80',
    monogram: 'bg-stone-900 text-amber-300 border-amber-500/40',
    cta: 'text-amber-900 group-hover:text-amber-700',
  },
  {
    border: 'border-t-4 border-t-emerald-500 border-stone-200/80 hover:border-emerald-400',
    badge: 'bg-emerald-50 text-emerald-900 border-emerald-200/80',
    monogram: 'bg-emerald-950 text-emerald-200 border-emerald-500/40',
    cta: 'text-emerald-900 group-hover:text-emerald-700',
  },
  {
    border: 'border-t-4 border-t-sky-500 border-stone-200/80 hover:border-sky-400',
    badge: 'bg-sky-50 text-sky-900 border-sky-200/80',
    monogram: 'bg-sky-950 text-sky-200 border-sky-500/40',
    cta: 'text-sky-900 group-hover:text-sky-700',
  },
  {
    border: 'border-t-4 border-t-violet-500 border-stone-200/80 hover:border-violet-400',
    badge: 'bg-violet-50 text-violet-900 border-violet-200/80',
    monogram: 'bg-violet-950 text-violet-200 border-violet-500/40',
    cta: 'text-violet-900 group-hover:text-violet-700',
  },
  {
    border: 'border-t-4 border-t-rose-500 border-stone-200/80 hover:border-rose-400',
    badge: 'bg-rose-50 text-rose-900 border-rose-200/80',
    monogram: 'bg-rose-950 text-rose-200 border-rose-500/40',
    cta: 'text-rose-900 group-hover:text-rose-700',
  },
];

export const HomeShowcase: React.FC<HomeShowcaseProps> = ({ onNavigate }) => {
  const allCurated = useMemo(() => getCuratedDirectoryNames(), []);
  // Highlight 12 iconic names on the homepage so it stays scannable, linking to the full directory for all 60+
  const featuredNames = useMemo(() => allCurated.slice(0, 12), [allCurated]);

  // Pull 5 real sample highlights across DIFFERENT names so the homepage showcases the vibrant
  // 5-colour palette immediately without duplicating any single name page
  const sampleBook = POPULAR_NAMES_DATA.alice?.books?.[0];
  const sampleSong = POPULAR_NAMES_DATA.jude?.songs?.[0];
  const sampleMovie = POPULAR_NAMES_DATA.eleanor?.movies?.[0];
  const sampleGame = POPULAR_NAMES_DATA.maya?.games?.[0];
  const sampleArt = POPULAR_NAMES_DATA.sarah?.art?.[0];
  const sampleAcrostic = POPULAR_NAMES_DATA.eleanor?.acrostic?.slice(0, 4) || [];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 space-y-10 pb-8">
      {/* Signature Dark Espresso & Amber Gold Showcase Banner (restores warm archival contrast immediately on /) */}
      <section className="bg-gradient-to-r from-amber-900 via-stone-900 to-amber-950 text-stone-100 rounded-2xl p-6 sm:p-8 shadow-md border border-amber-700/40 relative overflow-clip">
        <div className="absolute -top-16 -right-16 w-60 h-60 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Curated Cultural Archive &amp; Live Discovery</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-tight">
              Every Name Has a Story Across Books, Songs, Film, Games &amp; Art
            </h2>
            <p className="text-sm text-stone-300 leading-relaxed">
              Explore verified cultural references, deep linguistic etymology, and a custom acrostic poem — complete with downloadable keepsake cards in archival colour themes.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href="/names"
                onClick={(e) => handleLinkClick(e, '/names')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
              >
                <span>Browse Curated Names A–Z</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/books"
                onClick={(e) => handleLinkClick(e, '/books')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-amber-200 border border-amber-500/30 font-semibold text-xs transition-all"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Books</span>
              </a>
              <a
                href="/songs-with-names"
                onClick={(e) => handleLinkClick(e, '/songs-with-names')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-emerald-200 border border-emerald-500/30 font-semibold text-xs transition-all"
              >
                <Music className="w-3.5 h-3.5 text-emerald-400" />
                <span>Songs</span>
              </a>
              <a
                href="/film-and-tv"
                onClick={(e) => handleLinkClick(e, '/film-and-tv')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-sky-200 border border-sky-500/30 font-semibold text-xs transition-all"
              >
                <Film className="w-3.5 h-3.5 text-sky-400" />
                <span>Film &amp; TV</span>
              </a>
              <a
                href="/video-games"
                onClick={(e) => handleLinkClick(e, '/video-games')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-violet-200 border border-violet-500/30 font-semibold text-xs transition-all"
              >
                <Gamepad2 className="w-3.5 h-3.5 text-violet-400" />
                <span>Games</span>
              </a>
              <a
                href="/fine-art"
                onClick={(e) => handleLinkClick(e, '/fine-art')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-rose-200 border border-rose-500/30 font-semibold text-xs transition-all"
              >
                <Palette className="w-3.5 h-3.5 text-rose-400" />
                <span>Art</span>
              </a>
              <a
                href="/acrostic-name-poems"
                onClick={(e) => handleLinkClick(e, '/acrostic-name-poems')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-amber-200 border border-amber-500/30 font-semibold text-xs transition-all"
              >
                <Feather className="w-3.5 h-3.5 text-amber-300" />
                <span>Acrostic Poems</span>
              </a>
            </div>
          </div>

          {/* Live Dark & Gold Acrostic Snippet Preview */}
          <div className="lg:col-span-5 bg-stone-950/70 rounded-xl p-4 sm:p-5 border border-amber-500/30 shadow-inner">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5 mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">
                  Example Acrostic Keepsake
                </p>
                <p className="font-serif font-bold text-base text-white">Eleanor · Old French / Greek</p>
              </div>
              <a
                href="/name/eleanor"
                onClick={(e) => handleLinkClick(e, '/name/eleanor')}
                className="text-xs font-semibold text-amber-300 hover:text-amber-200 underline underline-offset-2"
              >
                Full Page &rarr;
              </a>
            </div>
            <div className="space-y-2 font-serif">
              {sampleAcrostic.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm">
                  <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black flex items-center justify-center shrink-0">
                    {item.letter}
                  </span>
                  <span className="text-stone-200 italic line-clamp-1">{item.line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5 Signature Colour-Coded Cultural Glimpses (Amber, Emerald, Sky, Violet, Rose) */}
      <section aria-labelledby="five-pillars-heading">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-800 mb-1">
              Five Cultural Dimensions
            </p>
            <h2
              id="five-pillars-heading"
              className="text-2xl font-serif font-bold text-stone-900 tracking-tight"
            >
              A Taste of the Archive Across Every Medium
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Amber — Literature */}
          {sampleBook && (
            <a
              href="/name/alice"
              onClick={(e) => handleLinkClick(e, '/name/alice')}
              className="group bg-white rounded-2xl p-5 border border-amber-200/90 border-l-4 border-l-amber-600 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                    <BookOpen className="w-3 h-3 text-amber-700" />
                    Literature
                  </span>
                  <span className="text-xs font-semibold text-amber-800">Alice &rarr;</span>
                </div>
                <h3 className="text-base font-serif font-bold text-stone-900">{sampleBook.title}</h3>
                <p className="text-xs text-stone-500">by {sampleBook.author}</p>
                <blockquote className="text-xs sm:text-sm font-serif italic text-stone-800 bg-amber-50/50 p-3 rounded-xl border border-amber-100 mt-2.5 line-clamp-3">
                  {sampleBook.quote}
                </blockquote>
              </div>
            </a>
          )}

          {/* Emerald — Songs & Lyrics */}
          {sampleSong && (
            <a
              href="/name/jude"
              onClick={(e) => handleLinkClick(e, '/name/jude')}
              className="group bg-white rounded-2xl p-5 border border-emerald-200/90 border-l-4 border-l-emerald-600 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    <Music className="w-3 h-3 text-emerald-700" />
                    Song Lyric
                  </span>
                  <span className="text-xs font-semibold text-emerald-800">Jude &rarr;</span>
                </div>
                <h3 className="text-base font-serif font-bold text-stone-900">{sampleSong.title}</h3>
                <p className="text-xs text-stone-500">by {sampleSong.artist}</p>
                <blockquote className="text-xs sm:text-sm font-serif italic text-stone-800 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 mt-2.5 line-clamp-3">
                  {sampleSong.lyricsQuote}
                </blockquote>
              </div>
            </a>
          )}

          {/* Sky — Film & TV */}
          {sampleMovie && (
            <a
              href="/name/eleanor"
              onClick={(e) => handleLinkClick(e, '/name/eleanor')}
              className="group bg-white rounded-2xl p-5 border border-sky-200/90 border-l-4 border-l-sky-600 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-900 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                    <Film className="w-3 h-3 text-sky-700" />
                    Cinema &amp; TV
                  </span>
                  <span className="text-xs font-semibold text-sky-800">Eleanor &rarr;</span>
                </div>
                <h3 className="text-base font-serif font-bold text-stone-900">{sampleMovie.title}</h3>
                <p className="text-xs text-stone-500">{sampleMovie.character || sampleMovie.year}</p>
                <blockquote className="text-xs sm:text-sm font-serif italic text-stone-800 bg-sky-50/50 p-3 rounded-xl border border-sky-100 mt-2.5 line-clamp-3">
                  {sampleMovie.quote}
                </blockquote>
              </div>
            </a>
          )}

          {/* Violet — Video Games */}
          {sampleGame && (
            <a
              href="/name/maya"
              onClick={(e) => handleLinkClick(e, '/name/maya')}
              className="group bg-white rounded-2xl p-5 border border-violet-200/90 border-l-4 border-l-violet-600 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-violet-900 bg-violet-50 px-2.5 py-0.5 rounded border border-violet-200">
                    <Gamepad2 className="w-3 h-3 text-violet-700" />
                    Video Games
                  </span>
                  <span className="text-xs font-semibold text-violet-800">Maya &rarr;</span>
                </div>
                <h3 className="text-base font-serif font-bold text-stone-900">{sampleGame.title}</h3>
                <p className="text-xs text-stone-500">{sampleGame.developer || sampleGame.year}</p>
                <blockquote className="text-xs sm:text-sm font-serif italic text-stone-800 bg-violet-50/50 p-3 rounded-xl border border-violet-100 mt-2.5 line-clamp-3">
                  {sampleGame.quote}
                </blockquote>
              </div>
            </a>
          )}

          {/* Rose — Fine Art */}
          {sampleArt && (
            <a
              href="/name/sarah"
              onClick={(e) => handleLinkClick(e, '/name/sarah')}
              className="group bg-white rounded-2xl p-5 border border-rose-200/90 border-l-4 border-l-rose-600 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-900 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
                    <Palette className="w-3 h-3 text-rose-700" />
                    Fine Art
                  </span>
                  <span className="text-xs font-semibold text-rose-800">Sarah &rarr;</span>
                </div>
                <h3 className="text-base font-serif font-bold text-stone-900">{sampleArt.title}</h3>
                <p className="text-xs text-stone-500">by {sampleArt.artist}</p>
                <blockquote className="text-xs sm:text-sm font-serif italic text-stone-800 bg-rose-50/50 p-3 rounded-xl border border-rose-100 mt-2.5 line-clamp-3">
                  {sampleArt.quote}
                </blockquote>
              </div>
            </a>
          )}

          {/* Dark Gold — Acrostic Hub CTA Card */}
          <a
            href="/acrostic-name-poems"
            onClick={(e) => handleLinkClick(e, '/acrostic-name-poems')}
            className="group bg-stone-900 text-stone-100 rounded-2xl p-5 border border-amber-500/40 shadow-sm hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between"
          >
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded border border-amber-500/30 mb-2.5">
                <Feather className="w-3 h-3" />
                Bespoke Verse
              </span>
              <h3 className="text-lg font-serif font-bold text-white">
                Custom Acrostic Poems &amp; Printable Keepsakes
              </h3>
              <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed">
                Explore handcrafted acrostic poems across our curated archive, ready to preview in archival themes and download as crisp PNG keepsakes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-xs font-bold text-amber-300 group-hover:text-amber-200">
              <span>Explore Acrostic Poems</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </a>
        </div>
      </section>

      {/* Featured Curated Names Grid (Richly Coloured Monogram Cards + Internal Links) */}
      <section aria-labelledby="featured-archive-heading">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-800 mb-1">
              Curated Name Archive
            </p>
            <h2
              id="featured-archive-heading"
              className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight"
            >
              Featured Name Etymologies &amp; Cultural Pages
            </h2>
          </div>
          <a
            href="/names"
            onClick={(e) => handleLinkClick(e, '/names')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-900 hover:text-amber-700 transition-colors"
          >
            <span>Browse Curated Names A–Z</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredNames.map((entry, idx) => {
            const href = `/name/${getNameSlug(entry.name)}`;
            const accent = ACCENT_STYLES[idx % ACCENT_STYLES.length];
            const initial = entry.name.trim()[0]?.toUpperCase() || 'A';

            return (
              <a
                key={entry.slug}
                href={href}
                onClick={(e) => handleLinkClick(e, href)}
                className={`group bg-white rounded-2xl p-5 border shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${accent.border}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-9 h-9 rounded-xl border font-serif font-black text-base flex items-center justify-center shrink-0 shadow-xs ${accent.monogram}`}
                      >
                        {initial}
                      </span>
                      <div>
                        <h3 className="text-lg font-serif font-bold text-stone-900 group-hover:text-amber-900 transition-colors leading-tight">
                          {entry.name}
                        </h3>
                        <p className="text-[11px] font-medium text-stone-500">{entry.origin}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-serif italic text-stone-700 mt-3 leading-relaxed">
                    &ldquo;{entry.meaning}&rdquo;
                  </p>
                </div>

                <div
                  className={`mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold ${accent.cta}`}
                >
                  <span>View etymology &amp; acrostic poem</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </a>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <a
            href="/names"
            onClick={(e) => handleLinkClick(e, '/names')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-200 font-bold text-sm shadow-md transition-all active:scale-95"
          >
            <span>Browse Curated Names A–Z</span>
            <ArrowRight className="w-4 h-4 text-amber-300" />
          </a>
        </div>
      </section>
    </div>
  );
};
