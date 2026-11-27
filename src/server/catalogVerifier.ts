/**
 * Real-World Catalog Verifier for "The Page of You"
 *
 * Strictly verifies AI-suggested cultural references (books, songs, movies/TV,
 * video games, fine art) against free, real-world public catalog APIs BEFORE
 * any entry is shown to users or persisted to cache/Firestore.
 *
 * Fail-closed policy: if no real-world catalog confirms an item exists, it is
 * silently dropped so fabricated products can never appear on the site.
 */

export type VerifiableCategory = 'books' | 'songs' | 'movies' | 'games' | 'art';

const USER_AGENT = 'ThePageOfYou/1.0 (https://thepageofyou.com; catalog-verifier)';
const FETCH_TIMEOUT_MS = 4500;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_SIZE = 4000;

const verificationCache = new Map<string, { verified: boolean; timestamp: number }>();

const BANNED_GAME_PORTALS = [
  'crazygames',
  'poki',
  'coolmath',
  'friv',
  'kizi',
  'agame',
  'addicting games',
  'miniclip',
  'y8.com',
  'y8 games',
  'kongregate',
];

const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'of',
  'in',
  'on',
  'at',
  'to',
  'for',
  'and',
  'or',
  'by',
  'with',
  'from',
  'is',
  'it',
  'its',
  'la',
  'el',
  'le',
  'les',
  'de',
  'del',
  'des',
  'der',
  'die',
  'das',
]);

function getCachedVerification(key: string): boolean | null {
  const entry = verificationCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    verificationCache.delete(key);
    return null;
  }
  return entry.verified;
}

function setCachedVerification(key: string, verified: boolean) {
  if (verificationCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = verificationCache.keys().next().value;
    if (oldestKey) verificationCache.delete(oldestKey);
  }
  verificationCache.set(key, { verified, timestamp: Date.now() });
}

function stripDiacritics(input: string): string {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normalizes a title for fuzzy-safe comparison:
 * strips parenthetical disambiguation, trademark symbols, punctuation, and leading articles.
 */
function normalizeTitle(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return stripDiacritics(raw)
    .toLowerCase()
    .replace(/[™®©]/g, '')
    .replace(/\((?:[^()]*)\)/g, ' ')
    .replace(/\[(?:[^[\]]*)\]/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(?:the|a|an)\s+/, '');
}

function normalizePrimaryTitle(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const beforeColon = raw.split(/[:–—]/)[0] || raw;
  return normalizeTitle(beforeColon);
}

function getSignificantTokens(norm: string): string[] {
  return norm
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
}

/**
 * Strict title matcher designed to accept edition/subtitle variations
 * (e.g., "The Last of Us" vs "The Last of Us™ Part I") while rejecting
 * coincidental partial overlaps.
 */
function titlesMatch(candidateRaw: string, actualRaw: string): boolean {
  const cand = normalizeTitle(candidateRaw);
  const actual = normalizeTitle(actualRaw);
  if (!cand || !actual) return false;
  if (cand === actual) return true;

  const candPrimary = normalizePrimaryTitle(candidateRaw);
  const actualPrimary = normalizePrimaryTitle(actualRaw);
  if (candPrimary && actualPrimary && candPrimary === actualPrimary && candPrimary.length >= 3) {
    return true;
  }

  const candTokens = getSignificantTokens(cand);
  const actualTokens = getSignificantTokens(actual);
  if (candTokens.length === 0 || actualTokens.length === 0) return false;

  // Single-word titles must match closely (exact or exact prefix before subtitle/edition)
  if (candTokens.length === 1) {
    const token = candTokens[0];
    if (token.length < 3) return false;
    return actual === token || actualPrimary === token;
  }

  // Multi-word titles: every significant candidate token must exist in actual title
  const actualSet = new Set(actualTokens);
  const matchedCount = candTokens.filter((t) => actualSet.has(t)).length;
  const candCoverage = matchedCount / candTokens.length;
  const actualCoverage = matchedCount / actualTokens.length;

  // Allow exact subset when actual has edition suffixes (e.g. "Part I", "Remastered", "Season 1")
  if (candCoverage === 1 && (actualCoverage >= 0.5 || actual.startsWith(`${cand} `))) {
    return true;
  }

  // Allow high bidirectional overlap for long titles (e.g. minor subtitle phrasing differences)
  if (candTokens.length >= 3 && candCoverage >= 0.8 && actualCoverage >= 0.65) {
    return true;
  }

  return false;
}

/**
 * Checks whether an expected creator name (author, artist, band) matches a catalog string.
 */
function creatorsMatch(expectedRaw: string | undefined, actualRaw: string | undefined): boolean {
  if (!expectedRaw || !expectedRaw.trim()) return true;
  if (!actualRaw || !actualRaw.trim()) return false;

  const expected = normalizeTitle(expectedRaw);
  const actual = normalizeTitle(actualRaw);
  if (!expected || !actual) return false;
  if (actual.includes(expected) || expected.includes(actual)) return true;

  const expectedTokens = expected
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t) && !['feat', 'featuring', 'band', 'orchestra'].includes(t));

  if (expectedTokens.length === 0) return true;

  const actualTokens = new Set(actual.split(/\s+/));
  // Surname (last token) is strongest identifier for people; check exact token match
  const surname = expectedTokens[expectedTokens.length - 1];
  if (surname.length >= 4 && actualTokens.has(surname)) return true;

  const matches = expectedTokens.filter((t) => actualTokens.has(t)).length;
  return matches >= Math.max(1, Math.ceil(expectedTokens.length * 0.6));
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
}

