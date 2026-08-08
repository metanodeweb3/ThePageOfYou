import { PersonNameData } from '../types';
import { POPULAR_NAMES_DATA } from '../data/names';

/**
 * Strips accents and diacritics from a string and normalizes to lowercase.
 * Example: "Chloë" -> "chloe", "José" -> "jose", "Renée" -> "renee"
 */
export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Calculates Levenshtein Distance between two strings for fuzzy matching.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Computes American Soundex code for phonetic matching.
 */
export function soundex(str: string): string {
  const s = normalizeText(str).replace(/[^a-z]/g, '');
  if (!s) return '';

  const firstLetter = s[0].toUpperCase();
  const mapping: Record<string, string> = {
    b: '1', f: '1', p: '1', v: '1',
    c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2',
    d: '3', t: '3',
    l: '4',
    m: '5', n: '5',
    r: '6',
  };

  let codes = firstLetter;
  let prevCode = mapping[s[0]] || '';

  for (let i = 1; i < s.length; i++) {
    const char = s[i];
    const code = mapping[char] || '';
    if (code && code !== prevCode) {
      codes += code;
      prevCode = code;
    } else if (!code && char !== 'h' && char !== 'w') {
      prevCode = '';
    }
  }

  return (codes + '000').slice(0, 4);
}

const COMMON_ALIASES: Record<string, string> = {
  nacho: 'nacho',
  ignacio: 'nacho',
  johnny: 'john',
  jon: 'john',
  jack: 'john',
  dali: 'dali',
  salvador: 'dali',
  'salvador dali': 'dali',
  beethoven: 'beethoven',
  'ludwig van beethoven': 'beethoven',
  ludwig: 'beethoven',
  batman: 'batman',
  'bruce wayne': 'batman',
  hawksmoor: 'hawksmoor',
  'nicholas hawksmoor': 'hawksmoor',
  tomato: 'tomato',
  mike: 'michael',
  mikey: 'michael',
  eleanora: 'eleanor',
  ellie: 'eleanor',
  sara: 'sarah',
  sallie: 'sarah',
  sally: 'sarah',
  danny: 'daniel',
  dan: 'daniel',
  ally: 'alice',
  ali: 'alice',
};

/**
 * Searches curated names using exact, alias, fuzzy Levenshtein, and Soundex matching.
 */
export function findFallbackName(query: string): PersonNameData {
  const clean = query.trim();
  const lower = clean.toLowerCase();
  const normalized = normalizeText(clean);

  if (!clean) {
    return generateDynamicNameData('Friend');
  }

  // 1. Exact or Direct Alias Match
  const aliasKey = COMMON_ALIASES[lower] || COMMON_ALIASES[normalized];
  if (aliasKey && POPULAR_NAMES_DATA[aliasKey]) {
    return {
      ...POPULAR_NAMES_DATA[aliasKey],
      name: clean,
    };
  }

  if (POPULAR_NAMES_DATA[normalized]) {
    return POPULAR_NAMES_DATA[normalized];
  }

  if (POPULAR_NAMES_DATA[lower]) {
    return POPULAR_NAMES_DATA[lower];
  }

  // 2. Substring & Root Match
  for (const [key, val] of Object.entries(POPULAR_NAMES_DATA)) {
    const keyNorm = normalizeText(key);
    if (normalized.includes(keyNorm) || keyNorm.includes(normalized)) {
      return {
        ...val,
        name: clean,
      };
    }
  }

  // 3. Fuzzy Levenshtein Distance Match (threshold: max 2 edits)
  let bestMatch: PersonNameData | null = null;
  let minDistance = Infinity;

  for (const [key, val] of Object.entries(POPULAR_NAMES_DATA)) {
    const keyNorm = normalizeText(key);
    const dist = levenshteinDistance(normalized, keyNorm);
    if (dist <= 2 && dist < minDistance) {
      minDistance = dist;
      bestMatch = val;
    }
  }

  if (bestMatch) {
    return {
      ...bestMatch,
      name: clean,
    };
  }

  // 4. Phonetic Soundex Match
  const targetSoundex = soundex(normalized);
  if (targetSoundex) {
    for (const [key, val] of Object.entries(POPULAR_NAMES_DATA)) {
      if (soundex(key) === targetSoundex) {
        return {
          ...val,
          name: clean,
        };
      }
    }
  }

  // 5. Dynamic fallback acrostic generation for unique name
  return generateDynamicNameData(clean);
}

