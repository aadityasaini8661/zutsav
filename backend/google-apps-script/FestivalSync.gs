/**
 * ZUTSAV — Festival Data Sync — Google Apps Script  (v4)
 * ────────────────────────────────────────────────────────
 *
 * HOW TO DEPLOY
 * 1. Open your Google Sheet → Extensions → Apps Script
 * 2. Replace ALL existing code with this file (Ctrl+A → Delete → Paste)
 * 3. Save (Ctrl+S)
 * 4. Deploy → New deployment → Web app
 *    Execute as: Me | Who has access: Anyone
 * 5. Copy the Web App URL → paste into backend/.env as GOOGLE_APPS_SCRIPT_URL
 * 6. Restart the backend server
 *
 * WHAT THIS SCRIPT DOES
 * 1. Receives ?month=june&year=2026
 * 2. Fetches Drik Panchang HTML directly and parses dpEventName + dpEventGregDate
 * 3. Returns JSON: [{ festivalName, date, tithi }]
 */

// ─── Configuration ───────────────────────────────────────────────────────────
var SHEET_NAME     = 'Sheet1';
var DATA_START_ROW = 2;
var WAIT_MS        = 25000;

// ─── Entry point ─────────────────────────────────────────────────────────────
function doGet(e) {
  var MONTHS = [
    'january','february','march','april','may','june',
    'july','august','september','october','november','december'
  ];

  try {
    var params     = (e && e.parameter) ? e.parameter : {};
    var month      = String(params.month || '').toLowerCase().trim();
    var year       = parseInt(String(params.year || new Date().getFullYear()), 10);
    var monthIndex = MONTHS.indexOf(month);

    if (monthIndex < 0)
      return respond({ error: 'Invalid month: ' + month });
    if (isNaN(year) || year < 2000 || year > 2100)
      return respond({ error: 'Invalid year: ' + year });

    var dpUrl = buildDpUrl(month, year);

    // ── Step 1: Update IMPORTXML formula if the sheet has one ────────────
    var updated = updateImportXmlInSheet(dpUrl);
    if (updated) Utilities.sleep(WAIT_MS);

    // ── Step 2: Try reading from the sheet first ─────────────────────────
    var festivals = readAllFromSheet(monthIndex, year);

    // ── Step 3: Fall back to direct HTTP + HTML parsing ──────────────────
    if (!festivals || festivals.length === 0) {
      festivals = fetchDirectly(dpUrl, monthIndex, year);
    }

    return respond(festivals || []);

  } catch (err) {
    return respond({ error: err.message });
  }
}

// ─── Build Drik Panchang URL ──────────────────────────────────────────────────
function buildDpUrl(month, year) {
  return 'https://www.drikpanchang.com/festivals/month/festivals-'
         + month + '.html?year=' + year;
}

// ─── Update IMPORTXML formulas in the sheet ───────────────────────────────────
function updateImportXmlInSheet(newDpUrl) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    var rows  = Math.min(sheet.getLastRow(), 5);
    var cols  = Math.min(sheet.getLastColumn(), 6);
    var updated = false;

    for (var r = 1; r <= rows; r++) {
      for (var c = 1; c <= cols; c++) {
        var cell    = sheet.getRange(r, c);
        var formula = cell.getFormula();
        if (!formula) continue;
        if (formula.toUpperCase().indexOf('IMPORTXML') === -1) continue;
        if (formula.indexOf('drikpanchang.com') === -1) continue;

        var newFormula = formula.replace(
          /https?:\/\/www\.drikpanchang\.com\/festivals\/month\/festivals-[a-z]+\.html\?year=\d{4}/gi,
          newDpUrl
        );
        if (newFormula !== formula) {
          cell.setFormula(newFormula);
          updated = true;
        }
      }
    }

    if (updated) SpreadsheetApp.flush();
    return updated;
  } catch (e) {
    return false;
  }
}

