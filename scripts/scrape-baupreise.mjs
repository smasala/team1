#!/usr/bin/env node
/**
 * scrape-baupreise.mjs
 *
 * Basic scraper for https://baupreise24.de/baupreise
 *
 * Walks every trade category ("Gewerk") linked from the index page, parses the
 * construction-price line items out of each category page, and writes them all
 * into a single local JSON catalogue.
 *
 * Zero dependencies — uses Node's built-in fetch (Node >= 18). Run with:
 *   node scripts/scrape-baupreise.mjs
 *
 * Notes on the source data: prices are German net averages (ohne MwSt.),
 * baseline Q1 2022, decimal comma format (e.g. "20,40" = 20.40 EUR).
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const BASE = 'https://baupreise24.de';
const INDEX = `${BASE}/baupreise`;
const OUT_FILE = join(dirname(fileURLToPath(import.meta.url)), 'baupreise-catalogue.json');
const REQUEST_DELAY_MS = 500; // be polite between requests
const USER_AGENT = 'Mozilla/5.0 (baupreise-catalogue-scraper)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

const NAMED_ENTITIES = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  bull: '•', euro: '€', sup2: '²', sup3: '³',
  auml: 'ä', ouml: 'ö', uuml: 'ü', szlig: 'ß',
  Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', deg: '°',
};

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (m, name) =>
      Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, name) ? NAMED_ENTITIES[name] : m
    );
}

/** Strip tags, decode entities, collapse whitespace. Bullets are kept. */
function cleanText(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tidy a line-item description: drop bullets, collapse, trim trailing punctuation. */
function cleanDescription(s) {
  return s
    .replace(/•/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[;,\s]+$/, '')
    .trim();
}

/**
 * Extract a German price ("1.234,56" -> 1234.56) from a price cell, or null.
 * Matches the first price token rather than the whole string, so source typos
 * like a trailing "20,80.." still parse.
 */
function parsePrice(text) {
  const m = text.replace(/\s/g, '').match(/(\d{1,3}(?:\.\d{3})*|\d+),(\d{2})(?!\d)/);
  if (!m) return null;
  return Number(`${m[1].replace(/\./g, '')}.${m[2]}`);
}

// Map the many raw unit spellings on the site to a canonical form.
// Case-sensitive on purpose: "m" (meter) and "M" (Monat) must not collide.
const UNIT_MAP = new Map([
  ['m²', 'm²'], ['.m²', 'm²'], ['m ²', 'm²'], ['m2', 'm²'], ['qm', 'm²'],
  ['m³', 'm³'], ['m3', 'm³'], ['cbm', 'm³'],
  ['m', 'm'], ['.m', 'm'], ['lfm', 'm'], ['Lfm', 'm'],
  ['St', 'St'], ['St.', 'St'], ['Stk', 'St'], ['Stk.', 'St'], ['Stck', 'St'],
  ['Stück', 'St'], ['stck', 'St'], ['Stceck', 'St'],
  ['kg', 'kg'], ['Kg', 'kg'], ['KG', 'kg'],
  ['t', 't'], ['to', 't'],
  ['h', 'h'], ['Std', 'h'], ['Std.', 'h'], ['Std', 'h'],
  ['l', 'l'], ['Ltr', 'l'], ['ltr', 'l'],
  ['psch', 'psch'], ['Psch', 'psch'], ['pschl', 'psch'], ['pausch', 'psch'],
  ['Wo', 'Wo'], ['M', 'M'],
  ['m/Wo', 'm/Wo'], ['m²/Wo', 'm²/Wo'], ['m³/Wo', 'm³/Wo'],
]);

/** Canonicalize a unit; unknown values are returned cleaned but unchanged. */
function normalizeUnit(raw) {
  const u = (raw || '').replace(/ /g, ' ').trim();
  if (!u) return '';
  if (UNIT_MAP.has(u)) return UNIT_MAP.get(u);
  const compact = u.replace(/\s+/g, '').replace(/^\.+/, '').replace(/\.+$/, ''); // "m ²"->"m²", ".m²"/"m²."->"m²"
  if (UNIT_MAP.has(compact)) return UNIT_MAP.get(compact);
  return compact || u;
}

/** Tidy a subcategory header: drop letter-spaced banners like "N E T T O P R E I S E". */
function cleanHeader(s) {
  const cleaned = s
    .replace(/(?:[A-ZÄÖÜ]\s){2,}[A-ZÄÖÜ](?=\s|$)/g, ' ') // decorative spaced-out caps banner
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[^\p{L}\p{N}(]+/u, '') // leading decorative junk, e.g. "° Abdichtung..." -> "Abdichtung..."
    .replace(/[^\p{L}\p{N}).%]+$/u, '') // trailing decorative junk
    .replace(/^([A-ZÄÖÜ]) (?=[a-zäöü])/, '$1') // drop-cap split, e.g. "F ensterbänke" -> "Fensterbänke"
    .trim();
  return cleaned || null;
}

