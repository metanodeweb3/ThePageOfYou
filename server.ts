import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { generateDynamicNameData, POPULAR_NAMES_DATA } from './src/data/fallbackData';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

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

// API endpoint to lookup cultural references for a name
app.post('/api/lookup', async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name parameter is required' });
  }

  const cleanName = name.trim();
  const lowerName = cleanName.toLowerCase();

  // 1. Check curated static dataset first
  if (POPULAR_NAMES_DATA[lowerName]) {
    return res.json({
      ...POPULAR_NAMES_DATA[lowerName],
      source: 'curated',
    });
  }

  const ai = getGeminiClient();

  if (!ai) {
    return res.json({
      name: cleanName,
      source: 'fallback',
      message: 'Gemini API key not configured, returning curated fallback dataset if available.',
    });
  }

  try {
    const prompt = `You are an expert, meticulous cultural archivist for "The Page of You".
Find real, famous, historically accurate, and verifiable cultural references for the search query or subject "${cleanName}".

The search query "${cleanName}" can be a person's name, character, subject, or concept.

CRITICAL CATEGORY PRIORITIZATION RULES FOR "${cleanName}":

1. BOOKS / LITERATURE:
   - MUST prioritize famous, authentic QUOTES from books/literature that explicitly mention "${cleanName}" inside the text of the quote itself.
   - STRICT RULE: DO NOT include books merely because the author's first or last name is "${cleanName}" (e.g. do not return books by Michael Crichton or Stephen King unless the book text or quote explicitly mentions "${cleanName}").

2. SONGS & MUSIC:
   - MUST prioritize specific, famous song LYRICS that explicitly contain "${cleanName}" in the line of lyrics (e.g., songs like "Hey Jude", "Billie Jean", "Roxanne", "Sweet Caroline", "Come On Eileen", etc.).

3. MOVIES & CINEMA:
   - MUST prioritize famous, iconic movie QUOTES or spoken dialogue lines that explicitly mention or address "${cleanName}".

4. VIDEO GAMES:
   - MUST prioritize GAME TITLES or iconic character names that explicitly contain "${cleanName}" in the title of the game (e.g., "The Legend of Zelda", "Max Payne", "Alice: Madness Returns", "Super Mario Bros", "Tomb Raider").

5. FINE ART & ARCHITECTURE:
   - MUST prioritize TITLES and NAMES of famous pieces of art, paintings, sculptures, or architectural landmarks that explicitly contain "${cleanName}" in the title or main subject (e.g., "Mona Lisa", "The Birth of Venus", "David", "Judith Slaying Holofernes", "Saint Peter's Basilica").

CRITICAL QUANTITY & ACCURACY DIRECTIVES:
- TRUTH OVER QUANTITY: Absolutely DO NOT invent, hallucinate, or fabricate entries under any circumstances. Every single item MUST be a real, verifiable, published work, song, film, architectural creation, or game.
- EMPTY CATEGORIES ARE ALLOWED & EXPECTED: If a category (e.g. video games, songs, or movies) has FEW or ZERO genuine real-world references for "${cleanName}", return ONLY the genuine ones or an EMPTY ARRAY [].
- DO NOT invent fictional titles, fictional quotes, fictional character names, or fictional authors/artists to pad or fill out lists. It is FAR better to return 0 items for a category than a fake one.
- For architectural creators, historical figures, or landmarks like "${cleanName}" (e.g., Nicholas Hawksmoor, Christopher Wren, etc.), place real architectural works (e.g. Christ Church Spitalfields, St Mary Woolnoth, Castle Howard Mausoleum) under Fine Art & Architecture, and real literature, books, or films featuring them under Books / Movies.

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

    const modelsToTry = ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let parsedData = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout requesting ${modelName}`)), 20000)
        );

        const apiPromise = ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema,
            maxOutputTokens: 4096,
          },
        });

        const response: any = await Promise.race([apiPromise, timeoutPromise]);

        if (response && response.text) {
          parsedData = JSON.parse(response.text);
          break;
        }
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const shortMsg = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')
          ? 'Rate limit exceeded (429)'
          : msg.slice(0, 120);
        console.warn(`Model ${modelName} issue: ${shortMsg}`);
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

      return res.json({
        ...parsedData,
        source: 'gemini',
      });
    } else {
      console.warn('All Gemini models failed or rate-limited. Returning fallback data.');
      const lower = cleanName.toLowerCase();
      const fallbackData = POPULAR_NAMES_DATA[lower] || generateDynamicNameData(cleanName);
      return res.json({
        ...fallbackData,
        source: 'fallback',
        error: lastError?.message || 'Model API unavailable',
      });
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error fetching name data from Gemini:', errorMessage);
    const lower = cleanName.toLowerCase();
    const fallbackData = POPULAR_NAMES_DATA[lower] || generateDynamicNameData(cleanName);
    return res.json({
      ...fallbackData,
      source: 'fallback',
      error: errorMessage,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
