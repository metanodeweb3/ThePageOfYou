import React, { useMemo } from 'react';
import { BookOpen, HelpCircle, ArrowRight, Compass } from 'lucide-react';
import { PersonNameData } from '../types';
import { getNameSlug, getRelatedNames } from '../utils/seo';

interface NameHeroHeaderProps {
  data: PersonNameData;
  onNavigate: (path: string) => void;
}

export const NameHeroHeader: React.FC<NameHeroHeaderProps> = ({ data, onNavigate }) => {
  const totalRefs =
    (data.books?.length || 0) +
    (data.songs?.length || 0) +
    (data.movies?.length || 0) +
    (data.games?.length || 0) +
    (data.art?.length || 0);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <section
      id="name-hero-section"
      className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-7 scroll-mt-4"
    >
      {/* Breadcrumb matching BreadcrumbList JSON-LD */}
      <nav
        aria-label="Breadcrumb"
        className="text-xs text-stone-500 flex flex-wrap items-center gap-1.5 mb-3"
      >
        <a
          href="/"
          onClick={(e) => handleLinkClick(e, '/')}
          className="text-amber-900 hover:underline font-medium"
        >
          Home
        </a>
        <span>/</span>
        <a
          href="/names"
          onClick={(e) => handleLinkClick(e, '/names')}
          className="text-amber-900 hover:underline font-medium"
        >
          Browse Names
        </a>
        <span>/</span>
        <span className="text-stone-700 font-semibold">{data.name}</span>
      </nav>

      {/* Primary Topical H1 Card */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 mb-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
            <span>Origin: {data.origin || 'Cultural Heritage'}</span>
          </span>
          {totalRefs > 0 && (
            <span className="text-xs font-semibold text-stone-600 bg-stone-100 border border-stone-200 px-2.5 py-0.5 rounded-md">
              Verified Cultural Archive
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tight leading-tight">
          {data.name} — Name Meaning, Etymology &amp; Cultural Archive
        </h1>

        <p className="text-base sm:text-lg font-serif italic text-stone-700 mt-2.5 leading-relaxed">
          Etymology &amp; Meaning: &ldquo;{data.meaning}&rdquo;
        </p>

        {data.adjectives && data.adjectives.length > 0 && (
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-stone-500 font-medium mr-1">Spirit &amp; Traits:</span>
            {data.adjectives.map((adj, idx) => (
              <span
                key={`${adj}-${idx}`}
                className="text-xs font-medium bg-stone-50 text-stone-700 border border-stone-200 px-2.5 py-0.5 rounded-md"
              >
                {adj}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

interface NameFaqAndRelatedProps {
  data: PersonNameData;
  onNavigate: (path: string) => void;
}

export const NameFaqAndRelated: React.FC<NameFaqAndRelatedProps> = ({ data, onNavigate }) => {
  const related = useMemo(() => getRelatedNames(data.name, data.origin, 6), [data.name, data.origin]);
  const totalRefs =
    (data.books?.length || 0) +
    (data.songs?.length || 0) +
    (data.movies?.length || 0) +
    (data.games?.length || 0) +
    (data.art?.length || 0);
  const acrosticSummary = (data.acrostic || [])
    .map((a) => `${a.letter}: ${a.line}`)
    .join(' · ');

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
      {/* Visible FAQ Section — aligns 1-to-1 with FAQPage JSON-LD */}
      <section
        aria-labelledby="name-faq-heading"
        className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-7 shadow-xs"
      >
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-amber-700 shrink-0" />
          <h2 id="name-faq-heading" className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
            Frequently Asked Questions about {data.name}
          </h2>
        </div>

        <dl className="divide-y divide-stone-100">
          <div className="py-3 first:pt-0">
            <dt className="text-sm sm:text-base font-serif font-bold text-stone-900">
              What is the etymology and meaning of the name {data.name}?
            </dt>
            <dd className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
              The name {data.name} has {data.origin || 'historical linguistic'} origins and means &ldquo;{data.meaning}&rdquo;.
            </dd>
          </div>

          <div className="py-3">
            <dt className="text-sm sm:text-base font-serif font-bold text-stone-900">
              What is an acrostic poem for {data.name}?
            </dt>
            <dd className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
              {acrosticSummary ||
                `A personalised acrostic poem celebrating each letter and quality of the name ${data.name}.`}
            </dd>
          </div>

          <div className="py-3 last:pb-0">
            <dt className="text-sm sm:text-base font-serif font-bold text-stone-900">
              Where does the name {data.name} appear in books, songs, and movies?
            </dt>
            <dd className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
              {totalRefs > 0
                ? `The Page of You archives verified cultural references for ${data.name} across literature, song lyrics, cinema, video games, and fine art — with additional entries discoverable on demand.`
                : `Use the search bar above or category discovery buttons to uncover literary, musical, and cinematic mentions of ${data.name}.`}
            </dd>
          </div>
        </dl>
      </section>

      {/* Related Names Internal Cross-Linking Hub */}
      {related.length > 0 && (
        <section
          aria-labelledby="related-names-heading"
          className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-7 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-700 shrink-0" />
              <h2 id="related-names-heading" className="text-lg sm:text-xl font-serif font-bold text-stone-900">
                Explore Similar Name Etymologies
              </h2>
            </div>
            <a
              href="/names"
              onClick={(e) => handleLinkClick(e, '/names')}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-amber-900 hover:underline"
            >
              <span>Browse Full A–Z Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {related.map((entry) => {
              const href = `/name/${getNameSlug(entry.name)}`;
              return (
                <a
                  key={entry.slug}
                  href={href}
                  onClick={(e) => handleLinkClick(e, href)}
                  className="group p-3.5 rounded-xl bg-stone-50/80 hover:bg-amber-50/60 border border-stone-200/80 hover:border-amber-300/80 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-base text-stone-900 group-hover:text-amber-900">
                      {entry.name}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-[11px] font-medium text-stone-500 mt-0.5">{entry.origin}</p>
                  <p className="text-xs font-serif italic text-stone-700 mt-1 line-clamp-1">
                    &ldquo;{entry.meaning}&rdquo;
                  </p>
                </a>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
