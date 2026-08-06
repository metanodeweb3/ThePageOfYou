import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  BookOpen,
  Music,
  Film,
  Gamepad2,
  Palette,
  ExternalLink,
  Sparkles,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  SlidersHorizontal,
} from 'lucide-react';
import { BookQuote, SongQuote, MovieQuote, GameQuote, ArtQuote } from '../types';
import {
  getAmazonBookUrl,
  getAmazonMusicUrl,
  getAmazonMovieUrl,
  getAmazonGameUrl,
  getAmazonArtUrl,
} from '../utils/amazon';

interface QuoteSectionProps {
  personName: string;
  books: BookQuote[];
  songs: SongQuote[];
  movies: MovieQuote[];
  games?: GameQuote[];
  art?: ArtQuote[];
}

interface CarouselCategoryProps<T> {
  id: string;
  title: string;
  count: number;
  icon: React.ReactNode;
  borderColorClass: string;
  items: T[];
  renderCard: (item: T) => React.ReactNode;
}

function CarouselCategorySection<T extends { id: string }>({
  id,
  title,
  count,
  icon,
  borderColorClass,
  items,
  renderCard,
}: CarouselCategoryProps<T>) {
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(items.length > 1);
  const [currentIndex, setCurrentIndex] = useState(1);

  const updateScrollState = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);

    const cardWidth = 320;
    const index = Math.min(items.length, Math.max(1, Math.round(scrollLeft / cardWidth) + 1));
    setCurrentIndex(index);
  }, [items.length]);

  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, [updateScrollState, items]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section id={id} className="space-y-3.5">
      {/* Section Header with Navigation & Controls */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-l-4 ${borderColorClass} pl-3 py-0.5`}>
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-stone-900 font-serif text-lg sm:text-xl font-bold">{title}</h3>
          <span className="text-xs font-sans font-bold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
            {count} {count === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {/* Controls: Scroll Arrows & View Toggle */}
        <div className="flex items-center gap-2">
          {viewMode === 'carousel' && items.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-stone-500 font-mono font-medium hidden sm:inline mr-1">
                {currentIndex} / {items.length}
              </span>
              <button
                type="button"
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                className="p-1.5 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs"
                title="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                className="p-1.5 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs"
                title="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'carousel' ? 'grid' : 'carousel')}
            className="px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
            title={viewMode === 'carousel' ? 'Switch to Grid View' : 'Switch to Carousel View'}
          >
            {viewMode === 'carousel' ? (
              <>
                <LayoutGrid className="w-3.5 h-3.5 text-stone-600" />
                <span className="hidden sm:inline">Grid</span>
              </>
            ) : (
              <>
                <SlidersHorizontal className="w-3.5 h-3.5 text-stone-600" />
                <span className="hidden sm:inline">Carousel</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Media Items */}
      {viewMode === 'carousel' ? (
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex overflow-x-auto gap-3.5 sm:gap-4.5 scroll-smooth snap-x snap-mandatory pb-3 pt-1 px-1 -mx-1 horizontal-scroll-bar"
        >
          {items.map((item) => (
            <div key={item.id} className="flex-none w-[260px] sm:w-[310px] md:w-[320px] snap-start flex flex-col">
              {renderCard(item)}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 pt-1">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col">
              {renderCard(item)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export const QuoteSection: React.FC<QuoteSectionProps> = ({
  personName,
  books,
  songs,
  movies,
  games = [],
  art = [],
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'books' | 'songs' | 'movies' | 'games' | 'art'>('all');

  const totalMediaCount = books.length + songs.length + movies.length + games.length + art.length;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 mt-6 mb-4 sm:mt-8 sm:mb-6">
      {/* Category Tabs */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-5 sm:mb-6">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            id="tab-all"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-stone-900 text-amber-100 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            All Culture ({totalMediaCount})
          </button>
          <button
            id="tab-books"
            onClick={() => setActiveTab('books')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'books'
                ? 'bg-stone-900 text-amber-100 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>Books ({books.length})</span>
          </button>
          <button
            id="tab-songs"
            onClick={() => setActiveTab('songs')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'songs'
                ? 'bg-stone-900 text-amber-100 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Music className="w-4 h-4 text-emerald-600" />
            <span>Songs ({songs.length})</span>
          </button>
          <button
            id="tab-movies"
            onClick={() => setActiveTab('movies')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'movies'
                ? 'bg-stone-900 text-amber-100 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Film className="w-4 h-4 text-sky-600" />
            <span>Film & TV ({movies.length})</span>
          </button>
          <button
            id="tab-games"
            onClick={() => setActiveTab('games')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'games'
                ? 'bg-stone-900 text-amber-100 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-violet-600" />
            <span>Video Games ({games.length})</span>
          </button>
          <button
            id="tab-art"
            onClick={() => setActiveTab('art')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'art'
                ? 'bg-stone-900 text-amber-100 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Palette className="w-4 h-4 text-rose-600" />
            <span>Art & Artists ({art.length})</span>
          </button>
        </div>
      </div>

      <div className="space-y-6 sm:space-y-8">
        {/* NO MEDIA FOUND FOR UNCOMMON NAME */}
        {totalMediaCount === 0 && (
          <div id="no-media-notice" className="bg-amber-50/70 border border-amber-200 rounded-2xl p-8 text-center max-w-2xl mx-auto my-6 shadow-sm">
            <Sparkles className="w-8 h-8 text-amber-600 mx-auto mb-3" />
            <h3 className="text-lg font-serif font-bold text-stone-900">
              Unique Name Record
            </h3>
            <p className="text-sm text-stone-700 mt-2 leading-relaxed">
              No famous pop culture songs, books, movies, or video games featuring the exact name <span className="font-semibold text-stone-900">"{personName}"</span> were found in public media archives.
            </p>
            <p className="text-xs text-stone-500 mt-2">
              Your name is uniquely distinct! You can still explore the custom Acrostic poem and name meaning crafted above.
            </p>
          </div>
        )}

        {/* BOOKS SECTION */}
        {(activeTab === 'all' || activeTab === 'books') && books.length > 0 && (
          <CarouselCategorySection<BookQuote>
            id="section-books"
            title="Literary Works & Books"
            count={books.length}
            icon={<BookOpen className="w-5 h-5 text-amber-700" />}
            borderColorClass="border-amber-600"
            items={books}
            renderCard={(book) => (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full group">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Literature
                      </span>
                      <h4 className="text-base sm:text-lg font-serif font-bold text-stone-900 mt-1 leading-snug">
                        {book.title}
                      </h4>
                      <p className="text-xs text-stone-500 font-medium">
                        by {book.author} {book.year ? `(${book.year})` : ''}
                      </p>
                    </div>
                  </div>

                  <blockquote className="text-xs sm:text-sm font-serif italic text-stone-800 bg-stone-50/80 p-3 sm:p-3.5 rounded-xl border border-stone-200/60 my-2.5 leading-relaxed">
                    {book.quote}
                  </blockquote>

                  {book.context && (
                    <p className="text-xs text-stone-500 leading-relaxed mt-1.5 line-clamp-2 sm:line-clamp-3">
                      {book.context}
                    </p>
                  )}
                </div>

                <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <a
                    href={getAmazonBookUrl(book.title, book.author)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 hover:text-amber-700 bg-amber-100/70 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg border border-amber-300/60 transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-800" />
                    <span>Get Book on Amazon</span>
                    <ExternalLink className="w-3 h-3 text-amber-700" />
                  </a>
                </div>
              </div>
            )}
          />
        )}

        {/* SONGS SECTION */}
        {(activeTab === 'all' || activeTab === 'songs') && songs.length > 0 && (
          <CarouselCategorySection<SongQuote>
            id="section-songs"
            title="Songs & Lyrics"
            count={songs.length}
            icon={<Music className="w-5 h-5 text-emerald-700" />}
            borderColorClass="border-emerald-600"
            items={songs}
            renderCard={(song) => (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full group">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Song Lyric
                      </span>
                      <h4 className="text-base sm:text-lg font-serif font-bold text-stone-900 mt-1 leading-snug">
                        {song.title}
                      </h4>
                      <p className="text-xs text-stone-500 font-medium">
                        by {song.artist} {song.year ? `(${song.year})` : ''}
                      </p>
                    </div>
                  </div>

                  <blockquote className="text-xs sm:text-sm font-serif italic text-stone-800 bg-emerald-50/40 p-3 sm:p-3.5 rounded-xl border border-emerald-100 my-2.5 leading-relaxed">
                    {song.lyricsQuote}
                  </blockquote>

                  {song.albumVibe && (
                    <p className="text-xs text-stone-500 font-sans tracking-wide mt-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>Vibe: {song.albumVibe}</span>
                    </p>
                  )}
                </div>

                <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <a
                    href={getAmazonMusicUrl(song.title, song.artist)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 hover:text-emerald-700 bg-emerald-100/70 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-300/60 transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Listen on Amazon Music</span>
                    <ExternalLink className="w-3 h-3 text-emerald-700" />
                  </a>
                </div>
              </div>
            )}
          />
        )}

        {/* MOVIES SECTION */}
        {(activeTab === 'all' || activeTab === 'movies') && movies.length > 0 && (
          <CarouselCategorySection<MovieQuote>
            id="section-movies"
            title="Iconic Film & TV Quotes"
            count={movies.length}
            icon={<Film className="w-5 h-5 text-sky-700" />}
            borderColorClass="border-sky-600"
            items={movies}
            renderCard={(movie) => (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full group">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        Cinema & TV
                      </span>
                      <h4 className="text-base sm:text-lg font-serif font-bold text-stone-900 mt-1 leading-snug">
                        {movie.title}
                      </h4>
                      <p className="text-xs text-stone-500 font-medium">
                        {movie.character ? `${movie.character}` : ''}{' '}
                        {movie.actor ? `(${movie.actor})` : ''}{' '}
                        {movie.year ? `• ${movie.year}` : ''}
                      </p>
                    </div>
                  </div>

                  <blockquote className="text-xs sm:text-sm font-serif italic text-stone-800 bg-sky-50/40 p-3 sm:p-3.5 rounded-xl border border-sky-100 my-2.5 leading-relaxed">
                    {movie.quote}
                  </blockquote>
                </div>

                <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <a
                    href={getAmazonMovieUrl(movie.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-900 hover:text-sky-700 bg-sky-100/70 hover:bg-sky-100 px-2.5 py-1.5 rounded-lg border border-sky-300/60 transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-sky-800" />
                    <span>Watch on Prime Video</span>
                    <ExternalLink className="w-3 h-3 text-sky-700" />
                  </a>
                </div>
              </div>
            )}
          />
        )}

        {/* VIDEO GAMES SECTION */}
        {(activeTab === 'all' || activeTab === 'games') && games.length > 0 && (
          <CarouselCategorySection<GameQuote>
            id="section-games"
            title="Video Games & Gaming Lore"
            count={games.length}
            icon={<Gamepad2 className="w-5 h-5 text-violet-700" />}
            borderColorClass="border-violet-600"
            items={games}
            renderCard={(game) => (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full group">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-violet-800 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                        Video Game
                      </span>
                      <h4 className="text-base sm:text-lg font-serif font-bold text-stone-900 mt-1 leading-snug">
                        {game.title}
                      </h4>
                      <p className="text-xs text-stone-500 font-medium">
                        {game.character ? `${game.character}` : ''}{' '}
                        {game.developer ? `• ${game.developer}` : ''}{' '}
                        {game.year ? `(${game.year})` : ''}
                      </p>
                    </div>
                  </div>

                  <blockquote className="text-xs sm:text-sm font-serif italic text-stone-800 bg-violet-50/40 p-3 sm:p-3.5 rounded-xl border border-violet-100 my-2.5 leading-relaxed">
                    {game.quote}
                  </blockquote>
                </div>

                <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <a
                    href={getAmazonGameUrl(game.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-900 hover:text-violet-700 bg-violet-100/70 hover:bg-violet-100 px-2.5 py-1.5 rounded-lg border border-violet-300/60 transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-violet-800" />
                    <span>Find Game on Amazon</span>
                    <ExternalLink className="w-3 h-3 text-violet-700" />
                  </a>
                </div>
              </div>
            )}
          />
        )}

        {/* FINE ART & ARTISTS SECTION */}
        {(activeTab === 'all' || activeTab === 'art') && art.length > 0 && (
          <CarouselCategorySection<ArtQuote>
            id="section-art"
            title="Fine Art & Famous Artists"
            count={art.length}
            icon={<Palette className="w-5 h-5 text-rose-700" />}
            borderColorClass="border-rose-600"
            items={art}
            renderCard={(item) => (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full group">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        Artwork / Artist
                      </span>
                      <h4 className="text-base sm:text-lg font-serif font-bold text-stone-900 mt-1 leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-xs text-stone-500 font-medium">
                        by {item.artist} {item.year ? `(${item.year})` : ''} {item.medium ? `• ${item.medium}` : ''}
                      </p>
                    </div>
                  </div>

                  <blockquote className="text-xs sm:text-sm font-serif italic text-stone-800 bg-rose-50/40 p-3 sm:p-3.5 rounded-xl border border-rose-100 my-2.5 leading-relaxed">
                    {item.quote}
                  </blockquote>
                </div>

                <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <a
                    href={getAmazonArtUrl(item.title, item.artist)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-900 hover:text-rose-700 bg-rose-100/70 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-300/60 transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-rose-800" />
                    <span>Find Art & Prints</span>
                    <ExternalLink className="w-3 h-3 text-rose-700" />
                  </a>
                </div>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
};