async function fetchJsonSafe(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function verifyViaWikipedia(
  title: string,
  extraQuery: string,
  requiredKeywords: string[],
  creator?: string
): Promise<boolean> {
  const query = `${title} ${extraQuery}`.trim();
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    query
  )}&format=json&srlimit=6&utf8=1`;
  const data = await fetchJsonSafe(url);
  const results: any[] = data?.query?.search || [];
  if (!Array.isArray(results) || results.length === 0) return false;

  for (const hit of results) {
    const hitTitle = String(hit?.title || '');
    const snippet = stripHtmlTags(String(hit?.snippet || '')).toLowerCase();
    const combinedText = `${hitTitle.toLowerCase()} ${snippet}`;

    if (!titlesMatch(title, hitTitle)) continue;

    const hasKeyword = requiredKeywords.some((kw) => combinedText.includes(kw));
    if (!hasKeyword) continue;

    if (creator && creator.trim()) {
      const creatorNorm = normalizeTitle(creator);
      const creatorTokens = creatorNorm.split(/\s+/).filter((t) => t.length >= 4 && !STOP_WORDS.has(t));
      const surname = creatorTokens[creatorTokens.length - 1];
      if (surname && !stripDiacritics(combinedText).includes(surname)) {
        continue;
      }
    }

    return true;
  }

  return false;
}

async function verifyBook(item: { title?: string; author?: string }): Promise<boolean> {
  const title = String(item?.title || '').trim();
  const author = String(item?.author || '').trim();
  if (!title) return false;

  // 1. Open Library Search API (free, authoritative book catalog)
  const olParams = new URLSearchParams({
    title,
    limit: '6',
    fields: 'title,author_name',
  });
  if (author) olParams.set('author', author);

  const olData = await fetchJsonSafe(`https://openlibrary.org/search.json?${olParams.toString()}`);
  const olDocs: any[] = olData?.docs || [];
  for (const doc of olDocs) {
    const docTitle = String(doc?.title || '');
    const docAuthors = Array.isArray(doc?.author_name) ? doc.author_name.join(' ') : '';
    if (titlesMatch(title, docTitle) && creatorsMatch(author, docAuthors)) {
      return true;
    }
  }

  // 2. Apple iTunes Books Search API (free, no key)
  const itunesTerm = author ? `${title} ${author}` : title;
  const itunesData = await fetchJsonSafe(
    `https://itunes.apple.com/search?term=${encodeURIComponent(itunesTerm)}&media=ebook&limit=6`
  );
  const itunesResults: any[] = itunesData?.results || [];
  for (const r of itunesResults) {
    if (titlesMatch(title, String(r?.trackName || '')) && creatorsMatch(author, String(r?.artistName || ''))) {
      return true;
    }
  }

  // 3. Wikipedia literary verification
  return verifyViaWikipedia(
    title,
    author ? `${author} book novel` : 'book novel',
    ['novel', 'book', 'short story', 'poem', 'play', 'memoir', 'biography', 'written by', 'author', 'published'],
    author
  );
}

