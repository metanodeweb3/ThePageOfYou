import React, { useEffect } from 'react';
import { X, ShieldCheck, Lock, Eye, FileText, Database, Cookie, ExternalLink } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onManageCookies?: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  onManageCookies,
}) => {
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

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-stone-900 text-stone-100 w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-800 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[88vh] relative"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800/80 flex items-center justify-between bg-stone-950/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-amber-100">
                Privacy Policy & Cookie Notice
              </h2>
              <p className="text-xs text-stone-400">
                The Page of You (thepageofyou.com) • Last updated: August 2026
              </p>
            </div>
          </div>
          <button
            id="btn-close-privacy-modal"
            onClick={onClose}
            aria-label="Close privacy policy modal"
            className="w-8 h-8 rounded-full bg-stone-800/80 hover:bg-stone-700 flex items-center justify-center text-stone-400 hover:text-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 text-sm text-stone-300 leading-relaxed font-sans">
          {/* Section 1 */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-base font-serif">
              <Eye className="w-4 h-4" />
              <h3>1. Overview & Identity</h3>
            </div>
            <p>
              Welcome to <strong>The Page of You</strong> (<em>thepageofyou.com</em>). We are committed to maintaining the trust and confidence of our visitors. This Privacy Policy explains how we handle your data, use cookies, and comply with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-base font-serif">
              <Database className="w-4 h-4" />
              <h3>2. Data We Collect</h3>
            </div>
            <p>
              We operate under a minimal-data collection ethos. We do not require account registration or collect personal identification details like your full real name, email address, or home address unless voluntarily provided (e.g. support inquiries or creator tips).
            </p>
            <ul className="list-disc pl-5 space-y-1 text-stone-300 text-xs sm:text-sm">
              <li>
                <strong>Name Searches & Preferences:</strong> Your searched names and custom card customisations are saved locally in your browser's <code className="bg-stone-800 px-1.5 py-0.5 rounded text-amber-200">localStorage</code>.
              </li>
              <li>
                <strong>User-Generated Keepsakes:</strong> If you explicitly share or save a custom poem, acrostic, or graphics card, the card payload may be stored securely in our Firebase Firestore database to enable direct URL sharing.
              </li>
              <li>
                <strong>Analytics & Performance Data:</strong> We use Google Analytics to gather aggregated, anonymous statistics about site visitors (such as traffic counts, page views, and general geographic region) to improve site performance and content.
              </li>
              <li>
                <strong>Technical Logs:</strong> Standard web server logs (IP address, browser type, referring page) are automatically captured for operational security and fraud prevention.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-base font-serif">
              <Cookie className="w-4 h-4" />
              <h3>3. Cookies & Local Storage</h3>
            </div>
            <p>
              We use essential local storage keys to deliver core site functionality (such as keeping track of your recent searches and storing your privacy preferences) and performance cookies to understand site usage.
            </p>
            <div className="bg-stone-950/60 p-3.5 rounded-xl border border-stone-800/80 text-xs space-y-2">
              <div className="font-semibold text-amber-200">Types of Storage Used:</div>
              <p>
                <strong>Essential Storage:</strong> Local storage items used to remember your cookie consent choice and saved favorite names.
              </p>
              <p>
                <strong>Analytics Cookies (Google Analytics):</strong> Standard cookies (e.g. <code>_ga</code>) set by Google Analytics to help us analyze website traffic and visitor interactions in an anonymized manner.
              </p>
              <p>
                <strong>Affiliate Cookies (Amazon):</strong> When you click on book, song, or film product recommendations on our site, you may be redirected to Amazon via affiliate links. Amazon uses cookies to track qualifying purchases and credit affiliate commissions as detailed in our Affiliate Disclosure.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-base font-serif">
              <Lock className="w-4 h-4" />
              <h3>4. Third-Party Services</h3>
            </div>
            <p>We work with trusted third-party service providers strictly necessary to operate this site:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li><strong>Google Analytics:</strong> Used for aggregated site traffic, usage analytics, and performance monitoring.</li>
              <li><strong>Google Firebase:</strong> Used for database storage of shared cards and public submissions.</li>
              <li><strong>Amazon Associates Program:</strong> We participate in affiliate marketing programs to support site hosting costs.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-base font-serif">
              <FileText className="w-4 h-4" />
              <h3>5. Your UK GDPR & Legal Rights</h3>
            </div>
            <p>
              Under UK data protection law, you have the right to request access to, rectification of, or erasure of any personal data stored about you. Since search history is stored locally in your browser, you can completely erase your data at any time by clearing your browser cache and local storage.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-2 bg-amber-950/20 p-4 rounded-xl border border-amber-800/40">
            <h4 className="font-semibold text-amber-200 text-xs uppercase tracking-wider">Affiliate Disclosure Statement</h4>
            <p className="text-xs text-stone-300 leading-relaxed">
              As an Amazon Associate, <strong>The Page of You</strong> earns from qualifying purchases made through links on this site. This comes at zero extra cost to you and helps keep our cultural name database free and ad-light.
            </p>
          </section>
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 border-t border-stone-800/80 bg-stone-950/70 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {onManageCookies && (
            <button
              id="btn-privacy-manage-cookies"
              onClick={() => {
                onClose();
                onManageCookies();
              }}
              className="text-xs text-amber-300 hover:text-amber-200 underline underline-offset-4 font-medium transition-colors"
            >
              Manage Cookie Preferences
            </button>
          )}
          <button
            id="btn-close-privacy-bottom"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
