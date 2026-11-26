import { PersonNameData } from '../types';
import {
  SITE_NAME,
  SITE_URL,
  PageSeoMeta,
  buildAcrosticHubSeo,
  buildDirectorySeo,
  buildHomeSeo,
  buildNameSeo,
  buildSongsHubSeo,
  escapeHtml,
  formatDisplayName,
  getCuratedAcrosticsIndex,
  getCuratedDirectoryNames,
  getCuratedSongsIndex,
  getNameSlug,
  getRelatedNames,
  stripOuterQuotes,
} from '../utils/seo';
import { getAmazonMusicUrl } from '../utils/amazon';

function applySeoHead(templateHtml: string, meta: PageSeoMeta, jsonLd: Record<string, any>): string {
  const safeTitle = escapeHtml(meta.title);
  const safeDesc = escapeHtml(meta.description);
  const safeCanonical = escapeHtml(meta.canonical);
  const safeOgImage = escapeHtml(meta.ogImage);
  const safeOgAlt = escapeHtml(meta.ogImageAlt);
  const safeRobots = escapeHtml(meta.robots);

  let html = templateHtml;

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);
  html = html.replace(
    /<meta\s+name="description"[\s\S]*?\/?>/i,
    `<meta name="description" content="${safeDesc}" />`
  );
  html = html.replace(
    /<meta\s+name="robots"[\s\S]*?\/?>/i,
    `<meta name="robots" content="${safeRobots}" />`
  );
  html = html.replace(
    /<link\s+rel="canonical"[\s\S]*?\/?>/i,
    `<link rel="canonical" href="${safeCanonical}" />`
  );

  html = html.replace(
    /<meta\s+property="og:url"[\s\S]*?\/?>/i,
    `<meta property="og:url" content="${safeCanonical}" />`
  );
  html = html.replace(
    /<meta\s+property="og:title"[\s\S]*?\/?>/i,
    `<meta property="og:title" content="${safeTitle}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"[\s\S]*?\/?>/i,
    `<meta property="og:description" content="${safeDesc}" />`
  );
  html = html.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${safeOgImage}" />`
  );
  html = html.replace(
    /<meta\s+property="og:image:type"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image:type" content="image/png" />`
  );
  html = html.replace(
    /<meta\s+property="og:image:alt"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image:alt" content="${safeOgAlt}" />`
  );

  html = html.replace(
    /<meta\s+name="twitter:title"[\s\S]*?\/?>/i,
    `<meta name="twitter:title" content="${safeTitle}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"[\s\S]*?\/?>/i,
    `<meta name="twitter:description" content="${safeDesc}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${safeOgImage}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:image:alt"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image:alt" content="${safeOgAlt}" />`
  );

  // Replace the single JSON-LD script block cleanly (no duplicate schemas)
  const serializedSchema = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
  const jsonLdTag = `<script type="application/ld+json" id="seo-json-ld">${serializedSchema}</script>`;
  if (/<script[^>]*id="seo-json-ld"[^>]*>[\s\S]*?<\/script>/i.test(html)) {
    html = html.replace(/<script[^>]*id="seo-json-ld"[^>]*>[\s\S]*?<\/script>/i, jsonLdTag);
  } else {
    html = html.replace('</head>', `${jsonLdTag}\n</head>`);
  }

  return html;
}

/**
 * Renders full semantic SSR HTML for the Homepage (/) directly inside <div id="root">.
 * Gives crawlers real headings, topical copy, and internal <a href="/name/..."> links immediately.
 */
