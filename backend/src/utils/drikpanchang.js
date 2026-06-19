/**
 * Drik Panchang Scraper
 *
 * Fetches festival / tithi / vrat data from:
 *   https://www.drikpanchang.com/festivals/month/festivals-{month}.html?year={year}
 *
 * Uses multiple selector strategies so it stays resilient to minor HTML changes.
 * Returns a normalized array; never throws on parse failures — bad rows are skipped.
 */

const axios   = require('axios');
const cheerio = require('cheerio');

const MONTHS = [
  'january','february','march','april','may','june',
  'july','august','september','october','november','december',
];

// ── helpers ────────────────────────────────────────────────────────────────

function monthIndex(month) {
  if (typeof month === 'number') return month - 1;       // 1-based → 0-based
  return MONTHS.indexOf(month.toLowerCase().trim());     // name → 0-based
}

function buildUrl(month, year) {
  const name = typeof month === 'number' ? MONTHS[month - 1] : month.toLowerCase().trim();
  return `https://www.drikpanchang.com/festivals/month/festivals-${name}.html?year=${year}`;
}

/**
 * Extract the first integer ≥ 1 from a text string (used to find day-of-month).
 * Skips numbers > 31 (year numbers) and leading year-like numbers.
 */
function extractDay(text) {
  if (!text) return null;
  const nums = text.match(/\b(\d{1,2})\b/g);
  if (!nums) return null;
  for (const n of nums) {
    const v = parseInt(n, 10);
    if (v >= 1 && v <= 31) return v;
  }
  return null;
}

/** Build a UTC midnight Date, verify it stays within the requested month. */
function makeDate(day, monthIdx, year) {
  if (!day || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, monthIdx, day));
  if (isNaN(d.getTime()) || d.getUTCMonth() !== monthIdx) return null;
  return d;
}

function clean(str) {
  return (str || '').replace(/\s+/g, ' ').trim();
}

// ── page fetch ─────────────────────────────────────────────────────────────

async function fetchPage(url) {
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/124.0.0.0 Safari/537.36',
      'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection':      'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control':   'max-age=0',
      'Referer':         'https://www.drikpanchang.com/',
    },
    timeout: 45000,
    maxRedirects: 5,
  });
  return data;
}

// ── extraction strategies ──────────────────────────────────────────────────

/**
 * Strategy A — DP-prefixed card/list items (their older layout uses dp* CSS classes).
 * Looks for any element whose class contains "Festival" + "Item/Detail/Row/Entry".
 */
function strategyA($, monthIdx, year) {
  const results = [];

  // Collect items from class names that suggest festival list entries
  const itemSel = [
    '.dpFestivalDetailListItem',
    '.dpFestivalListItem',
    '.dpFestivalItem',
    '.dpFestivalEntry',
    '[class*="FestivalDetail"]',
    '[class*="festival-item"]',
    '[class*="festival-entry"]',
  ].join(', ');

  $(itemSel).each((_, el) => {
    const $el = $(el);
    const allText = $el.text();

    // Name — prefer explicit name/title class, fall back to first link or heading
    const name = clean(
      $el.find('[class*="Name"],[class*="name"],[class*="Title"],[class*="title"]').first().text() ||
      $el.find('a').first().text() ||
      $el.find('h3,h4,h5,strong').first().text()
    );

    // Date
    const dateText = clean(
      $el.find('[class*="Date"],[class*="date"]').first().text() ||
      $el.find('time').first().attr('datetime') ||
      ''
    );

    // Tithi
    const tithi = clean($el.find('[class*="Tithi"],[class*="tithi"]').first().text());

    // Vrat
    const vrat = clean($el.find('[class*="Vrat"],[class*="vrat"]').first().text());

    // Paksha
    const paksha = clean($el.find('[class*="Paksha"],[class*="paksha"]').first().text());

    // Nakshatra
    const nakshatra = clean($el.find('[class*="Nakshatra"],[class*="nakshatra"]').first().text());

    // Description
    const description = clean($el.find('[class*="Desc"],[class*="desc"],p').first().text());

    const day  = extractDay(dateText) || extractDay(allText);
    const date = makeDate(day, monthIdx, year);

    if (name && date) {
      results.push({ name, date, tithi, vrat, paksha, nakshatra, description });
    }
  });

  return results;
}

/**
 * Strategy B — Table rows.
 * Looks for tables where the first column looks like a date.
 */
function strategyB($, monthIdx, year) {
  const results = [];

  $('table').each((_, table) => {
    $(table).find('tr').each((rowIdx, row) => {
      if (rowIdx === 0) return; // header
      const cells = $(row).find('td');
      if (cells.length < 2) return;

      const dateCell = clean($(cells[0]).text());
      const nameCell = $(cells[1]);
      const thirdCell = cells.length > 2 ? clean($(cells[2]).text()) : '';
      const fourthCell = cells.length > 3 ? clean($(cells[3]).text()) : '';

      // First cell must look like a date
      if (!dateCell.match(/\d{1,2}/) ) return;

      const name = clean(nameCell.find('a').text() || nameCell.text());
      if (!name || name.length < 2) return;

      const day  = extractDay(dateCell);
      const date = makeDate(day, monthIdx, year);
      if (!date) return;

      // Heuristically assign columns 3 & 4 to tithi/vrat
      const tithi = thirdCell;
      const vrat  = fourthCell;

      results.push({ name, date, tithi, vrat, paksha: '', nakshatra: '', description: '' });
    });
  });

  return results;
}

