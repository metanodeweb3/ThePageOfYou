import React, { useState, useEffect } from 'react';
import { X, Download, Copy, Check, Feather, Paintbrush } from 'lucide-react';
import { PersonNameData } from '../types';
import { ACROSTIC_THEMES, AcrosticTheme } from '../lib/cardThemes';

interface AcrosticExportModalProps {
  data: PersonNameData;
  isOpen: boolean;
  onClose: () => void;
}

export const AcrosticExportModal: React.FC<AcrosticExportModalProps> = ({
  data,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string>('obsidian');

  const currentTheme = ACROSTIC_THEMES.find(t => t.id === selectedThemeId) || ACROSTIC_THEMES[0];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const acrosticLines = data.acrostic || [];

  const handleCopyPoem = () => {
    let poemStr = `THE ACROSTIC POEM OF ${data.name.toUpperCase()}\n`;
    poemStr += `Meaning: ${data.meaning}\n\n`;

    if (acrosticLines.length > 0) {
      poemStr += acrosticLines.map(a => `${a.letter}: ${a.line}`).join('\n') + '\n';
    }

    const siteLink = window.location.hostname.includes('thepageofyou.com')
      ? window.location.href
      : `https://thepageofyou.com?name=${encodeURIComponent(data.name)}`;
    poemStr += `\nCreated on The Page of You: ${siteLink}`;

    navigator.clipboard.writeText(poemStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPoster = () => {
    setIsExporting(true);

    const canvas = document.createElement('canvas');
    canvas.width = 1200;

    // Calculate canvas height dynamically based on acrostic lines
    const acrosticBlockHeight = acrosticLines.length * 65;
    const posterHeight = Math.max(850, 420 + acrosticBlockHeight + 120);
    canvas.height = posterHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsExporting(false);
      return;
    }

    // 1. Background
    ctx.fillStyle = currentTheme.canvasBg;
    ctx.fillRect(0, 0, 1200, posterHeight);

    // 2. Outer decorative line
    ctx.strokeStyle = currentTheme.outerBorder;
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 1140, posterHeight - 60);

    // Inner subtle border
    ctx.strokeStyle = currentTheme.innerBorder;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(45, 45, 1110, posterHeight - 90);

    // 3. Header Title
    ctx.fillStyle = currentTheme.subtitleColor;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE PAGE OF YOU • ACROSTIC POEM POSTER', 600, 100);

    // Title line gradient
    const gradient = ctx.createLinearGradient(150, 120, 1050, 120);
    gradient.addColorStop(0, 'rgba(180, 130, 20, 0)');
    gradient.addColorStop(0.5, currentTheme.innerBorder);
    gradient.addColorStop(1, 'rgba(180, 130, 20, 0)');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 120);
    ctx.lineTo(1050, 120);
    ctx.stroke();

    // Name Main Headline
    ctx.fillStyle = currentTheme.titleColor;
    ctx.font = 'bold 54px Georgia, serif';
    ctx.fillText(data.name, 600, 190);

    // Meaning & Etymology
    ctx.fillStyle = currentTheme.meaningColor;
    ctx.font = 'italic 24px Georgia, serif';
    ctx.fillText(`“${data.meaning}”`, 600, 240);

    if (data.origin) {
      ctx.fillStyle = currentTheme.subtitleColor;
      ctx.font = '18px sans-serif';
      ctx.fillText(`Origin & Heritage: ${data.origin}`, 600, 275);
    }

    let yOffset = 330;

    // 4. Acrostic Poem Section
    ctx.fillStyle = currentTheme.meaningColor;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ACROSTIC VERSE', 100, yOffset);
    yOffset += 25;

    // Line under Acrostic Header
    ctx.strokeStyle = currentTheme.innerBorder;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(100, yOffset);
    ctx.lineTo(1100, yOffset);
    ctx.stroke();
    yOffset += 35;

    // Render Acrostic Lines
    acrosticLines.forEach((item) => {
      // Golden Letter Badge Box
      ctx.fillStyle = currentTheme.letterSquareBg;
      ctx.fillRect(100, yOffset, 50, 50);
      ctx.strokeStyle = currentTheme.letterSquareBorder;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(100, yOffset, 50, 50);

      // Letter text
      ctx.fillStyle = currentTheme.letterText;
      ctx.font = 'bold 28px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.letter, 125, yOffset + 36);

      // Verse Line text
      ctx.fillStyle = currentTheme.lineText;
      ctx.font = 'italic 24px Georgia, serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.line, 172, yOffset + 34, 920);

      yOffset += 65;
    });

    // 5. Footer Watermark
    ctx.fillStyle = currentTheme.footerColor;
    ctx.font = '18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('thepageofyou.com • Custom Acrostic Mini-Poster Edition', 600, posterHeight - 50);

    // Export image
    const link = document.createElement('a');
    link.download = `${data.name}_Acrostic_Poem_Poster.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    setIsExporting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-800 bg-stone-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Feather className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-stone-100">
                Acrostic Mini-Poster
              </h3>
            </div>
          </div>
          <button
            id="btn-close-acrostic-modal"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-400 hover:text-stone-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Preview Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Theme Switcher Bar */}
          <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-stone-300 text-[11px] uppercase tracking-wider">
              <Paintbrush className="w-3.5 h-3.5 text-amber-400" />
              <span>Select Poster Theme Aesthetics</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {ACROSTIC_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedThemeId(theme.id)}
                  className={`px-2 py-1.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                    selectedThemeId === theme.id
                      ? 'border-amber-500 bg-amber-500/10 text-amber-200 shadow-xs font-semibold'
                      : 'border-stone-800 bg-stone-900/60 hover:bg-stone-800/80 text-stone-400'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border shrink-0 ${theme.swatch}`} />
                  <span className="text-[11px] truncate">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={`p-5 sm:p-7 rounded-2xl border-2 shadow-inner text-left space-y-4 relative overflow-hidden transition-all ${currentTheme.previewBg}`}>
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Poster Header */}
            <div className="text-center border-b border-stone-800/60 pb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/90 block mb-1">
                The Page of You • Acrostic Keepsake
              </span>
              <h2 className={`font-serif font-black text-2xl sm:text-3xl tracking-tight ${currentTheme.previewTitleText}`}>
                {data.name}
              </h2>
              <p className={`text-xs italic mt-1 font-serif ${currentTheme.previewMeaningText}`}>
                "{data.meaning}"
              </p>
            </div>

            {/* Acrostic Lines */}
            <div className="space-y-2.5 py-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400/80 block">
                Verse Lines
              </span>
              {acrosticLines.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm">
                  <span className={`w-6 h-6 rounded font-serif font-bold flex items-center justify-center shrink-0 text-sm ${currentTheme.previewBadgeBg}`}>
                    {item.letter}
                  </span>
                  <span className={`italic font-medium font-serif ${currentTheme.previewLineText}`}>
                    {item.line}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            id="btn-copy-acrostic-text"
            onClick={handleCopyPoem}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 border border-stone-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Copied Poem!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-400" />
                <span>Copy Poem</span>
              </>
            )}
          </button>

          <button
            id="btn-download-acrostic-poster"
            onClick={handleDownloadPoster}
            disabled={isExporting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-stone-950" />
            <span>{isExporting ? 'Generating Poster...' : 'Download Mini-Poster (PNG)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