export function renderHomeHtml(templateHtml: string): string {
  const meta = buildHomeSeo();
  const curatedNames = getCuratedDirectoryNames();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        description: meta.description,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/name/{search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: meta.ogImage,
      },
      {
        '@type': 'WebApplication',
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        description: meta.description,
        applicationCategory: 'ReferenceApplication',
        operatingSystem: 'All',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'GBP',
        },
      },
    ],
  };

  const featuredLinksHtml = curatedNames
    .map(
      (entry) => `
      <article style="background:#ffffff;border:1px solid #e7e5e4;border-radius:14px;padding:16px;">
        <h3 style="margin:0 0 4px 0;font-size:19px;">
          <a href="/name/${escapeHtml(entry.slug)}" style="color:#1c1917;text-decoration:none;font-weight:700;">${escapeHtml(entry.name)}</a>
        </h3>
        <p style="margin:0 0 6px 0;font-size:13px;color:#b45309;font-weight:600;">${escapeHtml(entry.origin)}</p>
        <p style="margin:0 0 8px 0;font-size:14px;color:#44403c;font-style:italic;">&ldquo;${escapeHtml(entry.meaning)}&rdquo;</p>
        <a href="/name/${escapeHtml(entry.slug)}" style="font-size:13px;color:#92400e;text-decoration:underline;">Explore ${escapeHtml(entry.name)}&rsquo;s etymology, cultural references &amp; acrostic poem &rarr;</a>
      </article>`
    )
    .join('');

  const ssrBody = `
    <div style="font-family:Georgia,serif;color:#1c1917;background:#faf8f5;min-height:100vh;">
      <header style="border-bottom:1px solid #e7e5e4;padding:20px 16px;text-align:center;background:#fbf9f5;">
        <a href="/" style="font-size:36px;color:#1c1917;text-decoration:none;font-weight:700;">The Page of You</a>
        <p style="margin:6px 0 0 0;font-size:13px;color:#57534e;font-style:italic;">Personalised Name Etymology, Acrostic Poetry &amp; Cultural Archive</p>
        <nav aria-label="Primary" style="margin-top:12px;">
          <a href="/" style="margin:0 10px;color:#1c1917;font-size:14px;">Home</a>
          <a href="/names" style="margin:0 10px;color:#92400e;font-size:14px;font-weight:600;">Browse Names A&ndash;Z</a>
          <a href="/songs-with-names" style="margin:0 10px;color:#065f46;font-size:14px;font-weight:600;">Songs With Names</a>
          <a href="/acrostic-name-poems" style="margin:0 10px;color:#78350f;font-size:14px;font-weight:600;">Acrostic Poems</a>
        </nav>
      </header>
      <main style="max-width:960px;margin:0 auto;padding:32px 16px;">
        <section style="text-align:center;margin-bottom:36px;">
          <h1 style="font-size:34px;line-height:1.2;margin:0 0 12px 0;">Discover the Etymology &amp; Cultural Story Behind Any Name</h1>
          <p style="font-size:16px;color:#57534e;max-width:680px;margin:0 auto 20px auto;line-height:1.6;">
            Search any name to uncover its linguistic etymology and origin, verified references across literature, song lyrics, cinema, video games, and fine art, plus a custom acrostic poem and shareable keepsake card.
          </p>
        </section>
        <section aria-labelledby="featured-names-heading">
          <h2 id="featured-names-heading" style="font-size:24px;margin:0 0 16px 0;">Featured Curated Name Archives</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;">
            ${featuredLinksHtml}
          </div>
          <p style="margin-top:24px;text-align:center;">
            <a href="/names" style="color:#92400e;font-weight:700;text-decoration:underline;">Browse the Complete A&ndash;Z Name Etymology Directory &rarr;</a>
          </p>
        </section>
      </main>
      <footer style="border-top:1px solid #e7e5e4;background:#1c1917;color:#d6d3d1;padding:28px 16px;text-align:center;font-size:13px;">
        <p>&copy; ${new Date().getFullYear()} The Page of You &mdash; Name Etymology, Acrostic Poetry &amp; Cultural Archive</p>
      </footer>
    </div>`;

  let html = applySeoHead(templateHtml, meta, jsonLd);
  html = html.replace('<div id="root"></div>', `<div id="root">${ssrBody}</div>`);
  return html;
}

/**
 * Renders full semantic SSR HTML for the Browse Names A–Z Directory (/names).
 */
