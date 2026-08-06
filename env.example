import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, Image as ImageIcon, Paintbrush } from 'lucide-react';
import { PersonNameData } from '../types';
import { ACROSTIC_THEMES, AcrosticTheme } from '../lib/cardThemes';

interface SharePoemModalProps {
  data: PersonNameData;
  isOpen: boolean;
  onClose: () => void;
}

export const downloadAcrosticImage = (data: PersonNameData, theme?: AcrosticTheme) => {
  const currentTheme = theme || ACROSTIC_THEMES[0];
  const acrosticLines = data.acrostic || [];

  const canvas = document.createElement('canvas');
  canvas.width = 1200;

  // Helper: text wrapping
  const wrapText = (text: string, font: string, maxWidth: number): string[] => {
    const dummyCanvas = document.createElement('canvas');
    const dummyCtx = dummyCanvas.getContext('2d');
    if (!dummyCtx) return [text];
    dummyCtx.font = font;
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = dummyCtx.measureText(testLine).width;
      if (width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const formattedLines = acrosticLines.map((item) => {
    const lineTextWrapped = wrapText(item.line, 'italic 22px Georgia, serif', 880);
    const rowHeight = Math.max(54, 18 + lineTextWrapped.length * 28);
    return {
      ...item,
      lineTextWrapped,
      rowHeight,
    };
  });

  const meaningLines = wrapText(`“${data.meaning}”`, 'italic 23px Georgia, serif', 920);
  const meaningHeight = meaningLines.length * 32;

  const poemBlockTotalHeight = formattedLines.reduce((sum, item) => sum + item.rowHeight + 12, 0);
  const cardHeight = Math.max(780, 340 + meaningHeight + poemBlockTotalHeight + 90);
  canvas.height = cardHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) return;

  // 1. Background
  ctx.fillStyle = currentTheme.canvasBg;
  ctx.fillRect(0, 0, 1200, cardHeight);

  // 2. Decorative Outer Certificate Border
  ctx.strokeStyle = currentTheme.outerBorder;
  ctx.lineWidth = 10;
  ctx.strokeRect(30, 30, 1140, cardHeight - 60);

  // Inner hairline frame
  ctx.strokeStyle = currentTheme.innerBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(44, 44, 1112, cardHeight - 88);

  // Secondary subtle inner border line
  ctx.strokeStyle = currentTheme.innerBorder;
  ctx.lineWidth = 0.75;
  ctx.strokeRect(50, 50, 1100, cardHeight - 100);

  // Four Corner Diamond Flourishes
  const cornerRadius = 5;
  const corners = [
    { x: 50, y: 50 },
    { x: 1150, y: 50 },
    { x: 50, y: cardHeight - 50 },
    { x: 1150, y: cardHeight - 50 },
  ];
  corners.forEach((c) => {
    ctx.fillStyle = currentTheme.innerBorder;
    ctx.beginPath();
    ctx.arc(c.x, c.y, cornerRadius, 0, Math.PI * 2);
    ctx.fill();
  });

  // 3. Top Eyebrow Emblem
  ctx.fillStyle = currentTheme.innerBorder;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('• THE PAGE OF YOU • ACROSTIC VERSE •', 600, 75);

  // Main Script Header Title
  ctx.fillStyle = currentTheme.titleColor;
  ctx.font = '72px "Mea Culpa", cursive, Georgia, serif';
  ctx.fillText('The Page of You', 600, 154);

  // Decorative divider line beneath header
  const lineY = 176;
  const lineGradient = ctx.createLinearGradient(150, lineY, 1050, lineY);
  lineGradient.addColorStop(0, 'rgba(168, 162, 158, 0)');
  lineGradient.addColorStop(0.3, currentTheme.innerBorder);
  lineGradient.addColorStop(0.5, currentTheme.innerBorder);
  lineGradient.addColorStop(0.7, currentTheme.innerBorder);
  lineGradient.addColorStop(1, 'rgba(168, 162, 158, 0)');
  ctx.strokeStyle = lineGradient;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(150, lineY);
  ctx.lineTo(1050, lineY);
  ctx.stroke();

  // 4. Name Banner Ribbon
  const bannerX = 150;
  const bannerY = 202;
  const bannerWidth = 900;
  const bannerHeight = 84;

  ctx.fillStyle = currentTheme.nameBannerBg;
  ctx.fillRect(bannerX, bannerY, bannerWidth, bannerHeight);

  ctx.strokeStyle = currentTheme.outerBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(bannerX, bannerY, bannerWidth, bannerHeight);

  // Inset border for name banner
  ctx.strokeStyle = currentTheme.innerBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(bannerX + 4, bannerY + 4, bannerWidth - 8, bannerHeight - 8);

  // Name Text
  ctx.fillStyle = currentTheme.nameBannerText;
  ctx.font = 'bold 46px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(data.name.toUpperCase(), 600, bannerY + 58);

  // Decorative side diamonds inside banner
  ctx.fillStyle = currentTheme.nameBannerText;
  ctx.font = '18px serif';
  ctx.fillText('✦', bannerX + 35, bannerY + 52);
  ctx.fillText('✦', bannerX + bannerWidth - 35, bannerY + 52);

  // 5. Meaning
  ctx.fillStyle = currentTheme.meaningColor;
  ctx.font = 'italic 23px Georgia, serif';
  let meaningY = 322;
  meaningLines.forEach((mLine) => {
    ctx.fillText(mLine, 600, meaningY);
    meaningY += 32;
  });

  let yOffset = meaningY + 16;

  // 6. Render Acrostic Lines
  formattedLines.forEach((item) => {
    // Row container box
    ctx.fillStyle = currentTheme.lineBg;
    ctx.fillRect(100, yOffset, 1000, item.rowHeight);

    ctx.strokeStyle = currentTheme.lineBorder;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(100, yOffset, 1000, item.rowHeight);

    // Letter Square
    const tileWidth = 54;
    ctx.fillStyle = currentTheme.letterSquareBg;
    ctx.fillRect(100, yOffset, tileWidth, item.rowHeight);

    ctx.strokeStyle = currentTheme.letterSquareBorder;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(100, yOffset, tileWidth, item.rowHeight);

    ctx.fillStyle = currentTheme.letterText;
    ctx.font = 'bold 28px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.letter, 127, yOffset + 36);

    // Verse Line text (with wrapping support)
    ctx.fillStyle = currentTheme.lineText;
    ctx.font = 'italic 22px Georgia, serif';
    ctx.textAlign = 'left';

    let textY = yOffset + 34;
    item.lineTextWrapped.forEach((lChunk) => {
      ctx.fillText(lChunk, 172, textY);
      textY += 28;
    });

    yOffset += item.rowHeight + 12;
  });

  // 7. Footer Branding
  const footerY = cardHeight - 68;
  const footerLineGradient = ctx.createLinearGradient(200, footerY - 5, 1000, footerY - 5);
  footerLineGradient.addColorStop(0, 'rgba(168, 162, 158, 0)');
  footerLineGradient.addColorStop(0.3, currentTheme.innerBorder);
  footerLineGradient.addColorStop(0.7, currentTheme.innerBorder);
  footerLineGradient.addColorStop(1, 'rgba(168, 162, 158, 0)');
  ctx.strokeStyle = footerLineGradient;
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(250, footerY - 5);
  ctx.lineTo(440, footerY - 5);
  ctx.moveTo(760, footerY - 5);
  ctx.lineTo(950, footerY - 5);
  ctx.stroke();

  ctx.fillStyle = currentTheme.footerColor;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('thepageofyou.com', 600, footerY);

  // Export image download
  const link = document.createElement('a');
  link.download = `Acrostic-Poem-${data.name}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

export const SharePoemModal: React.FC<SharePoemModalProps> = ({
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
  const shareUrl = window.location.hostname.includes('thepageofyou.com')
    ? window.location.href
    : `https://thepageofyou.com?name=${encodeURIComponent(data.name)}`;
  const acrosticTextFormatted = acrosticLines.map((a) => `${a.letter}: ${a.line}`).join('\n');
  const shareText = `Acrostic Poem for "${data.name}":\n\n${acrosticTextFormatted}\n\nMeaning: ${data.meaning}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Acrostic Poem for ${data.name} — The Page of You`,
          text: shareText,
          url: shareUrl,
        });
      } catch (e) {
        console.warn('Native share error or dismissed:', e);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadCard = () => {
    setIsExporting(true);
    setTimeout(() => {
      downloadAcrosticImage(data, currentTheme);
      setIsExporting(false);
    }, 50);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-stone-900 w-full max-w-lg rounded-2xl shadow-2xl border border-stone-800 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh] relative animate-in zoom-in-95 duration-200"
      >
        {/* Top Header - Fixed at top */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-stone-100">
                Share Acrostic Poem
              </h3>
            </div>
          </div>
          <button
            id="btn-close-share-poem"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-400 hover:text-stone-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Card Preview Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Theme Switcher Bar */}
          <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-stone-300 text-[11px] uppercase tracking-wider">
              <Paintbrush className="w-3.5 h-3.5 text-amber-400" />
              <span>Select Poem Theme Aesthetics</span>
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

          <div className={`p-4 sm:p-5 rounded-2xl border-2 shadow-inner text-center space-y-3 relative overflow-hidden transition-all ${currentTheme.previewBg}`}>
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Site Title Header with Golden Line */}
            <div className="w-full flex flex-col items-center pt-1 pb-1">
              <span className={`text-4xl sm:text-5xl md:text-6xl font-mea-culpa leading-none py-1 whitespace-nowrap text-center drop-shadow-sm tracking-wide ${currentTheme.previewTitleText}`}>
                The Page of You
              </span>
              <div className="w-full h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mt-1 select-none" />
            </div>

            <div className={`p-3 sm:p-4 rounded-xl shadow-xs border transition-all ${currentTheme.previewRowBg}`}>
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded">
                Acrostic Verse
              </span>
              <h4 className={`text-2xl sm:text-3xl font-serif font-bold mt-1.5 tracking-tight ${currentTheme.previewTitleText}`}>
                {data.name}
              </h4>
              <p className={`text-xs italic font-serif mt-0.5 ${currentTheme.previewMeaningText}`}>"{data.meaning}"</p>
            </div>

            {/* Acrostic Lines */}
            <div className="space-y-2 text-left pt-1">
              {acrosticLines.map((item, idx) => (
                <div key={idx} className={`flex items-center gap-2.5 p-2.5 rounded-xl border shadow-2xs transition-all ${currentTheme.previewRowBg}`}>
                  <span className={`w-7 h-7 rounded-lg font-serif font-bold flex items-center justify-center shrink-0 text-sm ${currentTheme.previewBadgeBg}`}>
                    {item.letter}
                  </span>
                  <span className={`italic font-serif text-xs sm:text-sm font-medium ${currentTheme.previewLineText}`}>
                    {item.line}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed at Bottom */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 shrink-0 space-y-2">
          {canNativeShare && (
            <button
              id="btn-native-share-poem"
              onClick={handleNativeShare}
              className="w-full py-2.5 sm:py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Share2 className="w-4 h-4 text-stone-950" />
              <span>Share via Apps & Socials</span>
            </button>
          )}

          <button
            id="btn-download-poem-png"
            onClick={handleDownloadCard}
            disabled={isExporting}
            className="w-full py-2.5 sm:py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 font-semibold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span>{isExporting ? 'Generating PNG...' : 'Download Image (PNG)'}</span>
          </button>

          <button
            id="btn-copy-poem-share-link"
            onClick={handleCopyLink}
            className="w-full py-2.5 sm:py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border border-stone-700 active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Link & Text Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-400" />
                <span>Copy Shareable Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
