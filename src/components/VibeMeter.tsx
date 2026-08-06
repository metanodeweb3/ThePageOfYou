import React from 'react';
import { PersonNameData } from '../types';
import { Sparkles } from 'lucide-react';

interface VibeMeterProps {
  data: PersonNameData;
}

export const VibeMeter: React.FC<VibeMeterProps> = ({ data }) => {
  const gamesCount = data.games?.length || 0;
  const artCount = data.art?.length || 0;
  const total = data.books.length + data.songs.length + data.movies.length + gamesCount + artCount;
  if (total === 0) return null;

  const bookPct = Math.round((data.books.length / total) * 100);
  const songPct = Math.round((data.songs.length / total) * 100);
  const moviePct = Math.round((data.movies.length / total) * 100);
  const gamePct = Math.round((gamesCount / total) * 100);
  const artPct = Math.round((artCount / total) * 100);

  return (
    <div id="vibe-meter-section" className="w-full max-w-5xl mx-auto px-4 sm:px-6 my-6">
      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-serif font-bold text-stone-900">
            {data.name}'s Cultural Vibe Breakdown:
          </span>
        </div>

        <div className="w-full sm:w-auto flex-1 max-w-md bg-stone-100 h-3 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${bookPct}%` }}
            className="bg-amber-600 h-full transition-all"
            title={`Literature: ${bookPct}%`}
          />
          <div
            style={{ width: `${songPct}%` }}
            className="bg-emerald-600 h-full transition-all"
            title={`Music: ${songPct}%`}
          />
          <div
            style={{ width: `${moviePct}%` }}
            className="bg-sky-600 h-full transition-all"
            title={`Cinema: ${moviePct}%`}
          />
          <div
            style={{ width: `${gamePct}%` }}
            className="bg-violet-600 h-full transition-all"
            title={`Video Games: ${gamePct}%`}
          />
          <div
            style={{ width: `${artPct}%` }}
            className="bg-rose-600 h-full transition-all"
            title={`Fine Art: ${artPct}%`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium text-stone-600">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" /> Books ({bookPct}%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Songs ({songPct}%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block" /> Movies ({moviePct}%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600 inline-block" /> Games ({gamePct}%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> Art ({artPct}%)
          </span>
        </div>
      </div>
    </div>
  );
};