async function verifySong(item: { title?: string; artist?: string }): Promise<boolean> {
  const title = String(item?.title || '').trim();
  const artist = String(item?.artist || '').trim();
  if (!title || !artist) return false;

  // 1. Apple iTunes Music Search API (free, no key, real commercial recordings)
  const itunesData = await fetchJsonSafe(
    `https://itunes.apple.com/search?term=${encodeURIComponent(`${title} ${artist}`)}&entity=song&limit=8`
  );
  const itunesResults: any[] = itunesData?.results || [];
  for (const r of itunesResults) {
    if (titlesMatch(title, String(r?.trackName || '')) && creatorsMatch(artist, String(r?.artistName || ''))) {
      return true;
    }
  }

  // 2. Wikipedia song verification (catches classic/historical songs or alternate spellings)
  const wikiOk = await verifyViaWikipedia(
    title,
    `${artist} song`,
    ['song', 'single', 'album', 'track', 'recorded by', 'released', 'singer', 'band', 'musician', 'ballad', 'soundtrack'],
    artist
  );
  if (wikiOk) return true;

  // 3. MusicBrainz Recording Search API (free, open music encyclopedia)
  const mbQuery = `recording:"${title.replace(/"/g, '')}" AND artist:"${artist.replace(/"/g, '')}"`;
  const mbData = await fetchJsonSafe(
    `https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(mbQuery)}&fmt=json&limit=5`
  );
  const recordings: any[] = mbData?.recordings || [];
  for (const rec of recordings) {
    const recTitle = String(rec?.title || '');
    const recArtists = Array.isArray(rec?.['artist-credit'])
      ? rec['artist-credit'].map((a: any) => a?.name || a?.artist?.name || '').join(' ')
      : '';
    if (titlesMatch(title, recTitle) && creatorsMatch(artist, recArtists)) {
      return true;
    }
  }

  return false;
}

async function verifyMovie(item: { title?: string; year?: string }): Promise<boolean> {
  const title = String(item?.title || '').trim();
  if (!title) return false;

  // 1. Apple iTunes Movie & TV Show Search API (free, real commercial catalog)
  const itunesData = await fetchJsonSafe(
    `https://itunes.apple.com/search?term=${encodeURIComponent(title)}&entity=movie,tvSeason&limit=10`
  );
  const itunesResults: any[] = itunesData?.results || [];
  for (const r of itunesResults) {
    const candidateNames = [String(r?.trackName || ''), String(r?.collectionName || ''), String(r?.artistName || '')];
    if (candidateNames.some((n) => n && titlesMatch(title, n))) {
      return true;
    }
  }

  // 2. Wikipedia film/TV verification
  return verifyViaWikipedia(title, 'film television series', [
    'film',
    'movie',
    'television',
    'tv series',
    'sitcom',
    'miniseries',
    'directed by',
    'starring',
    'animated',
    'anime',
    'drama series',
    'comedy series',
    'documentary',
    'screenplay',
    'cinema',
  ]);
}

