import express from 'express';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, increment } from 'firebase/firestore';
import dotenv from 'dotenv';
import { findFallbackName, POPULAR_NAMES_DATA } from './src/data/fallbackData';
import { normalizeText } from './src/utils/searchEngine';
import {
  SITE_URL,
  formatDisplayName,
  getCuratedDirectoryNames,
  getNameSlug,
  isIndexableName,
  isValidNameInput,
  safeDecodeURIComponent,
} from './src/utils/seo';
import { renderOgImagePng } from './src/server/ogImage';
import {
  renderAcrosticHubHtml,
  renderDirectoryHtml,
  renderHomeHtml,
  renderMediaHubHtml,
  renderNameHtml,
  renderSongsHubHtml,
} from './src/server/ssrRenderer';
import { filterVerifiedCulturalItems, type VerifiableCategory } from './src/server/catalogVerifier';

dotenv.config();

const CURRENT_SCHEMA_VERSION = 4;

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(compression());
app.use(express.json({ limit: '64kb' }));

// Standard HTTP security headers (iframe-safe for AI Studio preview)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production' && (req.secure || req.headers['x-forwarded-proto'] === 'https')) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Initialize Firestore Server Instance lazily
let firestoreDb: any = null;
function getFirestoreDb() {
  if (firestoreDb) return firestoreDb;
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const fbApp = getApps().length > 0 ? getApps()[0] : initializeApp(config);
      firestoreDb = getFirestore(fbApp, config.firestoreDatabaseId || '(default)');
      return firestoreDb;
    }
  } catch (err) {
    console.warn('Server Firestore initialization notice:', err);
  }
  return null;
}

// Initialize Gemini AI Client lazily and safely
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-Memory Cache for Lookup Results (24h TTL, max 2000 items)
const lookupCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 2000;

function setInLookupCache(key: string, data: any) {
  if (!key) return;
  if (lookupCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = lookupCache.keys().next().value;
    if (oldestKey) lookupCache.delete(oldestKey);
  }
  lookupCache.set(key, { data, timestamp: Date.now() });
}

// Per-IP Rate Limiters (minute + hourly buckets) and In-Flight Deduplication Maps
const ipLookupMinuteCounts = new Map<string, { count: number; resetTime: number }>();
const ipLookupHourCounts = new Map<string, { count: number; resetTime: number }>();
const ipEnrichMinuteCounts = new Map<string, { count: number; resetTime: number }>();
const inFlightLookups = new Map<string, Promise<any>>();
const inFlightEnrichments = new Map<string, Promise<any>>();

const MINUTE_WINDOW_MS = 60 * 1000;
const HOUR_WINDOW_MS = 60 * 60 * 1000;
const MAX_LOOKUP_PER_MINUTE = 6;
const MAX_LOOKUP_PER_HOUR = 20;
const MAX_ENRICH_PER_MINUTE = 4;

const BOT_UA_PATTERN =
  /bot|crawler|spider|slurp|mediapartners|facebookexternalhit|whatsapp|telegrambot|twitterbot|linkedinbot|discordbot|pinterest|bytespider|gptbot|claudebot|anthropic|ccbot|ahrefs|semrush|mj12bot|dotbot|petalbot|yandex|baiduspider|headlesschrome|puppeteer|playwright|scrapy|python-requests|go-http-client|wget/i;

function isAutomatedBot(req: express.Request): boolean {
  const ua = String(req.headers['user-agent'] || '').trim();
  if (!ua) return true;
  return BOT_UA_PATTERN.test(ua);
}