/**
 * Dynamic acrostic poem & metadata generator for uncurated custom search terms.
 */
export function generateDynamicNameData(name: string): PersonNameData {
  const clean = name.trim();
  const normalized = normalizeText(clean);

  const acrostic: PersonNameData['acrostic'] = clean.split('').map((char, index) => {
    const uppercase = char.toUpperCase();
    const linesMap: Record<string, string[]> = {
      A: ['Always radiating warmth and creative vision', 'Artistic soul expressing pure authenticity', 'Authentic spirit inspiring everyone around'],
      B: ['Bold dreamer exploring uncharted waters', 'Brilliant mind lighting up dark corners', 'Brave heart carrying unshakeable optimism'],
      C: ['Compassionate listener bringing calm to chaos', 'Curious mind seeking wisdom in every page', 'Charming laughter that brightens every room'],
      D: ['Delightful grace in every thoughtful action', 'Determined spirit overcoming every hurdle', 'Deeply loyal friend who holds hearts safely'],
      E: ['Elegant presence carrying timeless style', 'Energetic enthusiasm turning days into adventures', 'Empathetic warmth creating genuine connections'],
      F: ['Free spirit dancing with boundless imagination', 'Fearless heart standing tall through storms', 'Friendly smile that makes strangers feel welcome'],
      G: ['Generous nature sharing boundless kindness', 'Gentle wisdom guiding every choice', 'Gracious host with a warm welcoming hearth'],
      H: ['Honest voice speaking truth with quiet beauty', 'Harmonious spirit bringing balance and joy', 'Heart of gold shining through life’s moments'],
      I: ['Inspiring leader guiding by gentle example', 'Insightful mind capturing life’s golden threads', 'Illuminating thoughts sparking sudden wonder'],
      J: ['Joyful energy catching fire in quiet rooms', 'Just and true in every friendship', 'Jubilant laugh that lingers like a sweet song'],
      K: ['Kindhearted companion always standing close', 'Keen observer of life’s hidden poetry', 'Knowledge seeker with a passionate heart'],
      L: ['Luminous presence spreading quiet joy', 'Lively humor adding sparkle to the mundane', 'Loving soul whose kindness knows no borders'],
      M: ['Magnetic charm drawing smiles wherever you walk', 'Mindful thinker cherishing life’s quiet wonders', 'Master of turning small moments into memories'],
      N: ['Noble character grounded in gentle strength', 'Nurturing heart building safe places for all'],
      O: ['Original thinker breaking ordinary boundaries', 'Openhearted friend embracing every perspective'],
      P: ['Poetic soul reflecting beauty in plain sight', 'Passionate advocate for truth and joy'],
      Q: ['Quiet strength that commands gentle respect', 'Quick-witted mind weaving delightful stories'],
      R: ['Resilient heart dancing through life’s rhythms', 'Radiant smile echoing like starlight'],
      S: ['Steadfast ally standing firm in every trial', 'Soulful poet listening to the wind’s song'],
      T: ['Thoughtful creator making magic out of simplicity', 'True-hearted dreamer walking with quiet pride'],
      U: ['Unwavering courage lighting up dark paths', 'Unique perspective illuminating fresh horizons'],
      V: ['Vibrant energy bringing color to gray skies', 'Visionary thinker dreaming beyond tomorrow'],
      W: ['Warm heart enveloping friends in comfort', 'Wise advisor offering gentle clarity'],
      X: ['Xenial warmth making every guest feel home'],
      Y: ['Youthful wonder keeping life perpetually fresh'],
      Z: ['Zeal for life radiating in every step'],
    };

    const options = linesMap[uppercase] || [`${uppercase}xemplary grace in every step you take`];
    const line = options[index % options.length];
    return { letter: uppercase, line };
  });

  return {
    name: clean,
    meaning: `Significance & Cultural Heritage of ${clean}`,
    origin: 'Universal Cultural Heritage',
    adjectives: ['Distinctive', 'Resonant', 'Universal'],
    acrostic,
    books: [],
    songs: [],
    movies: [],
    games: [],
    art: [],
  };
}
