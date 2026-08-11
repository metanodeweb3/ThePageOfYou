import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, X, Check, FileText } from 'lucide-react';

interface CookieBannerProps {
  onOpenPrivacyPolicy: () => void;
  forceShow?: boolean;
  onDismissForceShow?: () => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({
  onOpenPrivacyPolicy,
  forceShow = false,
  onDismissForceShow,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('privacy_consent');
    if (consent === 'essential') {
      (window as unknown as Record<string, boolean>)['ga-disable-G-J6Z2KSYKN5'] = true;
    }
    if (!consent || forceShow) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [forceShow]);

  const handleConsent = (level: 'accepted' | 'essential') => {
    localStorage.setItem('privacy_consent', level);
    localStorage.setItem('privacy_consent_date', new Date().toISOString());
    if (level === 'essential') {
      (window as unknown as Record<string, boolean>)['ga-disable-G-J6Z2KSYKN5'] = true;
    } else {
      (window as unknown as Record<string, boolean>)['ga-disable-G-J6Z2KSYKN5'] = false;
    }
    setIsVisible(false);
    if (onDismissForceShow) {
      onDismissForceShow();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 pointer-events-none animate-in slide-in-from-bottom duration-300">
      <div className="max-w-4xl mx-auto bg-stone-900/95 text-stone-100 backdrop-blur-md rounded-2xl shadow-2xl border border-stone-800 p-4 sm:p-5 pointer-events-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left side info */}
        <div className="flex items-start gap-3.5 flex-1">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-sm text-amber-100">
                Privacy & Cookie Preferences
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-stone-800 text-stone-400 px-2 py-0.5 rounded-full border border-stone-700">
                UK GDPR Notice
              </span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed max-w-2xl">
              We use essential local storage for preferences, Google Analytics to improve user experience, and Amazon affiliate cookies.
            </p>
          </div>
        </div>

        {/* Right side buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-800">
          <button
            id="btn-cookie-policy-link"
            onClick={onOpenPrivacyPolicy}
            className="text-xs text-stone-400 hover:text-amber-200 transition-colors flex items-center gap-1 py-2 px-3 rounded-lg hover:bg-stone-800/60"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Read Policy</span>
          </button>

          <button
            id="btn-cookie-essential"
            onClick={() => handleConsent('essential')}
            className="flex-1 md:flex-none text-xs font-semibold py-2 px-3.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-all active:scale-95"
          >
            Essential Only
          </button>

          <button
            id="btn-cookie-accept-all"
            onClick={() => handleConsent('accepted')}
            className="flex-1 md:flex-none text-xs font-bold py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept All</span>
          </button>

          {forceShow && (
            <button
              id="btn-dismiss-force-cookie-banner"
              onClick={() => {
                setIsVisible(false);
                if (onDismissForceShow) onDismissForceShow();
              }}
              className="p-2 text-stone-400 hover:text-stone-200 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
