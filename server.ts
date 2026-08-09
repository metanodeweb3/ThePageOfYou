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

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(compression());
app.use(express.json());

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

// Initialize Gemini AI Client lazily or safely
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

// In-Memory Cache for Gemini Lookup Results (stores up to 24 hours, max 2000 items)
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

// In-Memory Rate Limiter per Client IP (max 10 requests per minute)
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

// Periodic cleanup of stale rate limiter IP records and expired cache entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const currentTime = Date.now();
  for (const [ip, data] of ipRequestCounts.entries()) {
    if (currentTime > data.resetTime) {
      ipRequestCounts.delete(ip);
    }
  }
  for (const [key, entry] of lookupCache.entries()) {
    if (currentTime - entry.timestamp > CACHE_TTL_MS) {
      lookupCache.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

// Direct route for robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /\n');
});

// API endpoint to lookup cultural references for a name
app.post('/api/lookup', async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name parameter is required' });
  }

  // Cap input length at 80 chars to prevent massive token waste or abuse
  const cleanName = name.trim().slice(0, 80);
  const lowerName = cleanName.toLowerCase();
  const normalizedName = normalizeText(cleanName);

  // 1. IP Rate Limiting Check
  const clientIp = ((req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const ipData = ipRequestCounts.get(clientIp);

  if (ipData) {
    if (now > ipData.resetTime) {
      ipRequestCounts.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    } else {
      ipData.count += 1;
      if (ipData.count > MAX_REQUESTS_PER_WINDOW) {
        if (lookupCache.has(lowerName) || lookupCache.has(normalizedName)) {
          const cached = lookupCache.get(lowerName) || lookupCache.get(normalizedName);
          return res.json({ ...cached!.data, source: 'cache' });
        }
        const fallbackData = findFallbackName(cleanName);
        return res.status(429).json({
          ...fallbackData,
          source: 'fallback',
          error: 'Rate limit exceeded. Please wait a minute before making more requests.',
        });
      }
    }
  } else {
    ipRequestCounts.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
  }

  // 2. Check in-memory lookup cache
  const cachedEntry = lookupCache.get(lowerName) || lookupCache.get(normalizedName);
  if (cachedEntry && (now - cachedEntry.timestamp < CACHE_TTL_MS)) {
    return res.json({
      ...cachedEntry.data,
      source: 'cache',
    });
  }

  // 3. Check curated static dataset next
  if (POPULAR_NAMES_DATA[lowerName]) {
    return res.json({
      ...POPULAR_NAMES_DATA[lowerName],
      source: 'curated',
    });
  }

  // 4. Check Firestore database cache (name_cache collection) for saved dynamic results
  const db = getFirestoreDb();
  if (db) {
    try {
      const cacheDocRef = doc(db, 'name_cache', lowerName);
      const docSnap = await getDoc(cacheDocRef);
      if (docSnap.exists()) {
        const firestoreData = docSnap.data();
        if (firestoreData && firestoreData.data) {
          // Increment search count asynchronously
          setDoc(cacheDocRef, {
            searchCount: increment(1),
            lastSearchedAt: new Date().toISOString(),
          }, { merge: true }).catch(() => {});

          const popDocRef = doc(db, 'popular_names', lowerName);
          setDoc(popDocRef, {
            name: cleanName,
            searchCount: increment(1),
            lastSearchedAt: new Date().toISOString(),
          }, { merge: true }).catch(() => {});

          // Save in server in-memory cache for ultra-fast subsequent hits
          setInLookupCache(lowerName, firestoreData.data);
          setInLookupCache(normalizedName, firestoreData.data);

          return res.json({
            ...firestoreData.data,
            source: 'firestore_cache',
          });
        }
      }
    } catch (err) {
      console.warn('Firestore cache read error:', err);
    }
  }

  const ai = getGeminiClient();

  if (!ai) {
    const fallbackData = findFallbackName(cleanName);
    return res.json({
      ...fallbackData,
      source: 'fallback',
      message: 'Gemini API key not configured, returning curated fallback dataset.',
    });
  }

  try {
    const prompt = `You are an expert, meticulous cultural archivist for "The Page of You".
Find real, famous, historically accurate, and verifiable cultural references for the search query or name "${cleanName}".

The search query "${cleanName}" can be a person's name, character, historical figure, subject, or concept.

Provide an extensive, comprehensive list of up to 10 verified items per category wherever authentic matches exist in world literature, music, cinema, gaming, fine art, and architecture.

CRITICAL CATEGORY PRIORITIZATION RULES FOR "${cleanName}":

1. BOOKS / LITERATURE (Provide up to 10 items):
   - MUST prioritize famous, authentic QUOTES from books/literature that explicitly mention "${cleanName}" inside the text of the quote itself or in the main character's name/title.
   - STRICT RULE: DO NOT include books merely because the author's first or last name is "${cleanName}" (e.g. do not return books by Michael Crichton or Stephen King unless the book text or quote explicitly mentions "${cleanName}").

2. SONGS & MUSIC (Provide up to 10 items):
   - MUST prioritize specific, famous song LYRICS or song TITLES that explicitly contain "${cleanName}" in the lyrics or title (e.g., "Hey Jude", "Billie Jean", "Roxanne", "Sweet Caroline", "Come On Eileen", "Michael", etc.).

3. MOVIES & CINEMA (Provide up to 10 items):
   - MUST prioritize famous, iconic movie QUOTES or spoken dialogue lines or lead character names that explicitly mention or address "${cleanName}".

4. VIDEO GAMES (Provide up to 10 items):
   - MUST prioritize GAME TITLES or iconic character names that explicitly contain "${cleanName}" in the title, main character, or lore (e.g., "The Legend of Zelda", "Max Payne", "Alice: Madness Returns", "Super Mario Bros", "Tomb Raider").

5. FINE ART & ARCHITECTURE (Provide up to 10 items):
   - MUST prioritize TITLES and NAMES of famous pieces of art, paintings, sculptures, or architectural landmarks/creations that explicitly contain "${cleanName}" in the title or main subject/creator (e.g., "Mona Lisa", "The Birth of Venus", "David", "Judith Slaying Holofernes", "Saint Peter's Basilica", or architectural works by Nicholas Hawksmoor / Christopher Wren / Frank Lloyd Wright if applicable).

6. ETYMOLOGY, MEANING, ADJECTIVES & ACROSTIC:
   - Origin: Provide a thorough, fascinating, and accurate historical and linguistic origin narrative (2-3 detailed sentences).
   - Meaning: Expressive, poetic summary of the name's meaning.
   - Adjectives: Exactly 5 inspiring, vivid personality adjectives that embody the spirit and essence of the name.
   - Acrostic: An acrostic poem where each letter of "${cleanName}" starts an inspiring line.

CRITICAL ACCURACY DIRECTIVES:
- TRUTH OVER QUANTITY: Absolutely DO NOT invent, hallucinate, or fabricate entries under any circumstances. Every single item MUST be a real, verifiable, published work, song, film, architectural creation, or game.
- DO NOT invent fictional titles, fictional quotes, fictional character names, or fictional authors/artists to pad or fill out lists.

Return strict JSON adhering to the specified schema.`;

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
      required: ['name', 'meaning', 'books', 'songs', 'movies', 'games', 'art', 'acrostic'],
    };

    const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const modelsToTry = Array.from(new Set([
      primaryModel,
      'gemini-3.6-flash',
      'gemini-3.1-flash-lite',
    ]));

    let parsedData = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      let timeoutId: NodeJS.Timeout | null = null;
      try {
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error(`Timeout requesting ${modelName}`)), 8000);
        });

        const apiPromise = ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema,
            maxOutputTokens: 3000,
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
        const isRateLimit = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
        const shortMsg = isRateLimit
          ? 'Rate limit exceeded (429)'
          : msg.slice(0, 120);
        console.warn(`Model ${modelName} issue: ${shortMsg}`);

        // If rate limited, pause briefly before trying the next model
        if (isRateLimit) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      if (parsedData) break;
    }

    if (parsedData) {
      // Sanitize response to remove any placeholder strings
      const sanitizeList = (arr: any[]) => {
        if (!Array.isArray(arr)) return [];
        return arr.filter(item => {
          const text = JSON.stringify(item).toLowerCase();
          return !text.includes('cultural archive') &&
                 !text.includes('global musical ensemble') &&
                 !text.includes('master ensemble cast') &&
                 !text.includes('interactive media studios') &&
                 !text.includes('master fine artists');
        });
      };
      parsedData.books = sanitizeList(parsedData.books);
      parsedData.songs = sanitizeList(parsedData.songs);
      parsedData.movies = sanitizeList(parsedData.movies);
      parsedData.games = sanitizeList(parsedData.games);
      parsedData.art = sanitizeList(parsedData.art);

      // Save to memory cache to eliminate future duplicate API calls
      setInLookupCache(lowerName, parsedData);
      setInLookupCache(normalizedName, parsedData);

      // Save to Firestore name_cache and popular_names asynchronously for global database persistence
      if (db) {
        try {
          const cacheDocRef = doc(db, 'name_cache', normalizedName);
          setDoc(cacheDocRef, {
            name: cleanName,
            data: parsedData,
            searchCount: 1,
            lastSearchedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            schemaVersion: 2,
          }, { merge: true }).catch(e => console.warn('Firestore save name_cache error:', e));

          const popDocRef = doc(db, 'popular_names', normalizedName);
          setDoc(popDocRef, {
            name: cleanName,
            searchCount: increment(1),
            lastSearchedAt: new Date().toISOString(),
          }, { merge: true }).catch(e => console.warn('Firestore save popular_names error:', e));
        } catch (e) {
          console.warn('Firestore write error:', e);
        }
      }

      return res.json({
        ...parsedData,
        source: 'gemini',
      });
    } else {
      console.warn('All Gemini models failed or rate-limited. Returning fallback data.');
      const fallbackData = findFallbackName(cleanName);
      return res.json({
        ...fallbackData,
        source: 'fallback',
        error: lastError?.message || 'Model API unavailable',
      });
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error fetching name data from Gemini:', errorMessage);
    const fallbackData = findFallbackName(cleanName);
    return res.json({
      ...fallbackData,
      source: 'fallback',
      error: errorMessage,
    });
  }
});