async function verifyGame(item: { title?: string; developer?: string }): Promise<boolean> {
  const title = String(item?.title || '').trim();
  const developer = String(item?.developer || '').trim();
  if (!title) return false;

  // Reject known browser-portal hallucination tropes immediately
  const combinedLower = `${title} ${developer}`.toLowerCase();
  if (BANNED_GAME_PORTALS.some((portal) => combinedLower.includes(portal))) {
    return false;
  }

  // 1. Steam Store Search API (free, authoritative commercial PC/multiplatform catalog)
  const steamData = await fetchJsonSafe(
    `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(title)}&l=english&cc=US`
  );
  const steamItems: any[] = steamData?.items || [];
  for (const sItem of steamItems) {
    if (titlesMatch(title, String(sItem?.name || ''))) {
      return true;
    }
  }

  // 2. Wikipedia Video Game verification (covers Nintendo, PlayStation, Xbox, retro & arcade classics)
  return verifyViaWikipedia(title, '"video game"', [
    'video game',
    'action-adventure',
    'role-playing game',
    'platform game',
    'fighting game',
    'arcade game',
    'first-person shooter',
    'survival horror',
    'developed by',
    'published by',
    'nintendo',
    'playstation',
    'xbox',
    'sega',
    'capcom',
    'square enix',
    'konami',
    'bandai namco',
    'gameplay',
    'playable character',
  ]);
}

async function verifyArt(item: { title?: string; artist?: string }): Promise<boolean> {
  const title = String(item?.title || '').trim();
  const artist = String(item?.artist || '').trim();
  if (!title) return false;

  // 1. Art Institute of Chicago Public API (free, authoritative museum catalog)
  const aicQuery = artist ? `${title} ${artist}` : title;
  const aicData = await fetchJsonSafe(
    `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(aicQuery)}&limit=6&fields=title,artist_title`
  );
  const aicItems: any[] = aicData?.data || [];
  for (const artItem of aicItems) {
    if (titlesMatch(title, String(artItem?.title || '')) && creatorsMatch(artist, String(artItem?.artist_title || ''))) {
      return true;
    }
  }

  // 2. Wikipedia Fine Art verification (requires matching artwork title + art context + artist surname)
  return verifyViaWikipedia(
    title,
    artist ? `${artist} painting sculpture artwork` : 'painting sculpture artwork',
    [
      'painting',
      'sculpture',
      'oil on canvas',
      'canvas',
      'fresco',
      'mural',
      'artwork',
      'museum',
      'gallery',
      'painted by',
      'artist',
      'portrait',
      'etching',
      'lithograph',
      'photograph',
      'watercolor',
      'statue',
      'masterpiece',
    ],
    artist
  );
}

/**
 * Verifies a single cultural reference against real-world catalogs with caching.
 */
export async function verifyCulturalItem(item: any, category: VerifiableCategory): Promise<boolean> {
  if (!item || typeof item !== 'object') return false;
  const title = String(item.title || '').trim();
  if (!title || title.length < 2) return false;

  const creator = String(item.author || item.artist || item.developer || '').trim();
  const cacheKey = `${category}:${normalizeTitle(title)}:${normalizeTitle(creator)}`;
  const cached = getCachedVerification(cacheKey);
  if (cached !== null) return cached;

  let verified = false;
  try {
    switch (category) {
      case 'books':
        verified = await verifyBook(item);
        break;
      case 'songs':
        verified = await verifySong(item);
        break;
      case 'movies':
        verified = await verifyMovie(item);
        break;
      case 'games':
        verified = await verifyGame(item);
        break;
      case 'art':
        verified = await verifyArt(item);
        break;
    }
  } catch {
    verified = false;
  }

  setCachedVerification(cacheKey, verified);
  return verified;
}

/**
 * Filters a list of candidate items in parallel, keeping ONLY items verified to
 * exist in real-world catalogs.
 */
export async function filterVerifiedCulturalItems<T>(
  items: T[],
  category: VerifiableCategory
): Promise<T[]> {
  if (!Array.isArray(items) || items.length === 0) return [];
  const checks = await Promise.all(
    items.map(async (item) => ({
      item,
      ok: await verifyCulturalItem(item, category),
    }))
  );
  const kept = checks.filter((c) => c.ok).map((c) => c.item);
  const droppedCount = items.length - kept.length;
  if (droppedCount > 0) {
    console.log(
      `[CatalogVerifier] Dropped ${droppedCount} unverified ${category} candidate(s) to prevent hallucinations.`
    );
  }
  return kept;
}