// ─── Read all rows from sheet ─────────────────────────────────────────────────
function readAllFromSheet(monthIndex, year) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    if (!sheet) return null;

    var lastRow = sheet.getLastRow();
    if (lastRow < DATA_START_ROW) return null;

    var numRows = lastRow - DATA_START_ROW + 1;
    var data    = sheet.getRange(DATA_START_ROW, 1, numRows, 3).getValues();

    var festivals = [];
    for (var i = 0; i < data.length; i++) {
      var name  = String(data[i][0] || '').trim();
      var dVal  = data[i][1];
      var tithi = String(data[i][2] || '').trim();

      if (!name || name.toLowerCase() === 'festival name') continue;

      var dateStr = parseDateFlexible(dVal, monthIndex, year);
      if (!dateStr) continue;

      festivals.push({ festivalName: name, date: dateStr, tithi: tithi || null });
    }

    return festivals.length > 0 ? festivals : null;
  } catch (sheetErr) {
    return null;
  }
}

// ─── Flexible date parser ─────────────────────────────────────────────────────
function parseDateFlexible(val, fallbackMonth, fallbackYear) {
  if (!val && val !== 0) return null;

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    try { return Utilities.formatDate(val, 'UTC', 'yyyy-MM-dd'); }
    catch (_) { return makeDate(val.getUTCFullYear() || fallbackYear, val.getUTCMonth() >= 0 ? val.getUTCMonth() : fallbackMonth, val.getUTCDate() || 1); }
  }

  var s = String(val).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  var slashParts = s.split(/[\/\-]/);
  if (slashParts.length === 3 && slashParts[0].length <= 2) {
    var candidate = slashParts[2] + '-' + pad(slashParts[1]) + '-' + pad(slashParts[0]);
    var td = new Date(candidate);
    if (!isNaN(td.getTime())) return candidate;
  }

  var nd = new Date(s);
  if (!isNaN(nd.getTime()) && nd.getFullYear() > 2000) {
    try { return Utilities.formatDate(nd, 'UTC', 'yyyy-MM-dd'); }
    catch (_) { return makeDate(nd.getUTCFullYear(), nd.getUTCMonth(), nd.getUTCDate()); }
  }

  var dayOnly = parseInt(s, 10);
  if (!isNaN(dayOnly) && dayOnly >= 1 && dayOnly <= 31 && String(dayOnly) === s.replace(/^0+/, '')) {
    return makeDate(fallbackYear, fallbackMonth, dayOnly);
  }

  return null;
}

// ─── Direct Drik Panchang HTTP fetch ─────────────────────────────────────────
function fetchDirectly(dpUrl, monthIndex, year) {
  try {
    var resp = UrlFetchApp.fetch(dpUrl, {
      method:             'get',
      muteHttpExceptions: true,
      followRedirects:    true,
      headers: {
        'User-Agent':     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
        'Accept':         'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language':'en-US,en;q=0.9',
        'Referer':        'https://www.drikpanchang.com/'
      }
    });

    if (resp.getResponseCode() !== 200) return [];
    return parseHtml(resp.getContentText(), monthIndex, year);
  } catch (fetchErr) {
    return [];
  }
}