export function renderDirectoryHtml(templateHtml: string, extraNames: string[] = []): string {
  const meta = buildDirectorySeo();
  const curated = getCuratedDirectoryNames();
  const seen = new Set(curated.map((c) => c.slug));

  const combined = [
    ...curated,
    ...extraNames
      .filter((name) => {
        const slug = name.trim().toLowerCase();
        if (!slug || seen.has(slug)) return false;
        seen.add(slug);
        return true;
      })
      .map((name) => ({
        slug: name.trim().toLowerCase(),
        name: formatDisplayName(name),
        meaning: 'Etymology, cultural references & custom acrostic poem',
        origin: 'Archived Name',
        referenceCount: 0,
      })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: `${SITE_URL}/`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Browse Names', item: `${SITE_URL}/names` },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: 'Name Etymology & Cultural Archive Directory',
        url: `${SITE_URL}/names`,
        description: meta.description,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: combined.length,
          itemListElement: combined.slice(0, 100).map((entry, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: entry.name,
            url: `${SITE_URL}/name/${getNameSlug(entry.name)}`,
          })),
        },
      },
    ],
  };

  const listItemsHtml = combined
    .map(
      (entry) => `
      <li style="background:#ffffff;border:1px solid #e7e5e4;border-radius:12px;padding:14px;">
        <a href="/name/${escapeHtml(getNameSlug(entry.name))}" style="font-size:18px;font-weight:700;color:#1c1917;text-decoration:none;">${escapeHtml(entry.name)}</a>
        <div style="font-size:12px;color:#b45309;margin-top:2px;">${escapeHtml(entry.origin)}</div>
        <p style="font-size:13px;color:#57534e;margin:6px 0 0 0;">${escapeHtml(entry.meaning)}</p>
      </li>`
    )
    .join('');

  const ssrBody = `
    <div style="font-family:Georgia,serif;color:#1c1917;background:#faf8f5;min-height:100vh;">
      <header style="border-bottom:1px solid #e7e5e4;padding:20px 16px;text-align:center;background:#fbf9f5;">
        <a href="/" style="font-size:36px;color:#1c1917;text-decoration:none;font-weight:700;">The Page of You</a>
        <nav aria-label="Primary" style="margin-top:10px;">
          <a href="/" style="margin:0 10px;color:#1c1917;font-size:14px;">Home</a>
          <a href="/names" style="margin:0 10px;color:#92400e;font-size:14px;font-weight:600;">Browse Names A&ndash;Z</a>
          <a href="/songs-with-names" style="margin:0 10px;color:#065f46;font-size:14px;font-weight:600;">Songs With Names</a>
          <a href="/acrostic-name-poems" style="margin:0 10px;color:#78350f;font-size:14px;font-weight:600;">Acrostic Poems</a>
        </nav>
      </header>
      <main style="max-width:960px;margin:0 auto;padding:32px 16px;">
        <nav aria-label="Breadcrumb" style="font-size:13px;color:#78716c;margin-bottom:16px;">
          <a href="/" style="color:#92400e;">Home</a> &rsaquo; <span>Browse Names</span>
        </nav>
        <h1 style="font-size:32px;margin:0 0 10px 0;">Name Etymology &amp; Cultural Archive Directory</h1>
        <p style="font-size:15px;color:#57534e;margin:0 0 24px 0;line-height:1.6;">
          Explore every curated name in The Page of You archive. Select any name to view its linguistic etymology, origin, bespoke acrostic poem, and verified references in literature, music, film, video games, and fine art.
        </p>
        <ul style="list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;">
          ${listItemsHtml}
        </ul>
      </main>
    </div>`;

  let html = applySeoHead(templateHtml, meta, jsonLd);
  html = html.replace('<div id="root"></div>', `<div id="root">${ssrBody}</div>`);
  return html;
}

/**
 * Renders full semantic SSR HTML for individual name pages (/name/:slug) directly inside <div id="root">.
 * Fixes the legacy <noscript> bug, fixes songs.lyricsQuote ("undefined" bug), escapes all output (XSS fix),
 * adds related internal links, and avoids locking uncached pages into empty preloaded fallbacks.
 */