function isAllowedApiOrigin(req: express.Request): boolean {
  const origin = String(req.headers.origin || '').trim();
  if (!origin) return true; // Same-origin or non-CORS requests without Origin header
  try {
    const parsed = new URL(origin);
    const reqHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim().toLowerCase();
    if (reqHost && parsed.host.toLowerCase() === reqHost) return true;
    if (
      parsed.hostname === 'thepageofyou.com' ||
      parsed.hostname.endsWith('.thepageofyou.com') ||
      parsed.hostname.endsWith('.run.app') ||
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1'
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function getClientIp(req: express.Request): string {
  return (
    ((req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown')
      .split(',')[0]
      .trim()
  );
}

function checkRateLimit(
  bucket: Map<string, { count: number; resetTime: number }>,
  ip: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = bucket.get(ip);
  if (!entry || now > entry.resetTime) {
    bucket.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= maxRequests;
}

// Global Daily Gemini API Budget Circuit Breaker (prevents runaway costs from bots/traffic spikes)
const MAX_DAILY_GEMINI_CALLS = Math.max(
  10,
  parseInt(process.env.MAX_DAILY_GEMINI_CALLS || '200', 10) || 200
);
let dailyGeminiUsage = {
  dateUtc: new Date().toISOString().slice(0, 10),
  count: 0,
};

function canSpendGeminiCall(): boolean {
  const todayUtc = new Date().toISOString().slice(0, 10);
  if (dailyGeminiUsage.dateUtc !== todayUtc) {
    dailyGeminiUsage = { dateUtc: todayUtc, count: 0 };
  }
  return dailyGeminiUsage.count < MAX_DAILY_GEMINI_CALLS;
}

function recordGeminiCall() {
  const todayUtc = new Date().toISOString().slice(0, 10);
  if (dailyGeminiUsage.dateUtc !== todayUtc) {
    dailyGeminiUsage = { dateUtc: todayUtc, count: 1 };
  } else {
    dailyGeminiUsage.count += 1;
  }
}

// Periodic cleanup of stale rate limiter IP records and expired cache entries every 5 minutes
setInterval(() => {
  const currentTime = Date.now();
  for (const [ip, data] of ipLookupMinuteCounts.entries()) {
    if (currentTime > data.resetTime) ipLookupMinuteCounts.delete(ip);
  }
  for (const [ip, data] of ipLookupHourCounts.entries()) {
    if (currentTime > data.resetTime) ipLookupHourCounts.delete(ip);
  }
  for (const [ip, data] of ipEnrichMinuteCounts.entries()) {
    if (currentTime > data.resetTime) ipEnrichMinuteCounts.delete(ip);
  }
  for (const [key, entry] of lookupCache.entries()) {
    if (currentTime - entry.timestamp > CACHE_TTL_MS) {
      lookupCache.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

// Validate cultural relevance and prevent AI hallucinations
function isValidCulturalItem(item: any, searchName: string): boolean {
  if (!item || typeof item !== 'object') return false;

  const text = JSON.stringify(item).toLowerCase();

  // Reject placeholder artifacts
  if (
    text.includes('cultural archive') ||
    text.includes('global musical ensemble') ||
    text.includes('master ensemble cast') ||
    text.includes('interactive media studios') ||
    text.includes('master fine artists')
  ) {
    return false;
  }

  const clean = normalizeText(searchName);
  const tokens = clean.split(/[^a-z0-9]+/).filter((t) => t.length >= 3);
  if (tokens.length === 0) {
    return text.includes(clean);
  }

  return tokens.some((token) => text.includes(token));
}

/**
 * Validates cached entries without forcing unnecessary Gemini re-calls.
 * Previously requiring >=2 entries in ALL 5 categories caused perpetual cache misses
 * and repeat API billing whenever a real name had fewer entries in games or fine art.
 */
function isCachedDataValid(data: any, searchName: string): boolean {
  if (!data || typeof data !== 'object') return false;
  if (!data.meaning || typeof data.meaning !== 'string') return false;
  if (!Array.isArray(data.acrostic) || data.acrostic.length === 0) return false;

  const categories = ['books', 'songs', 'movies', 'games', 'art'] as const;
  let totalValidItems = 0;

  for (const cat of categories) {
    if (!Array.isArray(data[cat])) continue;
    for (const item of data[cat]) {
      if (!isValidCulturalItem(item, searchName)) {
        return false;
      }
      totalValidItems += 1;
    }
  }

  return totalValidItems >= 1;
}

/**
 * Resolves a name strictly from zero-cost sources (curated dataset -> in-memory cache -> Firestore cache).
 * NEVER calls Gemini, ensuring bots/crawlers on SSR or OG routes cost $0.
 */
async function resolveCachedOrCuratedName(rawName: string): Promise<{
  data: any;
  isResolved: boolean;
  source: 'curated' | 'cache' | 'firestore_cache' | 'fallback';
}> {
  const cleanName = rawName.trim();
  const lowerName = cleanName.toLowerCase();
  const normalizedName = normalizeText(cleanName);

  // 1. Static curated dataset (0ms, $0)
  const curated = POPULAR_NAMES_DATA[lowerName] || POPULAR_NAMES_DATA[normalizedName];
  if (curated) {
    return { data: curated, isResolved: true, source: 'curated' };
  }

  // 2. In-memory lookup cache (0ms, $0)
  const now = Date.now();
  const cachedEntry = lookupCache.get(normalizedName) || lookupCache.get(lowerName);
  if (cachedEntry && now - cachedEntry.timestamp < CACHE_TTL_MS) {
    if (isCachedDataValid(cachedEntry.data, cleanName)) {
      return { data: cachedEntry.data, isResolved: true, source: 'cache' };
    }
  }

  // 3. Firestore persistent cache using canonical normalizedName key
  const db = getFirestoreDb();
  if (db && normalizedName) {
    try {
      const cacheDocRef = doc(db, 'name_cache', normalizedName);
      const docSnap = await getDoc(cacheDocRef);
      if (docSnap.exists()) {
        const fsData = docSnap.data();
        const isFreshSchema = (fsData?.schemaVersion || 0) >= CURRENT_SCHEMA_VERSION;
        if (fsData?.data && isFreshSchema && isCachedDataValid(fsData.data, cleanName)) {
          setInLookupCache(normalizedName, fsData.data);
          if (lowerName !== normalizedName) setInLookupCache(lowerName, fsData.data);
          return { data: fsData.data, isResolved: true, source: 'firestore_cache' };
        }
      }
    } catch (err) {
      console.warn('Firestore resolveCachedOrCuratedName notice:', err);
    }
  }

  // 4. Procedural fallback (marked isResolved = false so SSR sets noindex & does not lock client)
  return {
    data: findFallbackName(cleanName),
    isResolved: false,
    source: 'fallback',
  };
}

/**
 * Collects strictly vetted curated names for sitemap.xml and /names directory.
 * Custom user-searched names remain privately cached in name_cache for fast repeat
 * loads, but are never auto-published into public directories or search sitemaps.
 */
async function collectIndexableNames(): Promise<string[]> {
  return getCuratedDirectoryNames()
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

// Direct route for robots.txt (explicitly allows /og/ PNG cards, disallows /api/)
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  res.send(
    `User-agent: *\nAllow: /\nAllow: /og/\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
  );
});

// Dynamic XML Sitemap for Homepage, Directory, and verified indexable names
app.get('/sitemap.xml', async (_req, res) => {
  try {
    const indexableNames = await collectIndexableNames();
    const today = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Homepage
    xml += `  <url>\n`;
    xml += `    <loc>${SITE_URL}/</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;

    // Browse Names Directory
    xml += `  <url>\n`;
    xml += `    <loc>${SITE_URL}/names</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    xml += `  </url>\n`;

    // Thematic SEO Hubs
    for (const hubPath of [
      '/books',
      '/songs-with-names',
      '/film-and-tv',
      '/video-games',
      '/fine-art',
      '/acrostic-name-poems',
    ]) {
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}${hubPath}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      xml += `  </url>\n`;
    }

    // Individual verified name pages
    for (const displayName of indexableNames) {
      const slug = getNameSlug(displayName);
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}/name/${slug}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.send(xml);
  } catch (err) {
    console.error('Failed generating sitemap.xml:', err);
    res.status(500).type('text/plain').send('Error generating sitemap');
  }
});

// Crawlable PNG Open Graph Cards (/og/default.png & /og/:nameSlug.png) — NOT blocked by robots.txt
app.get('/og/default.png', (_req, res) => {
  try {
    const png = renderOgImagePng();
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    return res.send(png);
  } catch (err) {
    console.error('Failed rendering default OG PNG:', err);
    return res.status(500).type('text/plain').send('Error generating image');
  }
});

app.get('/og/:nameSlug.png', async (req, res) => {
  try {
    const rawSlug = safeDecodeURIComponent(req.params.nameSlug || '').trim();
    if (!rawSlug || rawSlug.toLowerCase() === 'default' || !isValidNameInput(rawSlug).valid) {
      const png = renderOgImagePng();
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
      return res.send(png);
    }

    const { data, isResolved } = await resolveCachedOrCuratedName(rawSlug);
    // Protect CPU & PNG cache from random-URL scraping: only render custom PNGs for resolved names
    const png = isResolved ? renderOgImagePng(rawSlug, data) : renderOgImagePng();
    res.setHeader('Content-Type', 'image/png');
    res.setHeader(
      'Cache-Control',
      isResolved ? 'public, max-age=86400, s-maxage=604800' : 'public, max-age=3600'
    );
    return res.send(png);
  } catch (err) {
    console.error('Failed rendering name OG PNG:', err);
    return res.status(500).type('text/plain').send('Error generating image');
  }
});

// Backwards-compatible redirect from legacy /api/og-image SVG route to crawlable PNG route
app.get(['/api/og-image', '/api/og-image/:nameSlug'], (req, res) => {
  const rawSlug = safeDecodeURIComponent(req.params.nameSlug || '').trim();
  if (!rawSlug || !isValidNameInput(rawSlug).valid) {
    return res.redirect(301, '/og/default.png');
  }
  return res.redirect(301, `/og/${getNameSlug(rawSlug)}.png`);
});

// Read-only Directory API for SPA navigation (strictly curated, zero Gemini calls)
app.get('/api/directory', async (_req, res) => {
  try {
    const curated = getCuratedDirectoryNames();
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.json({ curated, extraCached: [] });
  } catch (err) {
    console.error('Failed loading directory API:', err);
    return res.status(500).json({ error: 'Failed to load directory' });
  }
});

// API endpoint to lookup cultural references for a name
app.post('/api/lookup', async (req, res) => {
  const { name } = req.body;
  const validation = isValidNameInput(name);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.reason || 'Invalid name parameter' });
  }

  const cleanName = formatDisplayName(name.trim().slice(0, 40));
  const lowerName = cleanName.toLowerCase();
  const normalizedName = normalizeText(cleanName);

  // 1. Check zero-cost caches FIRST (curated -> in-memory -> Firestore) before rate-limiting or calling Gemini
  const resolved = await resolveCachedOrCuratedName(cleanName);
  if (resolved.isResolved) {
    // Update search count asynchronously for Firestore cache hits (valid indexable names only)
    const db = getFirestoreDb();
    if (db && resolved.source === 'firestore_cache' && isIndexableName(cleanName)) {
      const cacheDocRef = doc(db, 'name_cache', normalizedName);
      setDoc(
        cacheDocRef,
        {
          name: cleanName,
          searchCount: increment(1),
          lastSearchedAt: new Date().toISOString(),
          schemaVersion: CURRENT_SCHEMA_VERSION,
        },
        { merge: true }
      ).catch(() => {});

      const popDocRef = doc(db, 'popular_names', normalizedName);
      setDoc(
        popDocRef,
        {
          name: cleanName,
          searchCount: increment(1),
          lastSearchedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {});
    }

    return res.json({
      ...resolved.data,
      source: resolved.source,
    });
  }

  // 2. Block cross-origin abuse and automated bots BEFORE spending Gemini API tokens
  if (!isAllowedApiOrigin(req)) {
    return res.status(403).json({ error: 'Cross-origin API request denied.' });
  }

  if (isAutomatedBot(req)) {
    return res.json({
      ...resolved.data,
      source: 'fallback',
      message: 'Automated client served from zero-cost archive.',
    });
  }

  // 3. IP Rate Limiting Check (per-minute + per-hour, only enforced on uncached Gemini requests)
  const clientIp = getClientIp(req);
  if (
    !checkRateLimit(ipLookupMinuteCounts, clientIp, MAX_LOOKUP_PER_MINUTE, MINUTE_WINDOW_MS) ||
    !checkRateLimit(ipLookupHourCounts, clientIp, MAX_LOOKUP_PER_HOUR, HOUR_WINDOW_MS)
  ) {
    return res.status(429).json({
      ...resolved.data,
      source: 'fallback',
      error: 'Rate limit exceeded. Please wait before making more live lookups.',
    });
  }

  // 4. In-flight request deduplication (prevents double-billing if two requests arrive simultaneously)
  const existingInFlight = inFlightLookups.get(normalizedName);
  if (existingInFlight) {
    try {
      const sharedResult = await existingInFlight;
      return res.json(sharedResult);
    } catch {
      return res.json({ ...resolved.data, source: 'fallback' });
    }
  }

  // 5. Global Daily Gemini Budget Circuit Breaker
  if (!canSpendGeminiCall()) {
    console.warn(`[Cost Guardrail] Daily Gemini lookup cap (${MAX_DAILY_GEMINI_CALLS}) reached. Returning fallback.`);
    return res.json({
      ...resolved.data,
      source: 'fallback',
      message: 'Daily live discovery limit reached; returning curated fallback.',
    });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      ...resolved.data,
      source: 'fallback',
      message: 'Gemini API key not configured, returning curated fallback dataset.',
    });
  }

  const lookupPromise = (async () => {
    try {
      const prompt = `Cultural historian for "The Page of You". Return strict JSON for the name "${cleanName}".

GOAL: Provide UP TO 2-3 widely known, commercially released, verifiable entries per category (books, songs, movies, games, art) ONLY where genuinely available.
VALID CONNECTIONS FOR "${cleanName}":
- Notable real-world characters, historical figures, authors, actors, or artists named "${cleanName}"
- Real, mainstream books, songs, films/TV, commercial video games, or recognized museum artworks explicitly featuring "${cleanName}" in title, lyrics, dialogue, lore, or creator.
STRICT ANTI-HALLUCINATION RULES:
- Real, commercially published, verifiable works ONLY. Never invent titles, studios, years, or quotes.
- CRITICAL: If you are NOT 100% certain of real, widely known works for a category, return an empty array [] for that category. Returning [] is strictly preferred over guessing, stretching, or inventing.
- NEVER invent obscure browser/Flash/casual portal games (e.g., CrazyGames, Poki, Big Fish Games, Miniclip) or self-published works.
- Never confuse "${cleanName}" with similar-sounding different names.
ETYMOLOGY & ACROSTIC:
- origin: concise, historically accurate linguistic roots (e.g. "Old French / Greek").
- meaning: concise, accurate meaning of "${cleanName}".
- adjectives: 5 fitting personality adjectives.
- acrostic: inspiring acrostic poem spelling "${cleanName}".`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          meaning: { type: Type.STRING },
          origin: { type: Type.STRING },
          adjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
          acrostic: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                letter: { type: Type.STRING },
                line: { type: Type.STRING },
              },
              required: ['letter', 'line'],
            },
          },
          books: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                author: { type: Type.STRING },
                year: { type: Type.STRING },
                quote: { type: Type.STRING },
                context: { type: Type.STRING },
              },
              required: ['title', 'author', 'quote'],
            },
          },
          songs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                artist: { type: Type.STRING },
                year: { type: Type.STRING },
                lyricsQuote: { type: Type.STRING },
                albumVibe: { type: Type.STRING },
              },
              required: ['title', 'artist', 'lyricsQuote'],
            },
          },
          movies: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                character: { type: Type.STRING },
                actor: { type: Type.STRING },
                year: { type: Type.STRING },
                quote: { type: Type.STRING },
              },
              required: ['title', 'quote'],
            },
          },
          games: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                character: { type: Type.STRING },
                developer: { type: Type.STRING },
                year: { type: Type.STRING },
                quote: { type: Type.STRING },
              },
              required: ['title', 'quote'],
            },
          },
          art: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                artist: { type: Type.STRING },
                year: { type: Type.STRING },
                medium: { type: Type.STRING },
                quote: { type: Type.STRING },
              },
              required: ['title', 'artist', 'quote'],
            },
          },
        },
        required: ['name', 'meaning', 'origin', 'books', 'songs', 'movies', 'games', 'art', 'acrostic'],
      };

      const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
      const modelsToTry = Array.from(new Set([primaryModel, 'gemini-3.1-flash-lite', 'gemini-2.5-flash']));

      let parsedData: any = null;
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        if (!canSpendGeminiCall()) break;
        let timeoutId: NodeJS.Timeout | null = null;
        try {
          recordGeminiCall();
          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(`Timeout requesting ${modelName}`)), 15000);
          });

          const apiPromise = ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              temperature: 0,
              responseMimeType: 'application/json',
              responseSchema,
              maxOutputTokens: 1800,
            },
          });

          const response: any = await Promise.race([apiPromise, timeoutPromise]);
          if (timeoutId) clearTimeout(timeoutId);

          if (response && response.text) {
            let rawText = response.text.trim();
            if (rawText.startsWith('```')) {
              rawText = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
            }
            parsedData = JSON.parse(rawText);
            break;
          }
        } catch (err: any) {
          if (timeoutId) clearTimeout(timeoutId);
          lastError = err;
          const msg = err?.message || String(err);
          const isTimeout = msg.startsWith('Timeout requesting');
          const isFallbackWorthy =
            msg.includes('429') ||
            msg.includes('503') ||
            msg.includes('quota') ||
            msg.includes('RESOURCE_EXHAUSTED') ||
            msg.includes('NOT_FOUND') ||
            msg.includes('UNAVAILABLE');
          console.warn(`Model ${modelName} issue: ${msg.slice(0, 120)}`);

          // Never double-bill a slower fallback model on client-side timeout where primary may still complete
          if (isTimeout || !isFallbackWorthy) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
        if (parsedData) break;
      }

      if (parsedData) {
        const ensureIdsAndVerify = async (arr: any[], category: VerifiableCategory) => {
          if (!Array.isArray(arr)) return [];
          const structurallyValid = arr.filter((item) => isValidCulturalItem(item, cleanName));
          const verified = await filterVerifiedCulturalItems(structurallyValid, category);
          return verified.map((item, idx) => ({
            ...item,
            id: item.id || `${normalizedName}-${category}-${idx + 1}-${Date.now().toString(36)}`,
          }));
        };

        const [books, songs, movies, games, art] = await Promise.all([
          ensureIdsAndVerify(parsedData.books, 'books'),
          ensureIdsAndVerify(parsedData.songs, 'songs'),
          ensureIdsAndVerify(parsedData.movies, 'movies'),
          ensureIdsAndVerify(parsedData.games, 'games'),
          ensureIdsAndVerify(parsedData.art, 'art'),
        ]);

        parsedData.name = cleanName;
        parsedData.books = books;
        parsedData.songs = songs;
        parsedData.movies = movies;
        parsedData.games = games;
        parsedData.art = art;

        // Cache in memory immediately to eliminate repeat API calls
        setInLookupCache(normalizedName, parsedData);
        if (lowerName !== normalizedName) setInLookupCache(lowerName, parsedData);

        // Persist in Firestore under canonical normalizedName key with schemaVersion: 4 (catalog-verified)
        const db = getFirestoreDb();
        if (db && isCachedDataValid(parsedData, cleanName)) {
          try {
            const cacheDocRef = doc(db, 'name_cache', normalizedName);
            setDoc(
              cacheDocRef,
              {
                name: cleanName,
                data: parsedData,
                searchCount: 1,
                lastSearchedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                schemaVersion: CURRENT_SCHEMA_VERSION,
              },
              { merge: true }
            ).catch((e) => console.warn('Firestore save name_cache error:', e));

            if (isIndexableName(cleanName)) {
              const popDocRef = doc(db, 'popular_names', normalizedName);
              setDoc(
                popDocRef,
                {
                  name: cleanName,
                  searchCount: increment(1),
                  lastSearchedAt: new Date().toISOString(),
                },
                { merge: true }
              ).catch((e) => console.warn('Firestore save popular_names error:', e));
            }
          } catch (e) {
            console.warn('Firestore write error:', e);
          }
        }

        return {
          ...parsedData,
          source: 'gemini',
        };
      }

      console.warn('Gemini lookup did not return data. Returning fallback.');
      return {
        ...resolved.data,
        source: 'fallback',
        error: lastError?.message || 'Model API unavailable',
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error fetching name data from Gemini:', errorMessage);
      return {
        ...resolved.data,
        source: 'fallback',
        error: errorMessage,
      };
    } finally {
      inFlightLookups.delete(normalizedName);
    }
  })();

  inFlightLookups.set(normalizedName, lookupPromise);
  const finalPayload = await lookupPromise;
  return res.json(finalPayload);
});

// Tier 2: On-Demand Cultural Reference Enrichment (now protected by IP rate limit, per-name cap, and daily budget)
app.post('/api/enrich-category', async (req, res) => {
  const { name, category, existingTitles = [] } = req.body;
  const validation = isValidNameInput(name);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.reason || 'Invalid name parameter', items: [] });
  }

  // Cap enrichment to prevent runaway token spend on a single name
  if (Array.isArray(existingTitles) && existingTitles.length >= 25) {
    return res.json({
      success: false,
      category: (category || 'all').toLowerCase(),
      items: [],
      message: 'Maximum curated references already loaded for this name.',
    });
  }

  // Block cross-origin abuse and automated bots from spending enrichment tokens
  if (!isAllowedApiOrigin(req)) {
    return res.status(403).json({ success: false, error: 'Cross-origin API request denied.', items: [] });
  }
  if (isAutomatedBot(req)) {
    return res.status(403).json({ success: false, error: 'Automated enrichment requests are not permitted.', items: [] });
  }

  // Enforce IP rate limit on /api/enrich-category
  const clientIp = getClientIp(req);
  if (!checkRateLimit(ipEnrichMinuteCounts, clientIp, MAX_ENRICH_PER_MINUTE, MINUTE_WINDOW_MS)) {
    return res.status(429).json({
      success: false,
      error: 'Too many enrichment requests. Please wait a minute and try again.',
      items: [],
    });
  }

  const cleanName = formatDisplayName(name.trim().slice(0, 40));
  const lowerName = cleanName.toLowerCase();
  const normalizedName = normalizeText(cleanName);
  const targetCategory = (category || 'all').toLowerCase();
  const enrichKey = `${normalizedName}:${targetCategory}`;

  // Deduplicate concurrent enrichment clicks for the same name & category
  const activeEnrich = inFlightEnrichments.get(enrichKey);
  if (activeEnrich) {
    const shared = await activeEnrich;
    return res.json(shared);
  }

  // Enforce global daily budget circuit breaker
  if (!canSpendGeminiCall()) {
    return res.status(503).json({
      success: false,
      error: 'Daily live discovery limit reached.',
      items: [],
    });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({ error: 'AI discovery engine not available', items: [] });
  }

  const existingTitlesList = Array.isArray(existingTitles) ? existingTitles.slice(0, 25).join(', ') : '';

  let categoryInstruction = '';
  let responseSchema: any = null;

  if (targetCategory === 'books') {
    categoryInstruction = `Find UP TO 2 additional widely known, commercially published books connecting to "${cleanName}" not in: [${existingTitlesList}].`;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        books: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              author: { type: Type.STRING },
              year: { type: Type.STRING },
              quote: { type: Type.STRING },
              context: { type: Type.STRING },
            },
            required: ['title', 'author', 'quote', 'context'],
          },
        },
      },
      required: ['books'],
    };
  } else if (targetCategory === 'songs') {
    categoryInstruction = `Find UP TO 2 additional widely known, commercially released songs mentioning or by "${cleanName}" not in: [${existingTitlesList}].`;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        songs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              year: { type: Type.STRING },
              lyricsQuote: { type: Type.STRING },
              albumVibe: { type: Type.STRING },
            },
            required: ['title', 'artist', 'lyricsQuote'],
          },
        },
      },
      required: ['songs'],
    };
  } else if (targetCategory === 'movies') {
    categoryInstruction = `Find UP TO 2 additional widely known, commercially released film/TV references for "${cleanName}" not in: [${existingTitlesList}].`;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        movies: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              character: { type: Type.STRING },
              actor: { type: Type.STRING },
              year: { type: Type.STRING },
              quote: { type: Type.STRING },
            },
            required: ['title', 'quote'],
          },
        },
      },
      required: ['movies'],
    };
  } else if (targetCategory === 'games') {
    categoryInstruction = `Find UP TO 2 additional widely known, commercially released PC/console video games connecting to "${cleanName}" not in: [${existingTitlesList}].`;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        games: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              character: { type: Type.STRING },
              developer: { type: Type.STRING },
              year: { type: Type.STRING },
              quote: { type: Type.STRING },
            },
            required: ['title', 'quote'],
          },
        },
      },
      required: ['games'],
    };
  } else if (targetCategory === 'art') {
    categoryInstruction = `Find UP TO 2 additional widely known, museum-recognized fine art works or artists for "${cleanName}" not in: [${existingTitlesList}].`;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        art: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              year: { type: Type.STRING },
              medium: { type: Type.STRING },
              quote: { type: Type.STRING },
            },
            required: ['title', 'artist', 'quote'],
          },
        },
      },
      required: ['art'],
    };
  } else {
    return res.status(400).json({ error: 'Invalid enrichment category', items: [] });
  }

  const prompt = `Cultural archivist for "The Page of You". For "${cleanName}": ${categoryInstruction}
STRICT ANTI-HALLUCINATION RULES:
- Real, mainstream, commercially released works ONLY. Never invent titles, developers, years, or quotes.
- CRITICAL: If you are NOT 100% certain of additional real, commercially published works not already listed, return an empty array []! Returning [] is strictly preferred over guessing or inventing.
- NEVER invent obscure browser/Flash/casual portal titles (e.g., CrazyGames, Poki, Big Fish Games, Miniclip) or unverifiable works.
- Must genuinely connect to "${cleanName}" (never similar-sounding different names).
- Do NOT repeat any title already listed in: [${existingTitlesList}].
- Always explicitly mention "${cleanName}" in the title, quote, lyricsQuote, character, or context field so the connection is clear.
- Return strict JSON.`;

  const existingTitleSet = new Set(
    (Array.isArray(existingTitles) ? existingTitles : [])
      .map((t: unknown) => String(t || '').trim().toLowerCase())
      .filter(Boolean)
  );

  const enrichPromise = (async () => {
    try {
      const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
      const modelsToTry = Array.from(new Set([primaryModel, 'gemini-3.1-flash-lite', 'gemini-2.5-flash']));
      let enrichedData: any = null;
      let lastModelError = '';

      for (const model of modelsToTry) {
        if (!canSpendGeminiCall()) break;
        let timeoutId: NodeJS.Timeout | null = null;
        try {
          recordGeminiCall();
          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(`Timeout enriching via ${model}`)), 12000);
          });
          const apiPromise = ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              temperature: 0,
              responseMimeType: 'application/json',
              responseSchema,
              maxOutputTokens: 900,
            },
          });
          const response: any = await Promise.race([apiPromise, timeoutPromise]);
          if (timeoutId) clearTimeout(timeoutId);

          if (response && response.text) {
            let text = response.text.trim();
            if (text.startsWith('```')) {
              text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
            }
            enrichedData = JSON.parse(text);
            if (enrichedData) break;
          }
        } catch (err: any) {
          if (timeoutId) clearTimeout(timeoutId);
          const msg = err?.message || String(err);
          lastModelError = msg;
          console.warn(`Enrichment attempt failed on ${model}: ${msg.slice(0, 120)}`);
          const isTimeout = msg.startsWith('Timeout enriching');
          const isFallbackWorthy =
            msg.includes('429') ||
            msg.includes('503') ||
            msg.includes('404') ||
            msg.includes('quota') ||
            msg.includes('RESOURCE_EXHAUSTED') ||
            msg.includes('NOT_FOUND') ||
            msg.includes('UNAVAILABLE');
          if (isTimeout || !isFallbackWorthy) break;
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
      }

      if (!enrichedData) {
        return {
          success: false,
          category: targetCategory,
          items: [],
          message: lastModelError.startsWith('Timeout enriching')
            ? 'Archive search timed out. Please try again in a moment.'
            : 'No additional verified references were found right now.',
        };
      }

      let addedCount = 0;
      const verifiableCategories: VerifiableCategory[] = ['books', 'songs', 'movies', 'games', 'art'];
      await Promise.all(
        verifiableCategories.map(async (cat) => {
          if (Array.isArray(enrichedData[cat])) {
            const seenNew = new Set<string>();
            const candidates = enrichedData[cat].filter((item: any) => {
              if (!isValidCulturalItem(item, cleanName)) return false;
              const titleKey = String(item?.title || '').trim().toLowerCase();
              if (!titleKey || existingTitleSet.has(titleKey) || seenNew.has(titleKey)) {
                return false;
              }
              seenNew.add(titleKey);
              return true;
            });

            // Fail-closed real-world catalog verification (drops any hallucinated title)
            const verifiedItems = await filterVerifiedCulturalItems(candidates, cat);

            enrichedData[cat] = verifiedItems.map((item: any, idx: number) => ({
              ...item,
              id: item.id || `${normalizedName}-${cat}-enriched-${idx + 1}-${Date.now().toString(36)}`,
            }));
            addedCount += enrichedData[cat].length;
          }
        })
      );

      if (addedCount === 0) {
        return {
          success: false,
          exhausted: true,
          category: targetCategory,
          items: [],
          message: 'All verified real-world references for this category are already loaded.',
        };
      }

      // Merge into in-memory cache (using curated base if not yet in lookupCache)
      const baseMem =
        lookupCache.get(normalizedName)?.data ||
        POPULAR_NAMES_DATA[lowerName] ||
        POPULAR_NAMES_DATA[normalizedName];
      if (baseMem) {
        const mergedMem = { ...baseMem };
        for (const cat of ['books', 'songs', 'movies', 'games', 'art']) {
          if (Array.isArray(enrichedData[cat]) && enrichedData[cat].length > 0) {
            mergedMem[cat] = [...(mergedMem[cat] || []), ...enrichedData[cat]];
          }
        }
        setInLookupCache(normalizedName, mergedMem);
        if (lowerName !== normalizedName) setInLookupCache(lowerName, mergedMem);
      }

      // Persist enriched results to Firestore even when enriching a static curated name (prevents repeat billing after restart)
      const db = getFirestoreDb();
      if (db) {
        try {
          const cacheDocRef = doc(db, 'name_cache', normalizedName);
          const docSnap = await getDoc(cacheDocRef);
          const baseDoc = docSnap.exists()
            ? docSnap.data()?.data
            : POPULAR_NAMES_DATA[lowerName] || POPULAR_NAMES_DATA[normalizedName] || null;
          if (baseDoc) {
            const merged = { ...baseDoc };
            for (const cat of ['books', 'songs', 'movies', 'games', 'art']) {
              if (Array.isArray(enrichedData[cat]) && enrichedData[cat].length > 0) {
                merged[cat] = [...(merged[cat] || []), ...enrichedData[cat]];
              }
            }
            await setDoc(
              cacheDocRef,
              {
                name: cleanName,
                data: merged,
                schemaVersion: CURRENT_SCHEMA_VERSION,
                lastSearchedAt: new Date().toISOString(),
                ...(docSnap.exists() ? {} : { createdAt: new Date().toISOString(), searchCount: 1 }),
              },
              { merge: true }
            );
            setInLookupCache(normalizedName, merged);
            if (lowerName !== normalizedName) setInLookupCache(lowerName, merged);
          }
        } catch (e) {
          console.warn('Failed merging enriched references in Firestore:', e);
        }
      }

      return {
        success: true,
        category: targetCategory,
        addedCount,
        data: enrichedData,
      };
    } catch (err: any) {
      console.error('Error during enrich-category API call:', err);
      return { success: false, error: 'Failed to discover additional cultural references', items: [] };
    } finally {
      inFlightEnrichments.delete(enrichKey);
    }
  })();

  inFlightEnrichments.set(enrichKey, enrichPromise);
  const enrichResult = await enrichPromise;
  return res.json(enrichResult);
});