/**
 * Strategy C — Definition lists or "date header + list" pattern.
 * Some pages group festivals under a <dt> date heading with <dd> entries.
 */
function strategyC($, monthIdx, year) {
  const results = [];

  $('dl').each((_, dl) => {
    let currentDay = null;

    $(dl).children().each((_, el) => {
      const tag = el.tagName ? el.tagName.toLowerCase() : '';
      if (tag === 'dt') {
        currentDay = extractDay($(el).text());
      } else if (tag === 'dd' && currentDay) {
        const name = clean($(el).find('a').text() || $(el).text());
        const date = makeDate(currentDay, monthIdx, year);
        if (name && date) {
          results.push({ name, date, tithi: '', vrat: '', paksha: '', nakshatra: '', description: '' });
        }
      }
    });
  });

  return results;
}

/**
 * Strategy D — Generic link scan.
 * Any <a> tag inside a content area that has a sibling/parent with a date.
 * Fallback of last resort.
 */
function strategyD($, monthIdx, year) {
  const results = [];

  // Find the main content area (exclude nav/header/footer)
  const contentArea = $('main, #main, #content, .content, [id*="Content"], [class*="content"]').first();
  const scope = contentArea.length ? contentArea : $('body');

  scope.find('a[href]').each((_, a) => {
    const $a   = $(a);
    const href = $a.attr('href') || '';
    const name = clean($a.text());

    // Skip navigation-like links
    if (!name || name.length < 3 || name.length > 80) return;
    if (href.includes('#') || href.startsWith('javascript')) return;

    // Look for a date in the surrounding container (parent or closest sibling text)
    const container = $a.closest('li, tr, div, article, section');
    const containerText = clean(container.text());
    const day  = extractDay(containerText);
    const date = makeDate(day, monthIdx, year);

    if (date) {
      results.push({ name, date, tithi: '', vrat: '', paksha: '', nakshatra: '', description: '' });
    }
  });

  return results;
}

// ── normalise + dedupe within a scrape pass ────────────────────────────────

/**
 * Classify dataType from the fields present.
 */
function classifyDataType(entry) {
  const hasFestival = !!entry.name;
  const hasTithi    = !!entry.tithi;
  const hasVrat     = !!entry.vrat;
  const hasPanchang = !!entry.panchang;

  const count = [hasFestival, hasTithi, hasVrat, hasPanchang].filter(Boolean).length;
  if (count > 1) return 'mixed';
  if (hasFestival) return 'festival';
  if (hasTithi)    return 'tithi';
  if (hasVrat)     return 'vrat';
  if (hasPanchang) return 'panchang';
  return 'festival';
}

function dedupeLocal(entries) {
  const seen = new Set();
  return entries.filter((e) => {
    const key = `${e.date.toISOString()}|${e.name.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── public API ─────────────────────────────────────────────────────────────

/**
 * Scrape Drik Panchang for a given month/year.
 * @param {number|string} month  1-12 or 'january' etc.
 * @param {number}        year   e.g. 2027
 * @returns {{ entries: Array, url: string, strategyUsed: string, rawCount: number }}
 */
async function scrapeMonthFestivals(month, year) {
  const mIdx = monthIndex(month);
  if (mIdx < 0 || mIdx > 11) throw new Error(`Invalid month: ${month}`);

  const url  = buildUrl(month, year);
  const html = await fetchPage(url);
  const $    = cheerio.load(html);

  // Try strategies in order; use the first that yields results
  let entries     = [];
  let strategyUsed = 'none';

  const tryStrategy = (fn, label) => {
    if (entries.length > 0) return;
    const found = fn($, mIdx, year);
    if (found.length > 0) {
      entries      = found;
      strategyUsed = label;
    }
  };

  tryStrategy(strategyA, 'A-DPclass');
  tryStrategy(strategyB, 'B-table');
  tryStrategy(strategyC, 'C-deflist');
  tryStrategy(strategyD, 'D-linkScan');

  const rawCount = entries.length;

  // Normalise
  entries = dedupeLocal(entries)
    .filter((e) => {
      if (!e.name || e.name.length < 2) return false;
      // Discard entries that look like navigation labels
      const skip = ['home','about','contact','privacy','terms','login','register',
                    'back','next','previous','more','see all','view all'];
      return !skip.includes(e.name.toLowerCase());
    })
    .map((e) => ({
      name:        e.name,
      date:        e.date,
      tithiDate:   e.tithi    || '',
      vrat:        e.vrat     || '',
      panchang:    e.panchang || '',
      description: e.description || '',
      hinduMonth:  e.hinduMonth  || '',
      paksha:      e.paksha      || '',
      nakshatra:   e.nakshatra   || '',
      source:      'drikpanchang',
      isActive:    true,
      dataType:    classifyDataType({ ...e, panchang: e.panchang || '' }),
    }));

  return { entries, url, strategyUsed, rawCount };
}

module.exports = { scrapeMonthFestivals, buildUrl, MONTHS };
