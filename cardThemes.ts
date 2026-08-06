import React, { useRef, useState, useEffect } from 'react';
import { X, Copy, Check, Download, Share2, Sparkles, Image as ImageIcon, SlidersHorizontal, BookOpen, Music, Film, Gamepad2, Palette, Paintbrush } from 'lucide-react';
import { PersonNameData, BookQuote, SongQuote, MovieQuote, GameQuote, ArtQuote } from '../types';
import { SHARE_CARD_THEMES, ShareCardTheme } from '../lib/cardThemes';

interface ShareCardModalProps {
  data: PersonNameData;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  data,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string>('amber');

  // Selected quotes state per category (id or 'none')
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [selectedSongId, setSelectedSongId] = useState<string>('');
  const [selectedMovieId, setSelectedMovieId] = useState<string>('');
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [selectedArtId, setSelectedArtId] = useState<string>('');

  const currentTheme = SHARE_CARD_THEMES.find(t => t.id === selectedThemeId) || SHARE_CARD_THEMES[0];

  // Initialize or reset selections when data or modal changes
  useEffect(() => {
    if (isOpen && data) {
      setSelectedBookId(data.books?.[0]?.id || 'none');
      setSelectedSongId(data.songs?.[0]?.id || 'none');
      setSelectedMovieId(data.movies?.[0]?.id || 'none');
      setSelectedGameId(data.games?.[0]?.id || 'none');
      setSelectedArtId(data.art?.[0]?.id || 'none');
    }
  }, [isOpen, data]);

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

  const selectedBook: BookQuote | undefined = data.books?.find(b => b.id === selectedBookId);
  const selectedSong: SongQuote | undefined = data.songs?.find(s => s.id === selectedSongId);
  const selectedMovie: MovieQuote | undefined = data.movies?.find(m => m.id === selectedMovieId);
  const selectedGame: GameQuote | undefined = data.games?.find(g => g.id === selectedGameId);
  const selectedArt: ArtQuote | undefined = data.art?.find(a => a.id === selectedArtId);

  const shareUrl = window.location.hostname.includes('thepageofyou.com') 
    ? window.location.href 
    : `https://thepageofyou.com?name=${encodeURIComponent(data.name)}`;
  const shareText = `Check out my personalized cultural page for "${data.name}" on The Page of You! 📖🎵🎬🎮🎨`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `The Page of You — ${data.name}`,
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

    const itemsToRender = [
      selectedBook ? {
        category: 'LITERATURE',
        headerColor: currentTheme.canvasHeaderColors.book,
        title: selectedBook.title.toUpperCase(),
        quote: `“${selectedBook.quote}”`,
        byline: `— ${selectedBook.author} (${selectedBook.year || 'Classic'})`,
      } : null,
      selectedSong ? {
        category: 'MUSIC',
        headerColor: currentTheme.canvasHeaderColors.song,
        title: `"${selectedSong.title.toUpperCase()}" BY ${selectedSong.artist.toUpperCase()}`,
        quote: `“${selectedSong.lyricsQuote}”`,
        byline: `Vibe: ${selectedSong.albumVibe || 'Timeless Melody'}`,
      } : null,
      selectedMovie ? {
        category: 'CINEMA',
        headerColor: currentTheme.canvasHeaderColors.movie,
        title: selectedMovie.title.toUpperCase(),
        quote: `“${selectedMovie.quote}”`,
        byline: `— Spoken by ${selectedMovie.character || selectedMovie.actor || 'Iconic Character'} ${selectedMovie.year ? `(${selectedMovie.year})` : ''}`,
      } : null,
      selectedGame ? {
        category: 'VIDEO GAME',
        headerColor: currentTheme.canvasHeaderColors.game,
        title: selectedGame.title.toUpperCase(),
        quote: `“${selectedGame.quote}”`,
        byline: `— ${selectedGame.character || selectedGame.developer || 'Iconic Character'}`,
      } : null,
      selectedArt ? {
        category: 'FINE ART',
        headerColor: currentTheme.canvasHeaderColors.art,
        title: selectedArt.title.toUpperCase(),
        quote: `“${selectedArt.quote}”`,
        byline: `— ${selectedArt.artist} (${selectedArt.year || 'Masterpiece'})`,
      } : null,
    ].filter(Boolean) as { category: string; headerColor: string; title: string; quote: string; byline: string }[];

    const canvas = document.createElement('canvas');
    canvas.width = 1200;

    // Canvas Helper: text wrapping
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

