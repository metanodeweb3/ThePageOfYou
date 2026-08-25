interface AmazonRegionConfig {
  domain: string;
  tag: string;
  countryName: string;
}

const REGIONAL_STORES: Record<string, AmazonRegionConfig> = {
  UK: { domain: 'amazon.co.uk', tag: 'metanode-21', countryName: 'United Kingdom' },
  US: { domain: 'amazon.com', tag: 'metanode-20', countryName: 'United States' },
  DE: { domain: 'amazon.de', tag: 'metanode0f-21', countryName: 'Germany' },
  FR: { domain: 'amazon.fr', tag: 'metanode09-21', countryName: 'France' },
  ES: { domain: 'amazon.es', tag: 'metanode0b-21', countryName: 'Spain' },
  IT: { domain: 'amazon.it', tag: 'metanode0c-21', countryName: 'Italy' },
  AU: { domain: 'amazon.com.au', tag: 'metanode0b-22', countryName: 'Australia' },
  JP: { domain: 'amazon.co.jp', tag: 'metanode-22', countryName: 'Japan' },
  SG: { domain: 'amazon.sg', tag: 'metanode0a-22', countryName: 'Singapore' },
};

/**
 * Detects visitor region using client-side timezone and browser language.
 * No external API calls or network requests needed.
 */
export function getVisitorAmazonStore(): AmazonRegionConfig {
  try {
    if (typeof window === 'undefined') {
      return REGIONAL_STORES.UK;
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lang = (navigator.language || (navigator.languages && navigator.languages[0]) || '').toLowerCase();

    // 1. Check by Timezone (most accurate indicator of current physical geography)
    if (
      timeZone === 'Europe/London' ||
      timeZone === 'Europe/Belfast' ||
      timeZone === 'Europe/Guernsey' ||
      timeZone === 'Europe/Jersey' ||
      timeZone === 'Europe/Isle_of_Man' ||
      timeZone === 'GB'
    ) {
      return REGIONAL_STORES.UK;
    }

    if (timeZone.startsWith('Australia/')) {
      return REGIONAL_STORES.AU;
    }

    if (timeZone === 'Asia/Tokyo') {
      return REGIONAL_STORES.JP;
    }

    if (timeZone === 'Asia/Singapore') {
      return REGIONAL_STORES.SG;
    }

    if (timeZone === 'Europe/Berlin' || timeZone === 'Europe/Vienna' || timeZone === 'Europe/Zurich') {
      return REGIONAL_STORES.DE;
    }

    if (timeZone === 'Europe/Paris' || timeZone === 'Europe/Brussels' || timeZone === 'Europe/Luxembourg') {
      return REGIONAL_STORES.FR;
    }

    if (timeZone === 'Europe/Madrid' || timeZone === 'Atlantic/Canary') {
      return REGIONAL_STORES.ES;
    }

    if (timeZone === 'Europe/Rome' || timeZone === 'Europe/Vatican' || timeZone === 'Europe/San_Marino') {
      return REGIONAL_STORES.IT;
    }

    if (
      timeZone.startsWith('America/New_York') ||
      timeZone.startsWith('America/Chicago') ||
      timeZone.startsWith('America/Denver') ||
      timeZone.startsWith('America/Los_Angeles') ||
      timeZone.startsWith('America/Phoenix') ||
      timeZone.startsWith('America/Anchorage') ||
      timeZone.startsWith('America/Detroit') ||
      timeZone.startsWith('America/Indiana') ||
      timeZone.startsWith('America/Boise') ||
      timeZone.startsWith('Pacific/Honolulu') ||
      timeZone === 'US/Eastern' ||
      timeZone === 'US/Central' ||
      timeZone === 'US/Mountain' ||
      timeZone === 'US/Pacific'
    ) {
      return REGIONAL_STORES.US;
    }

    // 2. Secondary check by browser language locale
    if (lang === 'en-gb' || lang.endsWith('-gb')) {
      return REGIONAL_STORES.UK;
    }
    if (lang === 'en-au' || lang.endsWith('-au')) {
      return REGIONAL_STORES.AU;
    }
    if (lang.startsWith('ja')) {
      return REGIONAL_STORES.JP;
    }
    if (lang === 'en-sg' || lang.endsWith('-sg')) {
      return REGIONAL_STORES.SG;
    }
    if (lang.startsWith('de')) {
      return REGIONAL_STORES.DE;
    }
    if (lang.startsWith('fr')) {
      return REGIONAL_STORES.FR;
    }
    if (lang.startsWith('es')) {
      return REGIONAL_STORES.ES;
    }
    if (lang.startsWith('it')) {
      return REGIONAL_STORES.IT;
    }
    if (lang === 'en-us' || lang.endsWith('-us')) {
      return REGIONAL_STORES.US;
    }

    // Fallback: Default to US for general international traffic or UK if British locale detected
    return REGIONAL_STORES.US;
  } catch {
    return REGIONAL_STORES.UK;
  }
}

function buildAmazonSearchUrl(query: string, searchIndex?: string): string {
  const store = getVisitorAmazonStore();
  const indexParam = searchIndex ? `&i=${encodeURIComponent(searchIndex)}` : '';
  return `https://www.${store.domain}/s?k=${encodeURIComponent(query)}&tag=${store.tag}${indexParam}`;
}

export function getAmazonBookUrl(title: string, author?: string): string {
  const query = `${title} ${author || ''} book`.trim();
  return buildAmazonSearchUrl(query, 'stripbooks');
}

export function getAmazonMusicUrl(title: string, artist?: string): string {
  const query = `${title} ${artist || ''} song mp3`.trim();
  return buildAmazonSearchUrl(query, 'digital-music');
}

export function getAmazonMovieUrl(title: string): string {
  const query = `${title} movie prime video`.trim();
  return buildAmazonSearchUrl(query, 'instant-video');
}

export function getAmazonGameUrl(title: string): string {
  const query = `${title} video game`.trim();
  return buildAmazonSearchUrl(query, 'videogames');
}

export function getAmazonArtUrl(title: string, artist?: string): string {
  const query = `${title} ${artist || ''} art print book`.trim();
  return buildAmazonSearchUrl(query, 'arts-crafts');
}

