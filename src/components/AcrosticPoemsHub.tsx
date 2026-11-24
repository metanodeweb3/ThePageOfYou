import React, { useMemo, useState } from 'react';
import {
  Feather,
  Search,
  Download,
  ArrowRight,
  Music,
  BookOpen,
  Paintbrush,
  X,
} from 'lucide-react';
import { getCuratedAcrosticsIndex } from '../utils/seo';
import { ACROSTIC_THEMES } from '../lib/cardThemes';
import { downloadAcrosticImage } from './SharePoemModal';

interface AcrosticPoemsHubProps {
  onNavigate: (path: string) => void;
}

const GALLERY_THEME_IDS = ['obsidian', 'parchment', 'emerald', 'rose-quartz'] as const;

export const AcrosticPoemsHub: React.FC<AcrosticPoemsHubProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('obsidian');
  const [exportingSlug, setExportingSlug] = useState<string | null>(null);

  const allPoems = useMemo(() => getCuratedAcrosticsIndex(), []);

  const galleryThemes = useMemo(
    () =>
      GALLERY_THEME_IDS.map((id) => ACROSTIC_THEMES.find((t) => t.id === id)).filter(
        (t): t is NonNullable<typeof t> => Boolean(t)
      ),
    []
  );

  const activeTheme =
    galleryThemes.find((t) => t.id === selectedThemeId) || ACROSTIC_THEMES[0];

  const letters = useMemo(() => {
    const set = new Set(allPoems.map((p) => p.name[0]?.toUpperCase() || '#'));
    return Array.from(set).sort();
  }, [allPoems]);

  const filteredPoems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allPoems.filter((entry) => {
      if (selectedLetter !== 'ALL' && entry.name[0]?.toUpperCase() !== selectedLetter) {
        return false;
      }
      if (!q) return true;
      return (
        entry.name.toLowerCase().includes(q) ||
        entry.origin.toLowerCase().includes(q) ||
        entry.meaning.toLowerCase().includes(q) ||
        entry.acrostic.some((a) => a.line.toLowerCase().includes(q))
      );
    });
  }, [allPoems, query, selectedLetter]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(path);
  };

  const handleDownloadPoem = async (slug: string, fullData: (typeof allPoems)[number]['fullData']) => {
    setExportingSlug(slug);
    try {
      await downloadAcrosticImage(fullData, activeTheme);
    } catch (err) {
      console.error('Error downloading acrostic PNG from gallery:', err);
    } finally {
      setExportingSlug(null);
    }
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
        <span className="text-stone-800 font-medium">Acrostic Name Poems</span>
      </nav>

      {/* Rich Dark Espresso & Gold Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-[#1b1612] via-[#120f0d] to-[#241b12] text-amber-50 p-6 sm:p-10 border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-amber-500/15 blur-3xl pointer-events-none"
        />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-widest">
            <Feather className="w-3.5 h-3.5" />
            <span>Bespoke Verse &amp; Keepsake Prints</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-amber-50 leading-tight tracking-tight">
            Acrostic Name Poems &amp; Printable Verse Archive
          </h1>
          <p className="text-sm sm:text-base text-stone-300 leading-relaxed">
            Browse <strong className="text-amber-200">{allPoems.length} original acrostic name poems</strong> crafted around each name&rsquo;s authentic etymology and meaning. Preview the gallery in four archival keepsake palettes, download any poem as a 1200px PNG print, or open a name&rsquo;s complete cultural profile.
          </p>
        </div>
      </section>

      {/* Controls: Search, Theme Preview Switcher & A-Z Letters */}
      <section className="rounded-2xl bg-white border border-stone-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-amber-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, origin, meaning, or verse (e.g. Amelia, Oliver, Greek, star)..."
              aria-label="Search acrostic name poems"
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-stone-200 bg-stone-50/70 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600"
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

          {/* Inline Theme Switcher */}
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1 mr-1">
              <Paintbrush className="w-3.5 h-3.5 text-amber-700" />
              <span>Preview:</span>
            </span>
            {galleryThemes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => setSelectedThemeId(theme.id)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  selectedThemeId === theme.id
                    ? 'border-amber-600 bg-amber-50 text-stone-900 shadow-2xs'
                    : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span className={`w-3 h-3 rounded-full border shrink-0 ${theme.swatch}`} />
                <span className="hidden sm:inline">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* A-Z Letter Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedLetter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                selectedLetter === 'ALL'
                  ? 'bg-stone-900 text-amber-200 shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-amber-50 hover:text-amber-900'
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
                    ? 'bg-stone-900 text-amber-200 shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-amber-50 hover:text-amber-900'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
          <span className="text-xs font-semibold text-stone-500">
            Showing <span className="text-amber-800">{filteredPoems.length}</span> of {allPoems.length} poems
          </span>
        </div>
      </section>

      {/* Acrostic Gallery Grid */}
      {filteredPoems.length > 0 ? (
        <section
          aria-label="Acrostic name poem gallery"
          className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6"
        >
          {filteredPoems.map((entry) => (
            <article
              key={entry.slug}
              className={`rounded-2xl border-2 p-5 sm:p-6 shadow-md transition-all flex flex-col justify-between gap-4 ${activeTheme.previewBg}`}
            >
              <div className="space-y-3.5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className={`text-2xl font-serif font-bold tracking-tight ${activeTheme.previewTitleText}`}>
                      <a
                        href={`/name/${entry.slug}`}
                        onClick={(e) => handleLinkClick(e, `/name/${entry.slug}`)}
                        className="hover:underline underline-offset-4"
                      >
                        {entry.name}
                      </a>
                    </h2>
                    <p className={`text-xs font-serif italic mt-0.5 ${activeTheme.previewMeaningText}`}>
                      {entry.origin} &bull; &ldquo;{entry.meaning}&rdquo;
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border shrink-0 ${activeTheme.previewBadgeBg}`}
                  >
                    {entry.acrostic.length} Lines
                  </span>
                </div>

                {/* Acrostic Lines */}
                <ul className="space-y-1.5">
                  {entry.acrostic.map((item, idx) => (
                    <li
                      key={`${entry.slug}-${item.letter}-${idx}`}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border ${activeTheme.previewRowBg}`}
                    >
                      <span
                        className={`w-6 h-6 rounded-md font-serif font-bold text-xs flex items-center justify-center shrink-0 border ${activeTheme.previewBadgeBg}`}
                      >
                        {item.letter}
                      </span>
                      <span className={`text-xs sm:text-sm font-serif italic leading-snug ${activeTheme.previewLineText}`}>
                        {item.line}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card Actions */}
              <div className="pt-3 border-t border-stone-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                <a
                  href={`/name/${entry.slug}`}
                  onClick={(e) => handleLinkClick(e, `/name/${entry.slug}`)}
                  className={`inline-flex items-center gap-1 font-semibold hover:underline underline-offset-2 ${activeTheme.previewMeaningText}`}
                >
                  <span>Full {entry.name} Etymology &amp; Quotes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => handleDownloadPoem(entry.slug, entry.fullData)}
                  disabled={exportingSlug === entry.slug}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${activeTheme.previewBadgeBg}`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{exportingSlug === entry.slug ? 'Rendering...' : 'Download PNG'}</span>
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="rounded-2xl bg-white border border-stone-200 p-10 text-center space-y-3">
          <p className="font-serif text-lg text-stone-800">No acrostic poems matched &ldquo;{query}&rdquo;.</p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSelectedLetter('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-stone-900 text-amber-200 text-xs font-semibold hover:bg-stone-800 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Cross-Hub Navigation Banner */}
      <section className="rounded-2xl bg-emerald-50/80 border border-emerald-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900">
            Explore More Cultural Stories Behind Names
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            Discover famous songs featuring names in the lyrics or browse our complete A–Z etymology directory.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 shrink-0">
          <a
            href="/songs-with-names"
            onClick={(e) => handleLinkClick(e, '/songs-with-names')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-900 text-emerald-50 hover:bg-emerald-800 text-xs font-semibold transition-colors"
          >
            <Music className="w-3.5 h-3.5 text-emerald-300" />
            <span>Songs With Names</span>
          </a>
          <a
            href="/names"
            onClick={(e) => handleLinkClick(e, '/names')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-stone-800 hover:bg-stone-50 border border-stone-300 text-xs font-semibold transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
            <span>Browse Names A–Z</span>
          </a>
        </div>
      </section>
    </div>
  );
};