// Warm in-memory cache only (does NOT overwrite Firestore searchCount or downgrade schemaVersion!)
function prewarmInMemoryCache() {
  for (const [key, nameData] of Object.entries(POPULAR_NAMES_DATA)) {
    const lower = key.toLowerCase();
    const norm = normalizeText(key);
    setInLookupCache(norm, nameData);
    if (norm !== lower) setInLookupCache(lower, nameData);
  }
  console.log(
    `[Cache Warmup] Pre-warmed in-memory cache with ${Object.keys(POPULAR_NAMES_DATA).length} curated entries.`
  );
}

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const indexHtmlPath = isProd
    ? path.join(process.cwd(), 'dist', 'index.html')
    : path.join(process.cwd(), 'index.html');

  let viteDevServer: any = null;
  if (!isProd) {
    viteDevServer = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
  }

  async function loadTemplateHtml(originalUrl: string): Promise<string> {
    let rawHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
    if (!isProd && viteDevServer) {
      rawHtml = await viteDevServer.transformIndexHtml(originalUrl, rawHtml);
    }
    return rawHtml;
  }

  // Canonical 301 redirect for any trailing slash on GET routes (e.g. /names/ -> /names, /name/eleanor/ -> /name/eleanor)
  app.use((req, res, next) => {
    if (req.method === 'GET' && req.path.length > 1 && req.path.endsWith('/')) {
      const stripped = req.path.replace(/\/+$/, '');
      const nameMatch = stripped.match(/^\/name\/([^/]+)$/i);
      if (nameMatch && nameMatch[1]) {
        const decoded = safeDecodeURIComponent(nameMatch[1]).trim();
        return res.redirect(301, decoded ? `/name/${getNameSlug(decoded)}` : '/names');
      }
      const query = req.originalUrl.slice(req.path.length);
      return res.redirect(301, `${stripped}${query}`);
    }
    return next();
  });

  // Canonical 301 Redirect: /?name=Eleanor -> /name/eleanor
  // Real SSR Homepage on /
  app.get('/', async (req, res, next) => {
    try {
      const queryName = typeof req.query.name === 'string' ? req.query.name.trim() : '';
      if (queryName && isValidNameInput(queryName).valid) {
        return res.redirect(301, `/name/${getNameSlug(queryName)}`);
      }

      const templateHtml = await loadTemplateHtml(req.originalUrl);
      const renderedHtml = renderHomeHtml(templateHtml);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.send(renderedHtml);
    } catch (err) {
      console.error('Error rendering homepage:', err);
      return next();
    }
  });

  // Real SSR Browse Curated Names A-Z Directory (/names)
  app.get('/names', async (req, res, next) => {
    try {
      const templateHtml = await loadTemplateHtml(req.originalUrl);
      const renderedHtml = renderDirectoryHtml(templateHtml);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
      return res.send(renderedHtml);
    } catch (err) {
      console.error('Error rendering directory page:', err);
      return next();
    }
  });

  // Real SSR Thematic Hubs: Books, Film & TV, Video Games, Fine Art
  const mediaHubRoutes: Array<{ path: string; category: 'books' | 'movies' | 'games' | 'art' }> = [
    { path: '/books', category: 'books' },
    { path: '/film-and-tv', category: 'movies' },
    { path: '/video-games', category: 'games' },
    { path: '/fine-art', category: 'art' },
  ];
  for (const hub of mediaHubRoutes) {
    app.get(hub.path, async (req, res, next) => {
      try {
        const templateHtml = await loadTemplateHtml(req.originalUrl);
        const renderedHtml = renderMediaHubHtml(templateHtml, hub.category);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
        return res.send(renderedHtml);
      } catch (err) {
        console.error(`Error rendering ${hub.category} hub page:`, err);
        return next();
      }
    });
  }

  // Real SSR Thematic Hub: Songs & Lyrics (/songs-with-names)
  app.get('/songs-with-names', async (req, res, next) => {
    try {
      const templateHtml = await loadTemplateHtml(req.originalUrl);
      const renderedHtml = renderSongsHubHtml(templateHtml);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
      return res.send(renderedHtml);
    } catch (err) {
      console.error('Error rendering songs hub page:', err);
      return next();
    }
  });

  // Real SSR Thematic Hub: Acrostic Name Poems (/acrostic-name-poems)
  app.get('/acrostic-name-poems', async (req, res, next) => {
    try {
      const templateHtml = await loadTemplateHtml(req.originalUrl);
      const renderedHtml = renderAcrosticHubHtml(templateHtml);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
      return res.send(renderedHtml);
    } catch (err) {
      console.error('Error rendering acrostic poems hub page:', err);
      return next();
    }
  });

  // Real SSR Individual Name Page (/name/:nameSlug)
  app.get('/name/:nameSlug', async (req, res, next) => {
    try {
      const rawParam = req.params.nameSlug;
      if (!rawParam || !rawParam.trim()) {
        return res.redirect(301, '/names');
      }

      const decodedName = safeDecodeURIComponent(rawParam).trim();
      if (!decodedName) {
        return res.redirect(301, '/names');
      }
      const canonicalSlug = getNameSlug(decodedName);

      // 301 redirect uppercase or unnormalized variants (e.g. /name/Eleanor -> /name/eleanor)
      if (req.path !== `/name/${canonicalSlug}`) {
        return res.redirect(301, `/name/${canonicalSlug}`);
      }

      const { data: nameData, isResolved } = await resolveCachedOrCuratedName(decodedName);
      const templateHtml = await loadTemplateHtml(req.originalUrl);
      const renderedHtml = renderNameHtml(templateHtml, nameData, decodedName, isResolved);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      if (isResolved) {
        // Short safe CDN cache so fresh Vite hashed bundles never break after redeploy
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
      } else {
        // Never cache uncached/fallback pages!
        res.setHeader('Cache-Control', 'no-store');
      }
      return res.send(renderedHtml);
    } catch (err) {
      console.error('Error rendering name page:', err);
      return next();
    }
  });

  if (!isProd && viteDevServer) {
    app.use(viteDevServer.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(
      express.static(distPath, {
        index: false, // Ensure '/' is handled by our SSR route above
        maxAge: '1y',
        immutable: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          } else {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );

    // Fallback for unknown routes: render homepage shell with 404 or SPA fallback
    app.get('*', async (req, res) => {
      try {
        const templateHtml = await loadTemplateHtml(req.originalUrl);
        res.status(404).setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.send(renderHomeHtml(templateHtml));
      } catch {
        res.status(404).sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  prewarmInMemoryCache();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
