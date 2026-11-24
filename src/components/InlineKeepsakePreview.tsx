import React, { useState } from 'react';
import {
  Download,
  Frame,
  Paintbrush,
  Sparkles,
  BookOpen,
  Music,
  Film,
  Share2,
} from 'lucide-react';
import { PersonNameData } from '../types';
import { ACROSTIC_THEMES, SHARE_CARD_THEMES } from '../lib/cardThemes';
import { downloadAcrosticImage } from './SharePoemModal';
import { stripOuterQuotes } from '../utils/seo';

interface InlineKeepsakePreviewProps {
  data: PersonNameData;
  onOpenShareModal: () => void;
}

const FEATURED_THEME_IDS = ['obsidian', 'parchment', 'emerald', 'midnight', 'rose-quartz'] as const;

const THEME_MAPPING_TO_SHARE: Record<string, string> = {
  obsidian: 'obsidian',
  parchment: 'amber',
  emerald: 'emerald',
  midnight: 'midnight',
  'rose-quartz': 'rose-quartz',
};

export const InlineKeepsakePreview: React.FC<InlineKeepsakePreviewProps> = ({
  data,
  onOpenShareModal,
}) => {
  const [selectedThemeId, setSelectedThemeId] = useState<string>('obsidian');
  const [previewMode, setPreviewMode] = useState<'print' | 'card'>('print');
  const [isExporting, setIsExporting] = useState(false);

  const featuredThemes = FEATURED_THEME_IDS.map((id) =>
    ACROSTIC_THEMES.find((t) => t.id === id)
  ).filter((t): t is NonNullable<typeof t> => Boolean(t));

  const activeAcrosticTheme =
    featuredThemes.find((t) => t.id === selectedThemeId) || ACROSTIC_THEMES[0];

  const mappedShareId = THEME_MAPPING_TO_SHARE[selectedThemeId] || 'amber';
  const activeShareTheme =
    SHARE_CARD_THEMES.find((t) => t.id === mappedShareId) || SHARE_CARD_THEMES[0];

  const acrosticLines = data.acrostic || [];
  const featuredBook = data.books?.[0];
  const featuredSong = data.songs?.[0];
  const featuredMovie = data.movies?.[0];

  const handleDownloadAcrostic = async () => {
    setIsExporting(true);
    try {
      await downloadAcrosticImage(data, activeAcrosticTheme);
    } catch (err) {
      console.error('Error exporting inline acrostic print:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section
      id="inline-keepsake-studio"
      aria-labelledby="keepsake-preview-heading"
      className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-4"
    >
      <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-b from-[#fbf7ef] via-white to-[#faf6ee] shadow-sm overflow-hidden">
        {/* Studio Header */}
        <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-amber-200/60 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-800 bg-amber-100/90 border border-amber-300/70 px-2.5 py-1 rounded-full">
              <Frame className="w-3.5 h-3.5 text-amber-700" />
              <span>Live Framed Keepsake Studio</span>
            </div>
            <h2
              id="keepsake-preview-heading"
              className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight"
            >
              Preview {data.name}&rsquo;s Printable Keepsake &amp; Acrostic Art
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
              Switch archival colour palettes below to see how {data.name}&rsquo;s acrostic poem and cultural highlights look as a framed print or shareable keepsake card — free to download as a crisp 1200px PNG.
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="inline-flex p-1 rounded-xl bg-stone-100 border border-stone-200 self-start lg:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setPreviewMode('print')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                previewMode === 'print'
                  ? 'bg-stone-900 text-amber-200 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Framed Acrostic Print
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('card')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                previewMode === 'card'
                  ? 'bg-stone-900 text-amber-200 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Cultural Keepsake Card
            </button>
          </div>
        </div>

        {/* Studio Workspace */}
        <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left: Interactive Framed Mockup */}
          <div className="lg:col-span-7 flex justify-center">
            {/* Realistic Gallery Frame + Warm Mount Board */}
            <div className="w-full max-w-md rounded-2xl p-3 sm:p-4 bg-gradient-to-br from-[#2b2118] via-[#1c1610] to-[#3b2d1f] shadow-2xl border border-amber-700/40">
              <div className="rounded-xl p-3 sm:p-4 bg-[#f5efe6] shadow-inner border border-stone-300/80">
                {previewMode === 'print' ? (
                  <div
                    className={`rounded-lg border-2 p-4 sm:p-5 text-center space-y-3 transition-all duration-300 ${activeAcrosticTheme.previewBg}`}
                  >
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-amber-500/90">
                        The Page of You &bull; Acrostic Edition
                      </p>
                      <p
                        className={`text-3xl sm:text-4xl font-mea-culpa leading-none py-0.5 ${activeAcrosticTheme.previewTitleText}`}
                      >
                        The Page of You
                      </p>
                      <div className="w-2/3 mx-auto h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                    </div>

                    <div
                      className={`p-3 rounded-lg border transition-all ${activeAcrosticTheme.previewRowBg}`}
                    >
                      <h3
                        className={`text-xl sm:text-2xl font-serif font-bold tracking-wide uppercase ${activeAcrosticTheme.previewTitleText}`}
                      >
                        {data.name}
                      </h3>
                      <p
                        className={`text-[11px] sm:text-xs font-serif italic mt-0.5 ${activeAcrosticTheme.previewMeaningText}`}
                      >
                        &ldquo;{data.meaning}&rdquo;
                      </p>
                    </div>

                    <div className="space-y-1.5 text-left">
                      {acrosticLines.map((item, idx) => (
                        <div
                          key={`${item.letter}-${idx}`}
                          className={`flex items-center gap-2 p-1.5 sm:p-2 rounded-lg border transition-all ${activeAcrosticTheme.previewRowBg}`}
                        >
                          <span
                            className={`w-6 h-6 rounded font-serif font-bold text-xs flex items-center justify-center shrink-0 border ${activeAcrosticTheme.previewBadgeBg}`}
                          >
                            {item.letter}
                          </span>
                          <span
                            className={`text-[11px] sm:text-xs font-serif italic leading-snug ${activeAcrosticTheme.previewLineText}`}
                          >
                            {item.line}
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className="text-[10px] font-serif tracking-widest uppercase opacity-60 pt-1 text-stone-400">
                      thepageofyou.com
                    </p>
                  </div>
                ) : (
                  <div
                    className={`rounded-lg border-2 p-4 sm:p-5 text-center space-y-3 transition-all duration-300 ${activeShareTheme.previewBg}`}
                  >
                    <div className="space-y-1">
                      <p
                        className={`text-3xl sm:text-4xl font-mea-culpa leading-none py-0.5 ${activeShareTheme.previewTitleText}`}
                      >
                        The Page of You
                      </p>
                      <div className="w-2/3 mx-auto h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                    </div>

                    <div
                      className={`p-3 rounded-lg border transition-all ${activeShareTheme.previewCardBg}`}
                    >
                      <h3
                        className={`text-xl sm:text-2xl font-serif font-bold tracking-wide uppercase ${activeShareTheme.previewTitleText}`}
                      >
                        {data.name}
                      </h3>
                      <p
                        className={`text-[11px] font-serif italic mt-0.5 ${activeShareTheme.previewMeaningText}`}
                      >
                        {data.origin} &bull; &ldquo;{data.meaning}&rdquo;
                      </p>
                    </div>

                    <div className="space-y-2 text-left">
                      {featuredBook && (
                        <div className={`p-2.5 rounded-lg border ${activeShareTheme.previewCardBg}`}>
                          <p
                            className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${activeShareTheme.previewHeaderColors.book}`}
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>Literature</span>
                          </p>
                          <p
                            className={`text-xs font-serif italic mt-1 line-clamp-2 ${activeShareTheme.previewCardText}`}
                          >
                            &ldquo;{stripOuterQuotes(featuredBook.quote)}&rdquo;
                          </p>
                          <p className={`text-[10px] mt-1 ${activeShareTheme.previewBylineText}`}>
                            {featuredBook.title} — {featuredBook.author}
                          </p>
                        </div>
                      )}

                      {featuredSong && (
                        <div className={`p-2.5 rounded-lg border ${activeShareTheme.previewCardBg}`}>
                          <p
                            className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${activeShareTheme.previewHeaderColors.song}`}
                          >
                            <Music className="w-3 h-3" />
                            <span>Music</span>
                          </p>
                          <p
                            className={`text-xs font-serif italic mt-1 line-clamp-2 ${activeShareTheme.previewCardText}`}
                          >
                            &ldquo;{stripOuterQuotes(featuredSong.lyricsQuote)}&rdquo;
                          </p>
                          <p className={`text-[10px] mt-1 ${activeShareTheme.previewBylineText}`}>
                            {featuredSong.title} — {featuredSong.artist}
                          </p>
                        </div>
                      )}

                      {featuredMovie && (
                        <div className={`p-2.5 rounded-lg border ${activeShareTheme.previewCardBg}`}>
                          <p
                            className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${activeShareTheme.previewHeaderColors.movie}`}
                          >
                            <Film className="w-3 h-3" />
                            <span>Cinema</span>
                          </p>
                          <p
                            className={`text-xs font-serif italic mt-1 line-clamp-2 ${activeShareTheme.previewCardText}`}
                          >
                            &ldquo;{stripOuterQuotes(featuredMovie.quote)}&rdquo;
                          </p>
                          <p className={`text-[10px] mt-1 ${activeShareTheme.previewBylineText}`}>
                            {featuredMovie.title}
                            {featuredMovie.year ? ` (${featuredMovie.year})` : ''}
                          </p>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] font-serif tracking-widest uppercase opacity-60 pt-1 text-stone-400">
                      thepageofyou.com
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Palette Controls & Export Actions */}
          <div className="lg:col-span-5 space-y-5">
            <div className="rounded-2xl bg-white border border-stone-200 p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-700">
                <Paintbrush className="w-4 h-4 text-amber-700" />
                <span>Choose Archival Palette</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                {featuredThemes.map((theme) => {
                  const isActive = selectedThemeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedThemeId(theme.id)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                        isActive
                          ? 'border-amber-600 bg-amber-50/80 text-stone-900 shadow-xs ring-1 ring-amber-500/30'
                          : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100/70 text-stone-700'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-full border-2 shrink-0 shadow-2xs ${theme.swatch}`}
                        />
                        <span className="text-xs sm:text-sm font-semibold truncate">
                          {theme.name}
                        </span>
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full shrink-0">
                          Active
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Download & Customiser CTAs */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleDownloadAcrostic}
                disabled={isExporting}
                className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-200 font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>
                  {isExporting
                    ? 'Rendering 1200px PNG...'
                    : `Download ${data.name}'s Acrostic PNG (${activeAcrosticTheme.name})`}
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenShareModal}
                className="w-full py-3 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Share2 className="w-4 h-4 text-amber-700" />
                <span>Customise Full Cultural Card (10 Themes)</span>
              </button>
            </div>

            <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/70 p-3.5 flex items-start gap-2.5 text-xs text-emerald-950">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Instant Gift-Ready Keepsake:</strong> Every exported PNG is rendered at 1200px print clarity — ideal for framing as a personalised birthday, new baby, or anniversary gift, or sharing directly with family.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
