import { Resvg } from '@resvg/resvg-js';
import { PersonNameData } from '../types';
import { escapeHtml, formatDisplayName, truncateClean } from '../utils/seo';

const pngCache = new Map<string, Buffer>();
const MAX_PNG_CACHE = 200;

function setPngCache(key: string, buf: Buffer) {
  if (pngCache.size >= MAX_PNG_CACHE) {
    const oldestKey = pngCache.keys().next().value;
    if (oldestKey) pngCache.delete(oldestKey);
  }
  pngCache.set(key, buf);
}

function buildDefaultOgSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
    <defs>
      <linearGradient id="bgG" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FAF9F6"/>
        <stop offset="50%" stop-color="#F5F3EE"/>
        <stop offset="100%" stop-color="#ECE7DF"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bgG)"/>
    <rect x="34" y="34" width="1132" height="562" rx="10" fill="none" stroke="#D97706" stroke-width="3" stroke-opacity="0.5"/>
    <rect x="46" y="46" width="1108" height="538" rx="6" fill="none" stroke="#78716C" stroke-width="1.2" stroke-opacity="0.35"/>

    <text x="600" y="128" text-anchor="middle" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="16" font-weight="bold" letter-spacing="4" fill="#B45309">NAME ETYMOLOGY • CULTURAL ARCHIVE • ACROSTIC POETRY</text>

    <rect x="170" y="168" width="860" height="126" rx="16" fill="#1C1917"/>
    <rect x="176" y="174" width="848" height="114" rx="12" fill="none" stroke="#D97706" stroke-width="1.6" stroke-opacity="0.8"/>
    <text x="600" y="250" text-anchor="middle" font-family="Liberation Serif, DejaVu Serif, Georgia, serif" font-size="64" font-weight="bold" fill="#FEF3C7">The Page of You</text>

    <text x="600" y="352" text-anchor="middle" font-family="Liberation Serif, DejaVu Serif, Georgia, serif" font-size="28" font-style="italic" fill="#292524">Discover the etymology, meaning, and story behind any name</text>

    <rect x="150" y="396" width="900" height="104" rx="14" fill="#FFFFFF" fill-opacity="0.82" stroke="#E7E5E4" stroke-width="1.5"/>
    <text x="600" y="438" text-anchor="middle" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="18" font-weight="bold" fill="#1C1917">Literature  •  Song Lyrics  •  Film &amp; TV  •  Video Games  •  Fine Art</text>
    <text x="600" y="472" text-anchor="middle" font-family="Liberation Serif, DejaVu Serif, Georgia, serif" font-size="19" font-style="italic" fill="#57534E">Plus a bespoke acrostic poem &amp; shareable keepsake card for every name</text>

    <text x="600" y="558" text-anchor="middle" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="15" font-weight="bold" letter-spacing="2.5" fill="#78716C">THEPAGEOFYOU.COM</text>
  </svg>`;
}

function buildNameOgSvg(displayName: string, nameData?: PersonNameData): string {
  const safeTitleName = escapeHtml(truncateClean(displayName.toUpperCase(), 26));
  const rawMeaning = nameData?.meaning || `Etymology, cultural heritage, and acrostic poem for ${displayName}`;
  const rawOrigin = nameData?.origin || 'Cultural Heritage';
  const safeMeaning = escapeHtml(truncateClean(rawMeaning, 78));
  const safeOrigin = escapeHtml(truncateClean(rawOrigin.toUpperCase(), 42));

  const acrostic = (nameData?.acrostic || []).slice(0, 4);
  const acrosticLinesSvg = acrostic
    .map((item, idx) => {
      const y = 362 + idx * 38;
      const safeLetter = escapeHtml((item.letter || '').slice(0, 2).toUpperCase());
      const safeLine = escapeHtml(truncateClean(item.line || '', 62));
      return `
        <g transform="translate(184, ${y})">
          <rect x="0" y="-20" width="28" height="28" rx="6" fill="#F59E0B" fill-opacity="0.2" stroke="#D97706" stroke-width="1.2" />
          <text x="14" y="0" text-anchor="middle" font-family="Liberation Serif, DejaVu Serif, Georgia, serif" font-weight="bold" font-size="16" fill="#B45309">${safeLetter}</text>
          <text x="42" y="0" font-family="Liberation Serif, DejaVu Serif, Georgia, serif" font-style="italic" font-size="18" fill="#292524">${safeLine}</text>
        </g>
      `;
    })
    .join('');

  const refCount = nameData
    ? (nameData.books?.length || 0) +
      (nameData.songs?.length || 0) +
      (nameData.movies?.length || 0) +
      (nameData.games?.length || 0) +
      (nameData.art?.length || 0)
    : 0;

  const footerText =
    refCount > 0
      ? 'THEPAGEOFYOU.COM  •  CULTURAL ARCHIVE &amp; ACROSTIC POEM'
      : 'DISCOVER YOUR NAME ETYMOLOGY  •  THEPAGEOFYOU.COM';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
    <defs>
      <linearGradient id="bgG" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FAF9F6"/>
        <stop offset="50%" stop-color="#F5F3EE"/>
        <stop offset="100%" stop-color="#ECE7DF"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bgG)"/>
    <rect x="34" y="34" width="1132" height="562" rx="10" fill="none" stroke="#D97706" stroke-width="3" stroke-opacity="0.5"/>
    <rect x="46" y="46" width="1108" height="538" rx="6" fill="none" stroke="#78716C" stroke-width="1.2" stroke-opacity="0.35"/>

    <text x="600" y="88" text-anchor="middle" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="14" font-weight="bold" letter-spacing="4" fill="#B45309">THE PAGE OF YOU  •  NAME ETYMOLOGY &amp; KEEPSAKE</text>

    <rect x="220" y="110" width="760" height="88" rx="14" fill="#1C1917"/>
    <rect x="225" y="115" width="750" height="78" rx="10" fill="none" stroke="#D97706" stroke-width="1.5"/>
    <text x="600" y="170" text-anchor="middle" font-family="Liberation Serif, DejaVu Serif, Georgia, serif" font-size="48" font-weight="bold" letter-spacing="2" fill="#FEF3C7">${safeTitleName}</text>

    <text x="600" y="232" text-anchor="middle" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="14" font-weight="bold" letter-spacing="2" fill="#78716C">ORIGIN: ${safeOrigin}</text>
    <text x="600" y="270" text-anchor="middle" font-family="Liberation Serif, DejaVu Serif, Georgia, serif" font-size="24" font-style="italic" fill="#1C1917">"${safeMeaning}"</text>

    <rect x="144" y="302" width="912" height="214" rx="14" fill="#FFFFFF" fill-opacity="0.82" stroke="#E7E5E4" stroke-width="1.5"/>
    <text x="184" y="330" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="12" font-weight="bold" letter-spacing="2.5" fill="#A8A29E">ACROSTIC VERSE PREVIEW</text>
    ${acrosticLinesSvg}

    <text x="600" y="560" text-anchor="middle" font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="13" font-weight="bold" letter-spacing="1.8" fill="#78716C">${footerText}</text>
  </svg>`;
}

/**
 * Renders a crisp 1200x630 PNG Open Graph preview image (supported by WhatsApp,
 * Facebook, X/Twitter, LinkedIn, iMessage, Discord, Slack, and Pinterest).
 */
export function renderOgImagePng(rawName?: string, nameData?: PersonNameData): Buffer {
  const displayName = rawName ? formatDisplayName(rawName) : '';
  const cacheKey = displayName
    ? `name:${displayName.toLowerCase()}:${nameData ? '1' : '0'}`
    : 'default';

  const cached = pngCache.get(cacheKey);
  if (cached) return cached;

  const svg = displayName ? buildNameOgSvg(displayName, nameData) : buildDefaultOgSvg();
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'Liberation Serif',
    },
  });

  const pngBuffer = Buffer.from(resvg.render().asPng());
  setPngCache(cacheKey, pngBuffer);
  return pngBuffer;
}