export function renderNameHtml(
  templateHtml: string,
  nameData: PersonNameData,
  rawName: string,
  isResolved: boolean
): string {
  const displayName = formatDisplayName(nameData?.name || rawName);
  const meta = buildNameSeo(nameData, displayName, isResolved);
  const acrosticLines = Array.isArray(nameData.acrostic) ? nameData.acrostic : [];
  const acrosticFormatted = acrosticLines.map((a) => `${a.letter}: ${a.line}`).join('. ');

  const books = Array.isArray(nameData.books) ? nameData.books : [];
  const songs = Array.isArray(nameData.songs) ? nameData.songs : [];
  const movies = Array.isArray(nameData.movies) ? nameData.movies : [];
  const games = Array.isArray(nameData.games) ? nameData.games : [];
  const art = Array.isArray(nameData.art) ? nameData.art : [];
  const adjectives = Array.isArray(nameData.adjectives) ? nameData.adjectives : [];
  const related = getRelatedNames(displayName, nameData.origin, 6);

  const faqOriginAnswer = `The name ${displayName} has ${nameData.origin || 'historical linguistic'} origins and means "${nameData.meaning || 'cherished and distinctive'}".`;
  const faqAcrosticAnswer =
    acrosticFormatted || `A bespoke acrostic poem celebrating the letters and spirit of ${displayName}.`;
  const faqCultureCount = books.length + songs.length + movies.length + games.length + art.length;
  const faqCultureAnswer =
    faqCultureCount > 0
      ? `The Page of You archives verified cultural references for ${displayName} across literature, song lyrics, cinema, video games, and fine art — with additional entries discoverable on demand.`
      : `Use the search bar above or category discovery buttons to uncover literary, musical, and cinematic mentions of ${displayName}.`;

  const graph: Record<string, any>[] = [
    {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: `${SITE_URL}/`,
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Browse Names', item: `${SITE_URL}/names` },
        { '@type': 'ListItem', position: 3, name: displayName, item: meta.canonical },
      ],
    },
    {
      '@type': 'Article',
      headline: `${displayName} — Name Meaning, Etymology, Acrostic Poem & Cultural Quotes`,
      name: `${displayName} Name Etymology & Cultural Archive`,
      description: meta.description,
      url: meta.canonical,
      image: meta.ogImage,
      author: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: `${SITE_URL}/`,
      },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: `${SITE_URL}/`,
      },
      about: {
        '@type': 'Thing',
        name: displayName,
        description: nameData.meaning || `Etymology and meaning of ${displayName}`,
      },
      keywords: [
        `${displayName} name meaning`,
        `${displayName} etymology`,
        `acrostic poem for ${displayName}`,
        `songs with the name ${displayName}`,
      ].join(', '),
    },
  ];

  // Only include FAQPage schema when resolved so schema strictly matches visible page content
  if (isResolved) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `What is the etymology and meaning of the name ${displayName}?`,
          acceptedAnswer: { '@type': 'Answer', text: faqOriginAnswer },
        },
        {
          '@type': 'Question',
          name: `What is an acrostic poem for ${displayName}?`,
          acceptedAnswer: { '@type': 'Answer', text: faqAcrosticAnswer },
        },
        {
          '@type': 'Question',
          name: `Where does the name ${displayName} appear in books, songs, and movies?`,
          acceptedAnswer: { '@type': 'Answer', text: faqCultureAnswer },
        },
      ],
    });
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': graph,
  };

  const renderSection = (heading: string, itemsHtml: string) =>
    itemsHtml
      ? `<section style="margin-top:24px;"><h2 style="font-size:21px;border-bottom:1px solid #e7e5e4;padding-bottom:6px;margin:0 0 12px 0;">${heading}</h2>${itemsHtml}</section>`
      : '';

  const booksHtml = renderSection(
    `Literary Works &amp; Books Featuring ${escapeHtml(displayName)}`,
    books
      .map(
        (b) =>
          `<article style="margin-bottom:12px;"><h3 style="font-size:17px;margin:0;">${escapeHtml(b.title)} <span style="font-weight:400;color:#57534e;">by ${escapeHtml(b.author)}${b.year ? ` (${escapeHtml(b.year)})` : ''}</span></h3><blockquote style="margin:6px 0;font-style:italic;color:#292524;">${escapeHtml(b.quote)}</blockquote>${b.context ? `<p style="margin:0;font-size:14px;color:#57534e;">${escapeHtml(b.context)}</p>` : ''}</article>`
      )
      .join('')
  );

  const songsHtml = renderSection(
    `Songs &amp; Lyrics Mentioning ${escapeHtml(displayName)}`,
    songs
      .map(
        (s) =>
          `<article style="margin-bottom:12px;"><h3 style="font-size:17px;margin:0;">${escapeHtml(s.title)} <span style="font-weight:400;color:#57534e;">by ${escapeHtml(s.artist)}${s.year ? ` (${escapeHtml(s.year)})` : ''}</span></h3><blockquote style="margin:6px 0;font-style:italic;color:#292524;">${escapeHtml(s.lyricsQuote)}</blockquote></article>`
      )
      .join('')
  );

  const moviesHtml = renderSection(
    `Iconic Film &amp; TV Quotes for ${escapeHtml(displayName)}`,
    movies
      .map(
        (m) =>
          `<article style="margin-bottom:12px;"><h3 style="font-size:17px;margin:0;">${escapeHtml(m.title)}${m.year ? ` (${escapeHtml(m.year)})` : ''}</h3><blockquote style="margin:6px 0;font-style:italic;color:#292524;">${escapeHtml(m.quote)}</blockquote></article>`
      )
      .join('')
  );

  const gamesHtml = renderSection(
    `Video Games &amp; Gaming Lore for ${escapeHtml(displayName)}`,
    games
      .map(
        (g) =>
          `<article style="margin-bottom:12px;"><h3 style="font-size:17px;margin:0;">${escapeHtml(g.title)}${g.developer ? ` &mdash; ${escapeHtml(g.developer)}` : ''}</h3><blockquote style="margin:6px 0;font-style:italic;color:#292524;">${escapeHtml(g.quote)}</blockquote></article>`
      )
      .join('')
  );

  const artHtml = renderSection(
    `Fine Art &amp; Famous Artists Connected to ${escapeHtml(displayName)}`,
    art
      .map(
        (a) =>
          `<article style="margin-bottom:12px;"><h3 style="font-size:17px;margin:0;">${escapeHtml(a.title)} <span style="font-weight:400;color:#57534e;">by ${escapeHtml(a.artist)}</span></h3><blockquote style="margin:6px 0;font-style:italic;color:#292524;">${escapeHtml(a.quote)}</blockquote></article>`
      )
      .join('')
  );

  const acrosticHtml = acrosticLines
    .map(
      (a) =>
        `<li style="margin-bottom:8px;font-size:16px;"><strong>${escapeHtml(a.letter)}</strong> &mdash; <em>${escapeHtml(a.line)}</em></li>`
    )
    .join('');

  const relatedLinksHtml = related
    .map(
      (r) =>
        `<a href="/name/${escapeHtml(r.slug)}" style="display:inline-block;margin:4px 8px 4px 0;padding:6px 12px;border:1px solid #e7e5e4;border-radius:8px;background:#ffffff;color:#1c1917;text-decoration:none;font-size:14px;">${escapeHtml(r.name)}</a>`
    )
    .join('');

  const faqVisibleHtml = isResolved
    ? `<section style="margin-top:28px;border-top:1px solid #e7e5e4;padding-top:20px;">
        <h2 style="font-size:21px;margin:0 0 12px 0;">Frequently Asked Questions about ${escapeHtml(displayName)}</h2>
        <dl>
          <dt style="font-weight:700;margin-top:10px;">What is the etymology and meaning of the name ${escapeHtml(displayName)}?</dt>
          <dd style="margin:4px 0 12px 0;color:#44403c;">${escapeHtml(faqOriginAnswer)}</dd>
          <dt style="font-weight:700;margin-top:10px;">What is an acrostic poem for ${escapeHtml(displayName)}?</dt>
          <dd style="margin:4px 0 12px 0;color:#44403c;">${escapeHtml(faqAcrosticAnswer)}</dd>
          <dt style="font-weight:700;margin-top:10px;">Where does the name ${escapeHtml(displayName)} appear in books, songs, and movies?</dt>
          <dd style="margin:4px 0 12px 0;color:#44403c;">${escapeHtml(faqCultureAnswer)}</dd>
        </dl>
      </section>`
    : '';

  const ssrBody = `
    <div style="font-family:Georgia,serif;color:#1c1917;background:#faf8f5;min-height:100vh;">
      <header style="border-bottom:1px solid #e7e5e4;padding:20px 16px;text-align:center;background:#fbf9f5;">
        <a href="/" style="font-size:34px;color:#1c1917;text-decoration:none;font-weight:700;">The Page of You</a>
        <nav aria-label="Primary" style="margin-top:8px;">
          <a href="/" style="margin:0 10px;color:#1c1917;font-size:14px;">Home</a>
          <a href="/names" style="margin:0 10px;color:#92400e;font-size:14px;font-weight:600;">Browse Names A&ndash;Z</a>
          <a href="/songs-with-names" style="margin:0 10px;color:#065f46;font-size:14px;font-weight:600;">Songs With Names</a>
          <a href="/acrostic-name-poems" style="margin:0 10px;color:#78350f;font-size:14px;font-weight:600;">Acrostic Poems</a>
        </nav>
      </header>
      <main style="max-width:860px;margin:0 auto;padding:28px 16px;line-height:1.6;">
        <nav aria-label="Breadcrumb" style="font-size:13px;color:#78716c;margin-bottom:14px;">
          <a href="/" style="color:#92400e;">Home</a> &rsaquo; <a href="/names" style="color:#92400e;">Browse Names</a> &rsaquo; <span>${escapeHtml(displayName)}</span>
        </nav>
        <h1 style="font-size:32px;line-height:1.2;margin:0 0 10px 0;">${escapeHtml(displayName)} &mdash; Name Meaning, Etymology &amp; Cultural Archive</h1>
        <p style="font-size:18px;font-style:italic;color:#44403c;margin:0 0 8px 0;">
          <strong>Etymology &amp; Origin:</strong> ${escapeHtml(nameData.origin || 'Cultural Heritage')} &bull; <strong>Meaning:</strong> &ldquo;${escapeHtml(nameData.meaning)}&rdquo;
        </p>
        ${adjectives.length > 0 ? `<p style="font-size:14px;color:#78716c;margin:0 0 20px 0;"><strong>Associated Traits:</strong> ${escapeHtml(adjectives.join(', '))}</p>` : ''}
        ${acrosticHtml ? `<section style="margin-top:24px;"><h2 style="font-size:21px;border-bottom:1px solid #e7e5e4;padding-bottom:6px;margin:0 0 12px 0;">The Acrostic Poem of ${escapeHtml(displayName)}</h2><ul style="list-style:none;padding:0;margin:0;">${acrosticHtml}</ul></section>` : ''}
        ${booksHtml}
        ${songsHtml}
        ${moviesHtml}
        ${gamesHtml}
        ${artHtml}
        ${faqVisibleHtml}
        <section style="margin-top:28px;border-top:1px solid #e7e5e4;padding-top:18px;">
          <h2 style="font-size:19px;margin:0 0 10px 0;">Explore Similar Name Etymologies</h2>
          <div>${relatedLinksHtml}</div>
          <p style="margin-top:12px;"><a href="/names" style="color:#92400e;font-weight:600;text-decoration:underline;">View All Curated Names A&ndash;Z &rarr;</a></p>
        </section>
      </main>
    </div>`;

  // Inject preloaded state ONLY when resolved — uncached names trigger a client lookup instead of showing an empty page!
  const preloadScript = isResolved
    ? `<script>
        window.__PRELOADED_NAME_DATA__ = ${JSON.stringify(nameData).replace(/</g, '\\u003c')};
        window.__PRELOADED_NAME__ = ${JSON.stringify(displayName).replace(/</g, '\\u003c')};
        window.__PRELOADED_RESOLVED__ = true;
      </script>`
    : `<script>
        window.__PRELOADED_NAME__ = ${JSON.stringify(displayName).replace(/</g, '\\u003c')};
        window.__PRELOADED_RESOLVED__ = false;
      </script>`;

  let html = applySeoHead(templateHtml, meta, jsonLd);
  html = html.replace('</head>', `${preloadScript}\n</head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${ssrBody}</div>`);
  return html;
}

