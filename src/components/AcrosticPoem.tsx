import React, { useState } from 'react';
import { Feather, Copy, Check, Share2, Image as ImageIcon } from 'lucide-react';
import { AcrosticLine, PersonNameData } from '../types';
import { SharePoemModal, downloadAcrosticImage } from './SharePoemModal';

interface AcrosticPoemProps {
  name: string;
  meaning: string;
  origin?: string;
  adjectives?: string[];
  acrostic?: AcrosticLine[];
  data?: PersonNameData;
}

export const AcrosticPoem: React.FC<AcrosticPoemProps> = ({
  name,
  meaning,
  origin,
  adjectives,
  acrostic,
  data,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSharePoemOpen, setIsSharePoemOpen] = useState(false);

  const handleCopy = () => {
    if (!acrostic) return;
    const poemText = acrostic.map((a) => `${a.letter}: ${a.line}`).join('\n');
    const siteUrl = window.location.hostname.includes('thepageofyou.com')
      ? window.location.href
      : `https://thepageofyou.com?name=${encodeURIComponent(name)}`;
    const fullText = `Acrostic Poem for ${name}:\n\n${poemText}\n\nMeaning: ${meaning}\n\nDiscover yours at https://thepageofyou.com`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nameDataForExport: PersonNameData = data || {
    name,
    meaning,
    origin,
    adjectives,
    acrostic,
    books: [],
    songs: [],
    movies: [],
    games: [],
    art: [],
  };

  const handleDownloadImage = () => {
    downloadAcrosticImage(nameDataForExport);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 mt-6 mb-2 sm:mt-8 sm:mb-4">
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-4 sm:p-6 md:p-8 shadow-md border border-stone-800 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 mb-4 pb-4 sm:mb-6 sm:pb-6 border-b border-stone-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60 text-[11px] sm:text-xs font-semibold mb-2">
              <Feather className="w-3.5 h-3.5" />
              <span>Personalized Acrostic Verse</span>
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
              The Acrostic Poem of {name}
            </h3>
            <p className="text-xs text-stone-400 mt-1 leading-normal">
              Etymology: <span className="text-amber-200 font-medium">{meaning}</span> {origin ? `(${origin})` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            {adjectives && adjectives.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {adjectives.map((adj, i) => (
                  <span
                    key={i}
                    className="text-[10px] sm:text-[11px] font-sans font-semibold bg-stone-800 text-amber-200 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-stone-700"
                  >
                    {adj}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                id="btn-download-poem-image"
                onClick={handleDownloadImage}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all active:scale-95 shadow-xs"
                title="Download Acrostic Poem Image (PNG)"
              >
                <ImageIcon className="w-3.5 h-3.5 text-stone-900" />
                <span>Download Image</span>
              </button>

              <button
                id="btn-poem-share"
                onClick={() => setIsSharePoemOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 text-xs font-semibold transition-all active:scale-95 shadow-xs"
                title="Share Acrostic Poem Card"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Share Poem</span>
              </button>

              <button
                id="btn-copy-poem"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-all border border-stone-700 active:scale-95 shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-300" />
                    <span>Copy Poem</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Poem Lines */}
        {acrostic && acrostic.length > 0 ? (
          <div className="space-y-2.5 sm:space-y-3 font-serif my-2 sm:my-3">
            {acrostic.map((item, idx) => (
              <div
                key={idx}
                className="flex items-baseline gap-2.5 sm:gap-3 text-sm sm:text-base md:text-lg bg-stone-950/40 p-2.5 sm:p-3 rounded-xl border border-stone-800/60 hover:border-amber-500/40 transition-all"
              >
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-serif font-black flex items-center justify-center shrink-0 text-base sm:text-xl shadow-inner">
                  {item.letter}
                </span>
                <span className="text-stone-200 italic font-medium leading-relaxed">
                  {item.line}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stone-400 italic text-xs sm:text-sm">Generating custom acrostic verse...</p>
        )}
      </div>

      {/* Share Poem Card Modal */}
      <SharePoemModal
        data={nameDataForExport}
        isOpen={isSharePoemOpen}
        onClose={() => setIsSharePoemOpen(false)}
      />
    </div>
  );
};