    // Calculate dynamic heights for items
    const calculatedItems = itemsToRender.map((item) => {
      const titleLines = wrapText(item.title, 'bold 22px Georgia, serif', 920);
      const quoteLines = wrapText(item.quote, 'italic 22px Georgia, serif', 920);
      const bylineLines = wrapText(item.byline, '18px Georgia, serif', 920);
      const categoryBadgeHeight = 30;
      const calculatedHeight = Math.max(
        160,
        22 + categoryBadgeHeight + (titleLines.length * 28) + 8 + (quoteLines.length > 0 ? quoteLines.length * 30 + 6 : 0) + (bylineLines.length > 0 ? bylineLines.length * 24 : 0) + 20
      );
      return {
        ...item,
        titleLines,
        quoteLines,
        bylineLines,
        height: calculatedHeight,
      };
    });

    const meaningLines = wrapText(`“${data.meaning}”`, 'italic 23px Georgia, serif', 920);
    const meaningHeight = meaningLines.length * 32;

    const itemsTotalHeight = calculatedItems.reduce((sum, item) => sum + item.height + 24, 0);
    const cardHeight = Math.max(800, 340 + meaningHeight + itemsTotalHeight + 90);
    canvas.height = cardHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsExporting(false);
      return;
    }

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
    ctx.fillText('• THE PAGE OF YOU • CULTURAL PORTRAIT •', 600, 75);

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

    // 6. Render Items
    calculatedItems.forEach((item) => {
      // Card Container box
      ctx.fillStyle = currentTheme.cardBg;
      ctx.fillRect(100, yOffset, 1000, item.height);

      ctx.strokeStyle = currentTheme.cardBorder;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(100, yOffset, 1000, item.height);

      // Corner accent highlight line on left edge of card
      ctx.fillStyle = item.headerColor;
      ctx.fillRect(100, yOffset, 6, item.height);

      // Category Pill Badge (on its own line top left)
      const badgeText = item.category.toUpperCase();
      ctx.font = 'bold 12px sans-serif';
      const badgeTextWidth = ctx.measureText(badgeText).width;
      const badgeWidth = badgeTextWidth + 24;

      // Draw badge background
      ctx.fillStyle = item.headerColor;
      ctx.fillRect(126, yOffset + 18, badgeWidth, 24);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(badgeText, 126 + badgeWidth / 2, yOffset + 34);

      let contentY = yOffset + 68;

      // Item Title (below badge with full 920px width)
      ctx.fillStyle = currentTheme.cardQuoteText;
      ctx.font = 'bold 22px Georgia, serif';
      ctx.textAlign = 'left';
      item.titleLines.forEach((tLine) => {
        ctx.fillText(tLine, 126, contentY);
        contentY += 28;
      });

      contentY += 6;

      // Quote Lines
      if (item.quoteLines.length > 0) {
        ctx.fillStyle = currentTheme.cardQuoteText;
        ctx.font = 'italic 22px Georgia, serif';
        item.quoteLines.forEach((qLine) => {
          ctx.fillText(qLine, 126, contentY);
          contentY += 30;
        });
        contentY += 6;
      }

      // Byline Lines
      if (item.bylineLines.length > 0) {
        ctx.fillStyle = currentTheme.cardBylineText;
        ctx.font = '18px Georgia, serif';
        item.bylineLines.forEach((bLine) => {
          ctx.fillText(bLine, 126, contentY);
          contentY += 24;
        });
      }

      yOffset += item.height + 24;
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
    link.download = `The-Page-of-You-${data.name}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    setIsExporting(false);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh] relative animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Header - Fixed at top */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-amber-700" />
            <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900">
              Your Cultural Portrait
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-toggle-customizer"
              onClick={() => setShowCustomizer(!showCustomizer)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                showCustomizer
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
              <span>{showCustomizer ? 'Hide Options' : 'Customize Quotes'}</span>
            </button>
            <button
              id="btn-close-share"
              onClick={onClose}
              aria-label="Close modal"
              className="w-8 h-8 rounded-full bg-stone-200/80 hover:bg-stone-300 flex items-center justify-center text-stone-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Card Preview Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Theme Switcher Bar */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-stone-800 text-[11px] uppercase tracking-wider">
              <Paintbrush className="w-3.5 h-3.5 text-amber-700" />
              <span>Select Card Theme Aesthetics</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {SHARE_CARD_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedThemeId(theme.id)}
                  className={`px-2 py-1.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                    selectedThemeId === theme.id
                      ? 'border-amber-600 bg-amber-50 shadow-xs font-semibold'
                      : 'border-stone-200 bg-white hover:bg-stone-100/80 text-stone-700'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border shrink-0 ${theme.swatch}`} />
                  <span className="text-[11px] truncate">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Collapsible Quote Customizer Panel */}
          {showCustomizer && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs space-y-3 shadow-inner">
              <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                <span className="font-bold text-amber-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Select Featured Quotes for Each Category
                </span>
              </div>

              {/* Book Select */}
              {data.books && data.books.length > 0 && (
                <div className="space-y-1">
                  <label className="font-semibold text-stone-800 flex items-center gap-1.5 text-[11px]">
                    <BookOpen className="w-3.5 h-3.5 text-amber-800" />
                    <span>Literature / Book Quote:</span>
                  </label>
                  <select
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-800 font-sans focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                  >
                    {data.books.map((b, idx) => (
                      <option key={b.id || idx} value={b.id}>
                        "{b.title}" — {b.author}
                      </option>
                    ))}
                    <option value="none">(Exclude Literature from Card)</option>
                  </select>
                </div>
              )}

              {/* Song Select */}
              {data.songs && data.songs.length > 0 && (
                <div className="space-y-1">
                  <label className="font-semibold text-stone-800 flex items-center gap-1.5 text-[11px]">
                    <Music className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Music / Song Lyric:</span>
                  </label>
                  <select
                    value={selectedSongId}
                    onChange={(e) => setSelectedSongId(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-800 font-sans focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                  >
                    {data.songs.map((s, idx) => (
                      <option key={s.id || idx} value={s.id}>
                        "{s.title}" — {s.artist}
                      </option>
                    ))}
                    <option value="none">(Exclude Music from Card)</option>
                  </select>
                </div>
              )}

              {/* Movie Select */}
              {data.movies && data.movies.length > 0 && (
                <div className="space-y-1">
                  <label className="font-semibold text-stone-800 flex items-center gap-1.5 text-[11px]">
                    <Film className="w-3.5 h-3.5 text-sky-700" />
                    <span>Cinema / Film Quote:</span>
                  </label>
                  <select
                    value={selectedMovieId}
                    onChange={(e) => setSelectedMovieId(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-800 font-sans focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                  >
                    {data.movies.map((m, idx) => (
                      <option key={m.id || idx} value={m.id}>
                        "{m.title}" ({m.character || m.actor || 'Quote'})
                      </option>
                    ))}
                    <option value="none">(Exclude Cinema from Card)</option>
                  </select>
                </div>
              )}

              {/* Game Select */}
              {data.games && data.games.length > 0 && (
                <div className="space-y-1">
                  <label className="font-semibold text-stone-800 flex items-center gap-1.5 text-[11px]">
                    <Gamepad2 className="w-3.5 h-3.5 text-violet-700" />
                    <span>Video Game Quote:</span>
                  </label>
                  <select
                    value={selectedGameId}
                    onChange={(e) => setSelectedGameId(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-800 font-sans focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                  >
                    {data.games.map((g, idx) => (
                      <option key={g.id || idx} value={g.id}>
                        "{g.title}" — {g.character || g.developer || 'Game'}
                      </option>
                    ))}
                    <option value="none">(Exclude Games from Card)</option>
                  </select>
                </div>
              )}

              {/* Art Select */}
              {data.art && data.art.length > 0 && (
                <div className="space-y-1">
                  <label className="font-semibold text-stone-800 flex items-center gap-1.5 text-[11px]">
                    <Palette className="w-3.5 h-3.5 text-rose-700" />
                    <span>Fine Art Quote:</span>
                  </label>
                  <select
                    value={selectedArtId}
                    onChange={(e) => setSelectedArtId(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-800 font-sans focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                  >
                    {data.art.map((a, idx) => (
                      <option key={a.id || idx} value={a.id}>
                        "{a.title}" — {a.artist}
                      </option>
                    ))}
                    <option value="none">(Exclude Fine Art from Card)</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div className={`p-4 sm:p-5 rounded-2xl border-2 shadow-inner text-center space-y-3 relative transition-all ${currentTheme.previewBg}`}>
            {/* Site Title Header with Subtle Line */}
            <div className="w-full flex flex-col items-center pt-1 pb-1">
              <span className={`text-4xl sm:text-5xl md:text-6xl font-mea-culpa leading-none py-1 whitespace-nowrap text-center drop-shadow-sm tracking-wide ${currentTheme.previewTitleText}`}>
                The Page of You
              </span>
              <div className="w-full h-[1.5px] bg-gradient-to-r from-transparent via-stone-400/50 to-transparent mt-1 select-none" />
            </div>

            <div className={`p-3 sm:p-4 rounded-xl shadow-xs border transition-all ${currentTheme.previewCardBg}`}>
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                Cultural Keepsake
              </span>
              <h4 className={`text-2xl sm:text-3xl font-serif font-bold mt-1.5 ${currentTheme.previewTitleText}`}>
                {data.name}
              </h4>
              <p className={`text-xs italic mt-0.5 ${currentTheme.previewMeaningText}`}>"{data.meaning}"</p>
            </div>

            {selectedBook && (
              <div className={`p-3 rounded-xl border text-left text-xs transition-all ${currentTheme.previewCardBg}`}>
                <span className={`font-bold uppercase tracking-wider text-[10px] ${currentTheme.previewHeaderColors.book}`}>Featured Book Quote</span>
                <p className={`font-serif italic my-1 ${currentTheme.previewCardText}`}>"{selectedBook.quote}"</p>
                <p className={`font-sans text-[11px] ${currentTheme.previewBylineText}`}>— {selectedBook.author}, <i>{selectedBook.title}</i></p>
              </div>
            )}

            {selectedSong && (
              <div className={`p-3 rounded-xl border text-left text-xs transition-all ${currentTheme.previewCardBg}`}>
                <span className={`font-bold uppercase tracking-wider text-[10px] ${currentTheme.previewHeaderColors.song}`}>Featured Song Lyric</span>
                <p className={`font-serif italic my-1 ${currentTheme.previewCardText}`}>"{selectedSong.lyricsQuote}"</p>
                <p className={`font-sans text-[11px] ${currentTheme.previewBylineText}`}>— {selectedSong.artist}, <i>"{selectedSong.title}"</i></p>
              </div>
            )}

            {selectedMovie && (
              <div className={`p-3 rounded-xl border text-left text-xs transition-all ${currentTheme.previewCardBg}`}>
                <span className={`font-bold uppercase tracking-wider text-[10px] ${currentTheme.previewHeaderColors.movie}`}>Featured Cinema Quote</span>
                <p className={`font-serif italic my-1 ${currentTheme.previewCardText}`}>"{selectedMovie.quote}"</p>
                <p className={`font-sans text-[11px] ${currentTheme.previewBylineText}`}>— {selectedMovie.character || selectedMovie.actor || 'Character'}, <i>"{selectedMovie.title}"</i> {selectedMovie.year ? `(${selectedMovie.year})` : ''}</p>
              </div>
            )}

            {selectedGame && (
              <div className={`p-3 rounded-xl border text-left text-xs transition-all ${currentTheme.previewCardBg}`}>
                <span className={`font-bold uppercase tracking-wider text-[10px] ${currentTheme.previewHeaderColors.game}`}>Featured Video Game Quote</span>
                <p className={`font-serif italic my-1 ${currentTheme.previewCardText}`}>"{selectedGame.quote}"</p>
                <p className={`font-sans text-[11px] ${currentTheme.previewBylineText}`}>— {selectedGame.character || selectedGame.developer}, <i>"{selectedGame.title}"</i></p>
              </div>
            )}

            {selectedArt && (
              <div className={`p-3 rounded-xl border text-left text-xs transition-all ${currentTheme.previewCardBg}`}>
                <span className={`font-bold uppercase tracking-wider text-[10px] ${currentTheme.previewHeaderColors.art}`}>Featured Fine Art Quote</span>
                <p className={`font-serif italic my-1 ${currentTheme.previewCardText}`}>"{selectedArt.quote}"</p>
                <p className={`font-sans text-[11px] ${currentTheme.previewBylineText}`}>— {selectedArt.artist}, <i>"{selectedArt.title}"</i></p>
              </div>
            )}

            {!selectedBook && !selectedSong && !selectedMovie && !selectedGame && !selectedArt && (
              <div className="bg-white p-4 rounded-xl border border-dashed border-stone-300 text-stone-400 text-xs italic">
                No quotes selected. Click "Customize Quotes" above to select quotes to feature on your card.
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Fixed at Bottom */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 shrink-0 space-y-2">
          {canNativeShare && (
            <button
              id="btn-native-share"
              onClick={handleNativeShare}
              className="w-full py-2.5 sm:py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Share2 className="w-4 h-4 text-stone-900" />
              <span>Share via Apps & Socials</span>
            </button>
          )}

          <button
            id="btn-download-png"
            onClick={handleDownloadCard}
            disabled={isExporting}
            className="w-full py-2.5 sm:py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-100 font-semibold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <ImageIcon className="w-4 h-4 text-amber-300" />
            <span>{isExporting ? 'Generating PNG...' : 'Download Image (PNG)'}</span>
          </button>

          <button
            id="btn-copy-share-link"
            onClick={handleCopyLink}
            className="w-full py-2.5 sm:py-3 rounded-xl bg-white hover:bg-stone-100 text-stone-800 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border border-stone-200 active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Link & Text Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-stone-600" />
                <span>Copy Shareable Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

