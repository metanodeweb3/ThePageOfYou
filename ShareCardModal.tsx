import React, { useState, useEffect } from 'react';
import { X, Coffee, Heart, ExternalLink, Check } from 'lucide-react';

interface CoffeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoffeeModal: React.FC<CoffeeModalProps> = ({ isOpen, onClose }) => {
  const [selectedTip, setSelectedTip] = useState<number>(5);
  const [thanked, setThanked] = useState(false);

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

  const handleSupport = () => {
    // Open Buy Me a Coffee page in new tab
    window.open('https://buymeacoffee.com/thepageofyou', '_blank', 'noopener,noreferrer');
    setThanked(true);
    setTimeout(() => {
      setThanked(false);
      onClose();
    }, 3500);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh] relative animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-amber-50/60 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
              <Coffee className="w-4 h-4" />
            </div>
            <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900">
              Buy Me a Coffee ☕
            </h3>
          </div>
          <button
            id="btn-close-coffee"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-stone-200/80 hover:bg-stone-300 flex items-center justify-center text-stone-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 text-center space-y-5 overflow-y-auto flex-1">
          <p className="text-sm text-stone-600 leading-relaxed">
            "The Page of You" is a passion project curating literary quotes, songs, and film lines without intrusive ads.
            If you enjoyed finding your name's cultural footprint, consider buying the creator a coffee!
          </p>

          {/* Tip Amount Selector */}
          <div className="flex items-center justify-center gap-3">
            {[3, 5, 10].map((amount) => (
              <button
                key={amount}
                id={`btn-tip-${amount}`}
                onClick={() => setSelectedTip(amount)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${
                  selectedTip === amount
                    ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs scale-105'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                ☕ ${amount}
              </button>
            ))}
          </div>

          <button
            id="btn-coffee-submit"
            onClick={handleSupport}
            disabled={thanked}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            {thanked ? (
              <>
                <Check className="w-4 h-4 text-emerald-900" />
                <span className="text-stone-900 font-semibold">Opening buymeacoffee.com/thepageofyou... ❤️</span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 text-rose-700 fill-rose-700" />
                <span>Support with ${selectedTip} Coffee</span>
                <ExternalLink className="w-3.5 h-3.5 text-stone-800 ml-1" />
              </>
            )}
          </button>

          <div className="pt-1">
            <a
              href="https://buymeacoffee.com/thepageofyou"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900 font-medium underline decoration-amber-300 transition-colors"
            >
              <span>Visit buymeacoffee.com/thepageofyou directly</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-[11px] text-stone-400 font-medium">
            100% ad-free & indie supported. Thank you!
          </p>
        </div>
      </div>
    </div>
  );
};