async function prewarmCache() {
  try {
    // 1. Warm in-memory cache with curated popular names
    for (const [key, nameData] of Object.entries(POPULAR_NAMES_DATA)) {
      const lower = key.toLowerCase();
      const norm = normalizeText(key);
      setInLookupCache(lower, nameData);
      if (norm !== lower) {
        setInLookupCache(norm, nameData);
      }
    }

    // 2. Warm Firestore name_cache for popular curated names
    const db = getFirestoreDb();
    if (db) {
      for (const [key, nameData] of Object.entries(POPULAR_NAMES_DATA)) {
        const normKey = normalizeText(key);
        const cacheDocRef = doc(db, 'name_cache', normKey);
        setDoc(cacheDocRef, {
          name: nameData.name,
          data: nameData,
          searchCount: 1,
          lastSearchedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          schemaVersion: 2,
        }, { merge: true }).catch(() => {});
      }
    }
    console.log(`[Cache Warmup] Successfully pre-warmed cache with ${Object.keys(POPULAR_NAMES_DATA).length} popular name entries.`);
  } catch (err) {
    console.warn('[Cache Warmup] Cache pre-warming warning:', err);
  }
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1y',
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
        }
      },
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Pre-warm cache for popular names on server boot
  prewarmCache().catch((err) => console.warn('Prewarm failed:', err));

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