// ─── HTML parser — uses actual Drik Panchang class structure ─────────────────
//
// Page structure:
//   <div class="dpEventInfo">
//     <div class="dpEventName dpHinduEventColor">Festival Name</div>
//     <div class="dpEventGregDate">June 1, 2026, Monday</div>
//     Tithi text here
//   </div>
//
function parseHtml(html, monthIndex, year) {
  var festivals = [];

  var MONTH_NAMES_FULL = [
    'january','february','march','april','may','june',
    'july','august','september','october','november','december'
  ];

  var containers = extractClassBlocks(html, 'dpEventInfo');

  for (var i = 0; i < containers.length; i++) {
    var block = containers[i];

    // ── Extract festival name from dpEventName element ──────────────────
    var nameRe    = /class="dpEventName[^"]*"[^>]*>([\s\S]*?)<\/div>/i;
    var nameMatch = nameRe.exec(block);
    if (!nameMatch) continue;
    var festivalName = stripTags(nameMatch[1]).replace(/\s+/g, ' ').trim();
    if (!festivalName) continue;

    // ── Extract date text from dpEventGregDate element ──────────────────
    var dateRe    = /class="dpEventGregDate"[^>]*>([\s\S]*?)<\/div>/i;
    var dateMatch = dateRe.exec(block);
    if (!dateMatch) continue;
    var dateText = stripTags(dateMatch[1]).replace(/\s+/g, ' ').trim();
    // dateText is like: "June 1, 2026, Monday"

    // Parse "Month Day, Year" — ignore trailing day-of-week
    var dm = dateText.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
    if (!dm) continue;

    var mIdx = -1;
    var mLower = dm[1].toLowerCase();
    for (var mi = 0; mi < MONTH_NAMES_FULL.length; mi++) {
      if (MONTH_NAMES_FULL[mi] === mLower) { mIdx = mi; break; }
    }
    if (mIdx < 0) continue;

    var dateStr = makeDate(parseInt(dm[3], 10), mIdx, parseInt(dm[2], 10));
    if (!dateStr) continue;

    // ── Extract tithi — text remaining after removing the two inner divs ─
    var tithiBlock = block
      .replace(/<div[^>]*class="dpEventName[^"]*"[^>]*>[\s\S]*?<\/div>/i, '')
      .replace(/<div[^>]*class="dpEventGregDate"[^>]*>[\s\S]*?<\/div>/i, '');
    var tithi = stripTags(tithiBlock).replace(/\s+/g, ' ').trim() || null;

    festivals.push({ festivalName: festivalName, date: dateStr, tithi: tithi });
  }

  // Deduplicate by date + name
  var seen = Object.create(null);
  return festivals.filter(function(f) {
    var key = f.date + '|' + f.festivalName.toLowerCase();
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

// ─── Extract inner HTML of elements matching a CSS class ─────────────────────
// Handles class="dpEventInfo" — finds the opening tag, then walks
// div open/close depth to locate the matching closing </div>.
function extractClassBlocks(html, className) {
  var results   = [];
  var searchStr = 'class="' + className + '"';
  var idx       = 0;

  while (true) {
    var start = html.indexOf(searchStr, idx);
    if (start < 0) break;

    var tagEnd = html.indexOf('>', start);
    if (tagEnd < 0) break;

    var depth   = 1;
    var pos     = tagEnd + 1;
    var content = '';

    while (pos < html.length && depth > 0) {
      if (html.substr(pos, 5).toLowerCase() === '<div ') { depth++; pos += 5; continue; }
      if (html.substr(pos, 4).toLowerCase() === '<div') {
        // Make sure it's not </div or <divide… etc.
        var ch = html.charAt(pos + 4);
        if (ch === '>' || ch === ' ') { depth++; pos += 4; continue; }
      }
      if (html.substr(pos, 6).toLowerCase() === '</div>') {
        depth--;
        if (depth === 0) {
          content = html.substring(tagEnd + 1, pos);
          break;
        }
        pos += 6; continue;
      }
      pos++;
    }

    if (content) results.push(content);
    idx = (pos > idx) ? pos + 1 : idx + 1;
  }

  return results;
}

function stripTags(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeDate(year, monthIndex, day) {
  if (!day || day < 1 || day > 31) return null;
  var candidate = year + '-' + pad(monthIndex + 1) + '-' + pad(day);
  var dt = new Date(candidate);
  if (isNaN(dt.getTime()) || dt.getUTCMonth() !== monthIndex) return null;
  return candidate;
}

function pad(n) { return n < 10 ? '0' + n : String(n); }

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
