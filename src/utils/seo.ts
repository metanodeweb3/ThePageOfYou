import { PersonNameData } from '../types';
import { POPULAR_NAMES_DATA } from '../data/names';
import { normalizeText } from './searchEngine';

export const SITE_URL = 'https://thepageofyou.com';
export const SITE_NAME = 'The Page of You';

/**
 * Curated novelty/non-given-name entries that remain searchable on demand,
 * but are excluded from the primary A–Z Name Directory and XML Sitemap
 * so search engines see a focused, authoritative Name Etymology archive.
 */
export const EXCLUDED_NON_NAMES = new Set([
  'tomato',
  'batman',
  'hawksmoor',
  'dali',
  'beethoven',
]);

/**
 * Basic spam/abuse terms blocked before hitting Gemini or Firestore tracking.
 */
const BLOCKED_SPAM_TERMS = [
  'http',
  'https',
  'www.',
  '.com',
  '.net',
  '.org',
  '.co.uk',
  'viagra',
  'cialis',
  'casino',
  'poker',
  'crypto',
  'bitcoin',
  'porn',
  'xxx',
  'sex',
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'bastard',
  'cunt',
  'whore',
  'slut',
  'penis',
  'vagina',
  'dildo',
  'boobs',
  'anus',
  'fart',
  'toilet',
  'poop',
  'hitler',
  'stalin',
  'nazi',
  'script',
  'select ',
  'union ',
  'drop table',
];

export interface NameValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Strict input validator run BEFORE any Gemini API call or Firestore write.
 * Prevents bots, URLs, gibberish, code injection, or spam from consuming API quota.
 */
export function isValidNameInput(raw: string): NameValidationResult {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, reason: 'Please enter a name.' };
  }

  const trimmed = raw.trim();
  if (trimmed.length < 2) {
    return { valid: false, reason: 'Name must be at least 2 characters.' };
  }
  if (trimmed.length > 40) {
    return { valid: false, reason: 'Name must be 40 characters or fewer.' };
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length > 3) {
    return { valid: false, reason: 'Please enter a name (up to 3 words).' };
  }

  // Allow Unicode letters, spaces, hyphens, and apostrophes only (no digits or code symbols)
  if (!/^[\p{L}\s'-]+$/u.test(trimmed)) {
    return { valid: false, reason: 'Names may only contain letters, spaces, hyphens, or apostrophes.' };
  }

  // Reject keyboard mash / repeated character gibberish (e.g., "aaaaa", "zzzzz")
  if (/(.)\1{3,}/iu.test(trimmed)) {
    return { valid: false, reason: 'Please enter a valid name.' };
  }

  const lower = trimmed.toLowerCase();
  if (BLOCKED_SPAM_TERMS.some((term) => lower.includes(term))) {
    return { valid: false, reason: 'This search term is not supported.' };
  }

  return { valid: true };
}

/**
 * Returns true ONLY if the name exists in our vetted static curated archive
 * (excluding novelty non-name easter eggs).
 */
export function isCuratedName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const lower = name.trim().toLowerCase();
  const normalized = normalizeText(name);
  if (!normalized || EXCLUDED_NON_NAMES.has(normalized)) return false;
  return Boolean(POPULAR_NAMES_DATA[lower] || POPULAR_NAMES_DATA[normalized]);
}

/**
 * Checks whether a name slug should be indexed in the public directory and XML sitemap.
 * Strictly restricted to vetted curated given names so unmoderated user queries
 * never pollute public directories or Google search indexing.
 */
export function isIndexableName(name: string): boolean {
  const validation = isValidNameInput(name);
  if (!validation.valid) return false;
  if (!isCuratedName(name)) return false;
  const normalized = normalizeText(name);
  if (normalized.split(/\s+/).length > 2) return false;
  return true;
}

/**
 * Canonical lowercase URL slug for a name.
 */
export function getNameSlug(name: string): string {
  return encodeURIComponent(name.trim().toLowerCase().replace(/\s+/g, ' '));
}

