import React, { useState } from 'react';
import { Share2, Sparkles, Copy, Check, Download, Image as ImageIcon } from 'lucide-react';
import { PersonNameData } from '../types';

interface ShareBannerProps {
  data: PersonNameData;
  onOpenShareModal: () => void;
}

export const ShareBanner: React.FC<ShareBannerProps> = ({
  data,
  onOpenShareModal,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const safeSlug = encodeURIComponent(data.name.trim().toLowerCase());
    const shareUrl = window.location.hostname.includes('thepageofyou.com')
      ? `${window.location.origin}/name/${safeSlug}`
      : `https://thepageofyou.com/name/${safeSlug}`;
    const shareText = `Discover the origin, acrostic poem & cultural references for "${data.name}" on The Page of You:\n${shareUrl}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 my-6">
      <div className="bg-gradient-to-r from-amber-900 via-stone-900 to-amber-950 text-stone-100 p-5 sm:p-6 rounded-2xl shadow-md border border-amber-800/40 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-5">
        {/* Background glow accent */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-4 z-10">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
            <Share2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 text-[11px] font-semibold tracking-wide border border-amber-400/20">
              <Sparkles className="w-3 h-3" />
              <span>Cultural Keepsake Card</span>
            </div>
            <h3 className="text-lg sm:text-xl font-serif font-bold text-white tracking-tight">
              Share {data.name}'s Cultural Page
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl leading-relaxed">
              Generate a personalized image card featuring <span className="text-amber-200 font-semibold">{data.name}'s</span> meaning, top literature, music, and film references to send to friends or share on social media.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto shrink-0 z-10">
          <button
            id="btn-banner-open-share"
            onClick={onOpenShareModal}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <ImageIcon className="w-4 h-4 text-stone-900" />
            <span>Create Shareable Card</span>
          </button>

          <button
            id="btn-banner-copy-link"
            onClick={handleCopyLink}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-stone-800/90 hover:bg-stone-700/90 text-stone-200 font-semibold text-xs sm:text-sm border border-stone-700 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-stone-400" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