/**
 * Renders full semantic SSR HTML for the Songs With Names hub (/songs-with-names).
 */
export function renderSongsHubHtml(templateHtml: string): string {
  const meta = buildSongsHubSeo();
  const songs = getCuratedSongsIndex();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: `${SITE_URL}/`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Songs With Names', item: `${SITE_URL}/songs-with-names` },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: 'Songs With Names in the Title & Lyrics Archive',
        url: `${SITE_URL}/songs-with-names`,
        description: meta.description,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: songs.length,
          itemListElement: songs.slice(0, 100).map((song, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: `${song.title} by ${song.artist} (${song.name})`,
            url: `${SITE_URL}/name/${getNameSlug(song.name)}`,
          })),
        },
      },
    ],
  };

  const songCardsHtml = songs
    .map(
      (song) => `
      <article style="background:#ffffff;border:1px solid #d1fae5;border-radius:14px;padding:16px;">
        <div style="font-size:12px;color:#065f46;font-weight:700;margin-bottom:4px;">
          <a href="/name/${escapeHtml(song.slug)}" style="color:#065f46;text-decoration:none;">${escapeHtml(song.name)}</a>
          &bull; ${escapeHtml(song.origin)}${song.year ? ` (${escapeHtml(song.year)})` : ''}
        </div>
        <h2 style="font-size:18px;margin:0 0 4px 0;color:#1c1917;">${escapeHtml(song.title)} &mdash; <span style="font-weight:400;color:#047857;">${escapeHtml(song.artist)}</span></h2>
        <blockquote style="margin:8px 0;padding-left:12px;border-left:2px solid #34d399;font-style:italic;color:#44403c;">&ldquo;${escapeHtml(stripOuterQuotes(song.lyricsQuote))}&rdquo;</blockquote>
        <div style="font-size:13px;margin-top:8px;">
          <a href="/name/${escapeHtml(song.slug)}" style="color:#92400e;font-weight:600;text-decoration:underline;margin-right:14px;">Explore ${escapeHtml(song.name)}&rsquo;s Etymology &amp; Poem &rarr;</a>
          <a href="${escapeHtml(getAmazonMusicUrl(song.title, song.artist))}" target="_blank" rel="sponsored noopener noreferrer" style="color:#065f46;">Listen on Amazon Music</a>
        </div>
      </article>`
    )
    .join('');

  const ssrBody = `
    <div style="font-family:Georgia,serif;color:#1c1917;background:#faf8f5;min-height:100vh;">
      <header style="border-bottom:1px solid #e7e5e4;padding:20px 16px;text-align:center;background:#fbf9f5;">
        <a href="/" style="font-size:34px;color:#1c1917;text-decoration:none;font-weight:700;">The Page of You</a>
        <nav aria-label="Primary" style="margin-top:10px;">
          <a href="/" style="margin:0 10px;color:#1c1917;font-size:14px;">Home</a>
          <a href="/names" style="margin:0 10px;color:#92400e;font-size:14px;font-weight:600;">Browse Names A&ndash;Z</a>
          <a href="/songs-with-names" style="margin:0 10px;color:#065f46;font-size:14px;font-weight:700;">Songs With Names</a>
          <a href="/acrostic-name-poems" style="margin:0 10px;color:#78350f;font-size:14px;font-weight:600;">Acrostic Poems</a>
        </nav>
      </header>
      <main style="max-width:960px;margin:0 auto;padding:32px 16px;line-height:1.6;">
        <nav aria-label="Breadcrumb" style="font-size:13px;color:#78716c;margin-bottom:14px;">
          <a href="/" style="color:#065f46;">Home</a> &rsaquo; <span>Songs With Names</span>
        </nav>
        <h1 style="font-size:34px;line-height:1.2;margin:0 0 12px 0;">Songs With Names in the Title &amp; Lyrics</h1>
        <p style="font-size:16px;color:#57534e;margin:0 0 24px 0;">
          Explore ${songs.length} verified songs featuring names in the title and lyrics across our curated etymology archive. Click any name to uncover its historical origin, book quotes, film lines, and custom acrostic poem.
        </p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">
          ${songCardsHtml}
        </div>
      </main>
    </div>`;

  let html = applySeoHead(templateHtml, meta, jsonLd);
  html = html.replace('<div id="root"></div>', `<div id="root">${ssrBody}</div>`);
  return html;
}