/**
 * Clean title-case formatting for names (respecting hyphens and apostrophes).
 */
export function formatDisplayName(raw: string): string {
  const clean = raw.trim().replace(/\s+/g, ' ');
  if (!clean) return '';

  const curated = POPULAR_NAMES_DATA[clean.toLowerCase()] || POPULAR_NAMES_DATA[normalizeText(clean)];
  if (curated?.name) return curated.name;

  return clean
    .split(' ')
    .map((word) =>
      word
        .split('-')
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : ''))
        .join('-')
    )
    .join(' ');
}

/**
 * Escapes untrusted strings for safe HTML & attribute interpolation (prevents XSS).
 */
export function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Safely decodes URI path parameters without throwing URIError on malformed percent-encoding.
 */
export function safeDecodeURIComponent(raw: string | undefined | null): string {
  if (!raw || typeof raw !== 'string') return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return '';
  }
}

/**
 * Strips leading/trailing quotation marks from quote strings so UI and SSR
 * components never render double quotes like ““...””.
 */
export function stripOuterQuotes(text: string | undefined | null): string {
  if (!text) return '';
  return String(text)
    .trim()
    .replace(/^[“”"„«]+/, '')
    .replace(/[“”"„»]+$/, '')
    .trim();
}

/**
 * Truncates text gracefully on word boundaries without cutting mid-word.
 */
export function truncateClean(text: string, maxLength: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const sliced = clean.slice(0, maxLength - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  return (lastSpace > maxLength * 0.6 ? sliced.slice(0, lastSpace) : sliced).replace(/[,;:\-–—]+$/, '') + '…';
}

export interface PageSeoMeta {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  ogImageAlt: string;
  robots: string;
}

export function buildHomeSeo(): PageSeoMeta {
  return {
    title: 'The Page of You — Name Etymology, Meaning & Acrostic Poems',
    description:
      'Discover the etymology, meaning, and cultural history behind any name. Explore verified song lyrics, book quotes, film lines, and custom acrostic poems.',
    canonical: `${SITE_URL}/`,
    ogImage: `${SITE_URL}/og/default.png`,
    ogImageAlt: 'The Page of You — Name Etymology, Meaning, Acrostic Poems & Cultural Archive',
    robots: 'index, follow',
  };
}

export function buildDirectorySeo(): PageSeoMeta {
  return {
    title: 'Browse Name Meanings, Etymology & Poems — A to Z Directory',
    description:
      'Browse our curated A–Z archive of name etymologies, origins, custom acrostic poems, and verified references across books, songs, films, games, and art.',
    canonical: `${SITE_URL}/names`,
    ogImage: `${SITE_URL}/og/default.png`,
    ogImageAlt: 'Browse Name Etymology, Meanings & Acrostic Poems Directory on The Page of You',
    robots: 'index, follow',
  };
}

export function buildSongsHubSeo(): PageSeoMeta {
  return {
    title: 'Iconic Songs & Lyrics Featuring Names | The Page of You',
    description: truncateClean(
      'Explore curated songs featuring names in the title and lyrics across classic and modern names, with verified lyric quotes, name etymology, and music links.',
      158
    ),
    canonical: `${SITE_URL}/songs-with-names`,
    ogImage: `${SITE_URL}/og/default.png`,
    ogImageAlt: 'Iconic Songs & Lyrics Featuring Names on The Page of You',
    robots: 'index, follow',
  };
}

export function buildBooksHubSeo(): PageSeoMeta {
  return {
    title: 'Books & Literary Quotes Featuring Names | The Page of You',
    description: truncateClean(
      'Explore classic and modern books, literary characters, and famous quotes connected to names, paired with etymology and custom acrostic poetry.',
      158
    ),
    canonical: `${SITE_URL}/books`,
    ogImage: `${SITE_URL}/og/default.png`,
    ogImageAlt: 'Books & Literary Quotes Featuring Names on The Page of You',
    robots: 'index, follow',
  };
}

export function buildMoviesHubSeo(): PageSeoMeta {
  return {
    title: 'Film & TV Quotes Featuring Names | The Page of You',
    description: truncateClean(
      'Discover iconic film and television characters, memorable dialogue, and cinema moments tied to names across our curated cultural archive.',
      158
    ),
    canonical: `${SITE_URL}/film-and-tv`,
    ogImage: `${SITE_URL}/og/default.png`,
    ogImageAlt: 'Film & TV Quotes Featuring Names on The Page of You',
    robots: 'index, follow',
  };
}

export function buildGamesHubSeo(): PageSeoMeta {
  return {
    title: 'Video Games & Gaming Lore Featuring Names | The Page of You',
    description: truncateClean(
      'Explore iconic video games, beloved characters, and gaming lore connected to names, alongside verified etymology and bespoke acrostic poems.',
      158
    ),
    canonical: `${SITE_URL}/video-games`,
    ogImage: `${SITE_URL}/og/default.png`,
    ogImageAlt: 'Video Games & Gaming Lore Featuring Names on The Page of You',
    robots: 'index, follow',
  };
}

export function buildArtHubSeo(): PageSeoMeta {
  return {
    title: 'Fine Art & Famous Artists Connected to Names | The Page of You',
    description: truncateClean(
      'Explore museum masterpieces, portraits, and celebrated artists connected to names across our curated etymology and cultural archive.',
      158
    ),
    canonical: `${SITE_URL}/fine-art`,
    ogImage: `${SITE_URL}/og/default.png`,
    ogImageAlt: 'Fine Art & Famous Artists Connected to Names on The Page of You',
    robots: 'index, follow',
  };
}

export function buildAcrosticHubSeo(): PageSeoMeta {
  return {
    title: 'Acrostic Name Poems — Custom Verse Archive & Keepsakes',
    description: truncateClean(
      'Browse bespoke acrostic name poems with authentic etymology and meanings. Preview keepsake themes and download printable acrostic verse cards.',
      158
    ),
    canonical: `${SITE_URL}/acrostic-name-poems`,
    ogImage: `${SITE_URL}/og/default.png`,
    ogImageAlt: 'Acrostic Name Poems Gallery & Printable Keepsake Archive on The Page of You',
    robots: 'index, follow',
  };
}

export function buildNameSeo(
  nameData: PersonNameData,
  rawName: string,
  isResolved: boolean
): PageSeoMeta {
  const displayName = formatDisplayName(nameData?.name || rawName);
  const slug = getNameSlug(displayName);

  // Target <= 60 characters so Google never truncates key terms (Meaning, Etymology, Acrostic Poem)
  const fullTitle = `${displayName}: Name Meaning, Etymology, Acrostic Poem & Quotes`;
  const title =
    fullTitle.length <= 62
      ? fullTitle
      : `${displayName}: Name Meaning, Etymology & Acrostic Poem`;

  const shortMeaning = truncateClean(nameData?.meaning || 'meaning and cultural heritage', 46);
  const shortOrigin = truncateClean(nameData?.origin || 'historical origins', 28);

  const description = isResolved
    ? truncateClean(
        `Explore the etymology and meaning of ${displayName} ("${shortMeaning}", ${shortOrigin}), plus a custom acrostic poem and verified song, book & film quotes.`,
        158
      )
    : truncateClean(
        `Discover the etymology, meaning, custom acrostic poem, and cultural references across books, songs, movies, and art for the name ${displayName}.`,
        158
      );

  const canIndex = isResolved && isIndexableName(displayName);

  return {
    title,
    description,
    canonical: `${SITE_URL}/name/${slug}`,
    ogImage: `${SITE_URL}/og/${slug}.png`,
    ogImageAlt: `${displayName} — Name Etymology, Meaning & Acrostic Poem Keepsake Card`,
    robots: canIndex ? 'index, follow' : 'noindex, follow',
  };
}

export interface DirectoryNameEntry {
  slug: string;
  name: string;
  meaning: string;
  origin: string;
  referenceCount: number;
}

/**
 * Returns all real curated given names sorted alphabetically for internal linking,
 * the A–Z Browse Directory, and SSR navigation.
 */
export function getCuratedDirectoryNames(): DirectoryNameEntry[] {
  return Object.entries(POPULAR_NAMES_DATA)
    .filter(([key]) => !EXCLUDED_NON_NAMES.has(normalizeText(key)))
    .map(([key, data]) => {
      const referenceCount =
        (data.books?.length || 0) +
        (data.songs?.length || 0) +
        (data.movies?.length || 0) +
        (data.games?.length || 0) +
        (data.art?.length || 0);
      return {
        slug: key.toLowerCase(),
        name: data.name,
        meaning: data.meaning,
        origin: data.origin || 'Cultural Heritage',
        referenceCount,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface CuratedSongHubEntry {
  id: string;
  slug: string;
  name: string;
  origin: string;
  meaning: string;
  title: string;
  artist: string;
  year?: string;
  lyricsQuote: string;
  albumVibe?: string;
}

/**
 * Returns all curated songs across all real given names (zero API cost),
 * sorted alphabetically by name then song title.
 */
export function getCuratedSongsIndex(): CuratedSongHubEntry[] {
  const entries: CuratedSongHubEntry[] = [];
  for (const [key, data] of Object.entries(POPULAR_NAMES_DATA)) {
    if (EXCLUDED_NON_NAMES.has(normalizeText(key))) continue;
    if (!Array.isArray(data.songs)) continue;
    for (const song of data.songs) {
      if (!song?.title || !song?.artist || !song?.lyricsQuote) continue;
      entries.push({
        id: song.id || `${key}-${song.title}`,
        slug: key.toLowerCase(),
        name: data.name,
        origin: data.origin || 'Cultural Heritage',
        meaning: data.meaning,
        title: song.title,
        artist: song.artist,
        year: song.year,
        lyricsQuote: song.lyricsQuote,
        albumVibe: song.albumVibe,
      });
    }
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name) || a.title.localeCompare(b.title));
}

export interface CuratedBookHubEntry {
  id: string;
  slug: string;
  name: string;
  origin: string;
  title: string;
  author: string;
  year?: string;
  quote: string;
  context?: string;
}

export function getCuratedBooksIndex(): CuratedBookHubEntry[] {
  const entries: CuratedBookHubEntry[] = [];
  for (const [key, data] of Object.entries(POPULAR_NAMES_DATA)) {
    if (EXCLUDED_NON_NAMES.has(normalizeText(key))) continue;
    if (!Array.isArray(data.books)) continue;
    for (const book of data.books) {
      if (!book?.title || !book?.author || !book?.quote) continue;
      entries.push({
        id: book.id || `${key}-b-${book.title}`,
        slug: key.toLowerCase(),
        name: data.name,
        origin: data.origin || 'Cultural Heritage',
        title: book.title,
        author: book.author,
        year: book.year,
        quote: book.quote,
        context: book.context,
      });
    }
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name) || a.title.localeCompare(b.title));
}

export interface CuratedMovieHubEntry {
  id: string;
  slug: string;
  name: string;
  origin: string;
  title: string;
  character?: string;
  actor?: string;
  year?: string;
  quote: string;
}

export function getCuratedMoviesIndex(): CuratedMovieHubEntry[] {
  const entries: CuratedMovieHubEntry[] = [];
  for (const [key, data] of Object.entries(POPULAR_NAMES_DATA)) {
    if (EXCLUDED_NON_NAMES.has(normalizeText(key))) continue;
    if (!Array.isArray(data.movies)) continue;
    for (const movie of data.movies) {
      if (!movie?.title || !movie?.quote) continue;
      entries.push({
        id: movie.id || `${key}-m-${movie.title}`,
        slug: key.toLowerCase(),
        name: data.name,
        origin: data.origin || 'Cultural Heritage',
        title: movie.title,
        character: movie.character,
        actor: movie.actor,
        year: movie.year,
        quote: movie.quote,
      });
    }
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name) || a.title.localeCompare(b.title));
}

export interface CuratedGameHubEntry {
  id: string;
  slug: string;
  name: string;
  origin: string;
  title: string;
  character?: string;
  developer?: string;
  year?: string;
  quote: string;
}

export function getCuratedGamesIndex(): CuratedGameHubEntry[] {
  const entries: CuratedGameHubEntry[] = [];
  for (const [key, data] of Object.entries(POPULAR_NAMES_DATA)) {
    if (EXCLUDED_NON_NAMES.has(normalizeText(key))) continue;
    if (!Array.isArray(data.games)) continue;
    for (const game of data.games) {
      if (!game?.title || !game?.quote) continue;
      entries.push({
        id: game.id || `${key}-g-${game.title}`,
        slug: key.toLowerCase(),
        name: data.name,
        origin: data.origin || 'Cultural Heritage',
        title: game.title,
        character: game.character,
        developer: game.developer,
        year: game.year,
        quote: game.quote,
      });
    }
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name) || a.title.localeCompare(b.title));
}

export interface CuratedArtHubEntry {
  id: string;
  slug: string;
  name: string;
  origin: string;
  title: string;
  artist: string;
  year?: string;
  medium?: string;
  quote: string;
}

export function getCuratedArtIndex(): CuratedArtHubEntry[] {
  const entries: CuratedArtHubEntry[] = [];
  for (const [key, data] of Object.entries(POPULAR_NAMES_DATA)) {
    if (EXCLUDED_NON_NAMES.has(normalizeText(key))) continue;
    if (!Array.isArray(data.art)) continue;
    for (const art of data.art) {
      if (!art?.title || !art?.artist || !art?.quote) continue;
      entries.push({
        id: art.id || `${key}-a-${art.title}`,
        slug: key.toLowerCase(),
        name: data.name,
        origin: data.origin || 'Cultural Heritage',
        title: art.title,
        artist: art.artist,
        year: art.year,
        medium: art.medium,
        quote: art.quote,
      });
    }
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name) || a.title.localeCompare(b.title));
}

export interface CuratedAcrosticHubEntry {
  slug: string;
  name: string;
  origin: string;
  meaning: string;
  adjectives: string[];
  acrostic: { letter: string; line: string }[];
  fullData: PersonNameData;
}

/**
 * Returns all curated acrostic poems across all real given names (zero API cost),
 * sorted alphabetically by name.
 */
export function getCuratedAcrosticsIndex(): CuratedAcrosticHubEntry[] {
  return Object.entries(POPULAR_NAMES_DATA)
    .filter(([key, data]) => !EXCLUDED_NON_NAMES.has(normalizeText(key)) && Array.isArray(data.acrostic) && data.acrostic.length > 0)
    .map(([key, data]) => ({
      slug: key.toLowerCase(),
      name: data.name,
      origin: data.origin || 'Cultural Heritage',
      meaning: data.meaning,
      adjectives: data.adjectives || [],
      acrostic: data.acrostic || [],
      fullData: data,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Returns related curated names for internal cross-linking on /name/:slug pages.
 * Prioritizes shared linguistic origins, then fills deterministically from the curated list.
 */
export function getRelatedNames(currentName: string, currentOrigin?: string, limit = 6): DirectoryNameEntry[] {
  const currentNorm = normalizeText(currentName);
  const originTokens = (currentOrigin || '')
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((t) => t.length >= 4);

  const candidates = getCuratedDirectoryNames().filter(
    (entry) => normalizeText(entry.name) !== currentNorm
  );

  const scored = candidates.map((entry) => {
    const entryOrigin = entry.origin.toLowerCase();
    const sharedOriginScore = originTokens.reduce(
      (acc, token) => acc + (entryOrigin.includes(token) ? 2 : 0),
      0
    );
    const sameInitialScore =
      entry.name[0]?.toLowerCase() === currentName.trim()[0]?.toLowerCase() ? 1 : 0;
    return { entry, score: sharedOriginScore + sameInitialScore };
  });

  scored.sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name));
  return scored.slice(0, limit).map((s) => s.entry);
}