/**
 * Find a bold word at the very START of an item's description (after the bullet),
 * used as a subcategory header in some trades (e.g. TROCKENBAU "• **GK-Platten**,
 * 1 x 12,5 mm ..."). Returns it only if the description actually begins with that
 * bold text, so mid-description emphasis isn't mistaken for a header.
 */
function leadingBoldHeader(rawHtml, description) {
  for (const m of rawHtml.matchAll(/<strong[^>]*>([\s\S]*?)<\/strong>/gi)) {
    const word = cleanDescription(cleanText(m[1]));
    if (!word) continue; // skip <strong> that only wraps the bullet
    const desc = description.replace(/^\W+/, '').toLowerCase();
    return desc.startsWith(word.toLowerCase()) ? cleanHeader(word) : null;
  }
  return null;
}

/**
 * Split a description cell into an optional subcategory header and the item text.
 * Headers appear either as bold text BEFORE the leading "•" bullet of the first
 * item in a group (e.g. "Vorbereitung des Untergrundes • Reinigung ..."), or as a
 * bold word right AFTER the bullet ("• GK-Platten, ...").
 */
function parseDescriptionCell(rawHtml) {
  const text = cleanText(rawHtml);
  const idx = text.indexOf('•');
  if (idx === -1) return { header: null, description: cleanDescription(text) };
  const before = text.slice(0, idx).trim();
  const description = cleanDescription(text.slice(idx + 1));
  const header = before ? cleanHeader(before) : leadingBoldHeader(rawHtml, description);
  return { header, description };
}

/** Discover the trade categories linked from the index page. */
function parseCategories(html) {
  const seen = new Map();
  const re = /<a[^>]*href="\/baupreise\/([a-z0-9-]+)"[^>]*>([^<]*)<\/a>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const slug = m[1];
    const name = cleanText(m[2]);
    if (!name || seen.has(slug)) continue;
    seen.set(slug, { slug, name, url: `${BASE}/baupreise/${slug}` });
  }
  return [...seen.values()];
}

/** Extract price line items from a category page. */
function parseItems(html) {
  // Restrict to the article body so we ignore menu/footer markup.
  const body = html.match(/<section[^>]*class="article-content[^"]*"[^>]*>([\s\S]*?)<\/section>/i);
  const scope = body ? body[1] : html;

  const items = [];
  const subcategories = []; // distinct headers, in document order
  let currentSub = null;

  const setSub = (header) => {
    if (!header) return;
    currentSub = header;
    if (!subcategories.includes(header)) subcategories.push(header);
  };

  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let row;
  while ((row = rowRe.exec(scope)) !== null) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => c[1]);
    if (cells.length !== 3) continue;
    const priceRaw = cleanText(cells[2]);
    const price = parsePrice(priceRaw);

    if (price === null) {
      // A header-only row: bold text in the first cell, no bullet, no price
      // (some categories put subcategory headers in their own row instead of
      // inline before the first item — e.g. PUTZARBEITEN "Untergrund").
      const text = cleanText(cells[0]);
      if (text && !text.includes('•') && /<strong/i.test(cells[0])) {
        setSub(cleanHeader(text));
      }
      continue;
    }

    const { header, description } = parseDescriptionCell(cells[0]);
    setSub(header);
    if (!description) continue;

    const unitRaw = cleanText(cells[1]);
    items.push({
      subcategory: currentSub,
      description,
      unit: normalizeUnit(unitRaw),
      unitRaw,
      price,
      priceRaw,
    });
  }
  return { items, subcategories };
}

async function main() {
  console.log(`Fetching category index: ${INDEX}`);
  const categories = parseCategories(await fetchText(INDEX));
  console.log(`Found ${categories.length} categories.\n`);

  const out = [];
  let total = 0;
  for (const [i, cat] of categories.entries()) {
    process.stdout.write(`[${i + 1}/${categories.length}] ${cat.name} ... `);
    try {
      const { items, subcategories } = parseItems(await fetchText(cat.url));
      out.push({ ...cat, subcategoryCount: subcategories.length, subcategories, itemCount: items.length, items });
      total += items.length;
      console.log(`${items.length} items, ${subcategories.length} subcategories`);
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
      out.push({ ...cat, subcategoryCount: 0, subcategories: [], itemCount: 0, items: [], error: err.message });
    }
    await sleep(REQUEST_DELAY_MS);
  }

  const catalogue = {
    source: INDEX,
    scrapedAt: new Date().toISOString(),
    currency: 'EUR',
    priceNote: 'German net averages (ohne MwSt.), baseline Q1 2022. Units normalized; unitRaw/priceRaw preserve the source values.',
    categoryCount: out.length,
    itemCount: total,
    categories: out,
  };

  await writeFile(OUT_FILE, JSON.stringify(catalogue, null, 2), 'utf-8');
  console.log(`\nWrote ${total} items across ${out.length} categories -> ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