/**
 * Renders full semantic SSR HTML for the Acrostic Name Poems Gallery hub (/acrostic-name-poems).
 */
export function renderAcrosticHubHtml(templateHtml: string): string {
  const meta = buildAcrosticHubSeo();
  const poems = getCuratedAcrosticsIndex();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: `${SITE_URL}/`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Acrostic Name Poems', item: `${SITE_URL}/acrostic-name-poems` },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: 'Acrostic Name Poems & Bespoke Verse Archive',
        url: `${SITE_URL}/acrostic-name-poems`,
        description: meta.description,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: poems.length,
          itemListElement: poems.slice(0, 100).map((entry, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: `Acrostic Poem for ${entry.name}`,
            url: `${SITE_URL}/name/${getNameSlug(entry.name)}`,
          })),
        },
      },
    ],
  };

  const poemCardsHtml = poems
    .map(
      (entry) => `
      <article style="background:#1c1917;color:#fef3c7;border:1px solid #b45309;border-radius:14px;padding:18px;">
        <h2 style="font-size:22px;margin:0 0 4px 0;">
          <a href="/name/${escapeHtml(entry.slug)}" style="color:#fef3c7;text-decoration:none;">${escapeHtml(entry.name)}</a>
        </h2>
        <p style="font-size:13px;color:#fbbf24;font-style:italic;margin:0 0 12px 0;">${escapeHtml(entry.origin)} &bull; &ldquo;${escapeHtml(entry.meaning)}&rdquo;</p>
        <ul style="list-style:none;padding:0;margin:0 0 12px 0;">
          ${entry.acrostic
            .map(
              (a) =>
                `<li style="margin-bottom:5px;font-size:14px;color:#e7e5e4;"><strong style="color:#fbbf24;">${escapeHtml(a.letter)}</strong> &mdash; <em>${escapeHtml(a.line)}</em></li>`
            )
            .join('')}
        </ul>
        <a href="/name/${escapeHtml(entry.slug)}" style="font-size:13px;color:#fcd34d;text-decoration:underline;">View ${escapeHtml(entry.name)}&rsquo;s Etymology &amp; Printable Keepsake &rarr;</a>
      </article>`
    )
    .join('');

  const ssrBody = `
    <div style="font-family:Georgia,serif;color:#1c1917;background:#faf8f5;min-height:100vh;">
      <header style="border-bottom:1px solid #e7e5e4;padding:20px 16px;text-align:center;background:#fbf9f5;">
        <a href="/" style="font-size:34px;color:#1c1917;text-decoration:none;font-weight:700;">The Page of You</a>
        <nav aria-label="Primary" style="margin-top:10px;">
          <a href="/" style="margin:0 10px;color:#1c1917;font-size:14px;">Home</a>
          <a href="/names" style="margin:0 10px;color:#92400e;font-size:14px;font-weight:600;">Browse Names A&ndash;Z</a>
          <a href="/songs-with-names" style="margin:0 10px;color:#065f46;font-size:14px;font-weight:600;">Songs With Names</a>
          <a href="/acrostic-name-poems" style="margin:0 10px;color:#78350f;font-size:14px;font-weight:700;">Acrostic Poems</a>
        </nav>
      </header>
      <main style="max-width:960px;margin:0 auto;padding:32px 16px;line-height:1.6;">
        <nav aria-label="Breadcrumb" style="font-size:13px;color:#78716c;margin-bottom:14px;">
          <a href="/" style="color:#92400e;">Home</a> &rsaquo; <span>Acrostic Name Poems</span>
        </nav>
        <h1 style="font-size:34px;line-height:1.2;margin:0 0 12px 0;">Acrostic Name Poems &amp; Printable Verse Archive</h1>
        <p style="font-size:16px;color:#57534e;margin:0 0 24px 0;">
          Browse ${poems.length} bespoke acrostic name poems inspired by each name&rsquo;s linguistic etymology and meaning. Preview archival themes and download printable keepsake cards for free.
        </p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">
          ${poemCardsHtml}
        </div>
      </main>
    </div>`;

  let html = applySeoHead(templateHtml, meta, jsonLd);
  html = html.replace('<div id="root"></div>', `<div id="root">${ssrBody}</div>`);
  return html;
}
