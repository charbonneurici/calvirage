/**
 * Scraper LNR Top 14 — parse le HTML rendu côté serveur.
 * Sélectionne chaque journée via le select Vue, puis extrait
 * date/heure/équipes depuis les éléments DOM.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SEASON = '2025-2026';
const TOTAL_ROUNDS = 26;
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'fixtures.json');

const VENUES = {
  'toulouse':          'Stade Ernest-Wallon, Toulouse',
  'la-rochelle':       'Stade Marcel-Deflandre, La Rochelle',
  'bordeaux-begles':   'Stade Chaban-Delmas, Bordeaux',
  'toulon':            'Stade Mayol, Toulon',
  'racing-92':         'Paris La Défense Arena, Nanterre',
  'stade-francais':    'Stade Jean-Bouin, Paris',
  'paris':             'Stade Jean-Bouin, Paris',
  'clermont-auvergne': 'Stade Marcel-Michelin, Clermont-Ferrand',
  'clermont':          'Stade Marcel-Michelin, Clermont-Ferrand',
  'lyon':              'Matmut Stadium, Lyon',
  'castres':           'Stade Pierre-Fabre, Castres',
  'pau':               'Stade du Hameau, Pau',
  'bayonne':           'Stade Jean-Dauger, Bayonne',
  'perpignan':         'Stade Aimé-Giral, Perpignan',
  'montpellier':       'GGL Stadium, Montpellier',
  'montauban':         'Stade Sapiac, Montauban',
};

const CLUB_ID_MAP = {
  'stade toulousain':          'toulouse',
  'stade rochelais':           'larochelle',
  'union bordeaux-bègles':     'bordeaux',
  'union bordeaux begles':     'bordeaux',
  'rc toulon':                 'toulon',
  'racing 92':                 'racing92',
  'stade français paris':      'stadefrancais',
  'stade francais paris':      'stadefrancais',
  'asm clermont auvergne':     'clermont',
  'asm clermont':              'clermont',
  'lyon ou':                   'lyon',
  'lou rugby':                 'lyon',
  'castres olympique':         'castres',
  'section paloise':           'pau',
  'aviron bayonnais':          'bayonne',
  'usa perpignan':             'perpignan',
  'montpellier hérault rugby': 'montpellier',
  'montpellier herault rugby': 'montpellier',
  'us montauban':              'montauban',
};

const FRENCH_MONTHS = {
  'janvier': '01', 'fevrier': '02', 'mars': '03', 'avril': '04',
  'mai': '05', 'juin': '06', 'juillet': '07', 'aout': '08',
  'septembre': '09', 'octobre': '10', 'novembre': '11', 'decembre': '12',
  'février': '02', 'août': '08', 'décembre': '12',
};

function toTeamId(name) {
  if (!name) return 'unknown';
  const key = name.toLowerCase()
    .replace(/[éèêë]/g, 'e').replace(/[àâä]/g, 'a')
    .replace(/[ùûü]/g, 'u').replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o').replace(/ç/g, 'c')
    .trim();
  for (const [k, v] of Object.entries(CLUB_ID_MAP)) {
    const nk = k.replace(/[éèêë]/g, 'e').replace(/[àâä]/g, 'a')
      .replace(/ç/g, 'c').replace(/[ùû]/g, 'u');
    if (key === nk || key.includes(nk) || nk.includes(key)) return v;
  }
  console.warn(`  ⚠️  Non mappé: "${name}"`);
  return name.toLowerCase().replace(/\s+/g, '-');
}

function normStr(s) {
  return s.toLowerCase()
    .replace(/[éèêë]/g, 'e').replace(/[àâä]/g, 'a')
    .replace(/[ùûü]/g, 'u').replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o').replace(/ç/g, 'c');
}

function parseFrenchDate(text) {
  // "samedi 16 mai" or "SAMEDI 20 DÉCEMBRE" or "DIMANCHE 01 FÉVRIER"
  const t = normStr(text).trim();
  const m = t.match(/(\d{1,2})\s+([a-z]+)/);
  if (!m) return null;
  const day = m[1].padStart(2, '0');
  const month = FRENCH_MONTHS[m[2]];
  if (!month) return null;
  const year = parseInt(month) >= 7 ? 2025 : 2026;
  return `${year}-${month}-${day}`;
}

function parseTime(t) {
  if (!t) return '15:00';
  return t.replace('h', ':').trim();
}

function venueFromLink(href) {
  if (!href) return null;
  // /feuille-de-match/2025-2026/j1/11311-paris-montauban
  const m = href.match(/\/j\d+\/\d+-(.+)$/);
  if (!m) return null;
  const parts = m[1].split('-');
  // Try progressively longer prefixes
  for (let len = parts.length - 1; len >= 1; len--) {
    const slug = parts.slice(0, len).join('-');
    if (VENUES[slug]) return VENUES[slug];
  }
  return null;
}

function matchIdFromLink(href) {
  if (!href) return null;
  const m = href.match(/\/(\d+)-[^/]+$/);
  return m ? m[1] : null;
}

async function extractRoundData(page) {
  return page.evaluate(() => {
    const inner = document.querySelector('.calendar-results__inner');
    if (!inner) return [];

    const result = [];
    let currentDate = null;

    for (const child of inner.children) {
      // Date header
      if (child.className?.includes('fixture-date')) {
        currentDate = child.innerText.trim();
        continue;
      }

      // Match line
      if (child.className?.includes('calendar-results__line')) {
        const matchLine = child.querySelector('.match-line');
        if (!matchLine) continue;

        // Teams: home = first club-line--reversed, away = second club-line
        const homeImg = matchLine.querySelector('.club-line--reversed img');
        const awayImg = matchLine.querySelector('.club-line:not(.club-line--reversed) img');
        const home = homeImg?.alt?.trim() || '';
        const away = awayImg?.alt?.trim() || '';

        // Time
        const timeEl = matchLine.querySelector('.match-line__time');
        const time = timeEl?.innerText?.trim() || '';

        // Match link
        const linkEl = child.querySelector('a[href*="feuille-de-match"]');
        const href = linkEl?.href || '';

        result.push({ date: currentDate, home, away, time, href });
      }
    }
    return result;
  });
}

async function main() {
  console.log(`\n🏉 Scraper CalVirage — Top 14 ${SEASON}\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });

  console.log('📡 Chargement...');
  await page.goto('https://top14.lnr.fr/calendrier-et-resultats', {
    waitUntil: 'networkidle',
    timeout: 45000,
  });
  await page.waitForTimeout(3000);

  // Récupérer les options disponibles
  const journeeOptions = await page.evaluate(() => {
    const sel = document.getElementById('Journée') || [...document.querySelectorAll('select')].find(s =>
      [...s.options].some(o => o.text.match(/^J\d+/))
    );
    if (!sel) return [];
    return [...sel.options].map((o, i) => ({ index: i, text: o.text.trim() }));
  });

  if (journeeOptions.length === 0) {
    await page.screenshot({ path: '/tmp/lnr-no-select.png', fullPage: true });
    console.error('❌ Select non trouvé. Screenshot: /tmp/lnr-no-select.png');
    await browser.close();
    process.exit(1);
  }

  console.log(`📋 ${journeeOptions.length} options: ${journeeOptions.map(o => o.text).join(', ')}\n`);

  const allMatches = [];
  const seenIds = new Set();

  for (const opt of journeeOptions) {
    const roundNum = parseInt(opt.text.replace(/[^\d]/g, ''));
    if (!roundNum || roundNum > TOTAL_ROUNDS) continue;

    process.stdout.write(`  J${String(roundNum).padStart(2)}... `);

    try {
      await page.locator('#Journée').selectOption({ label: opt.text });
      await page.waitForTimeout(2000);
    } catch (e) {
      // Page may reload on last selection — wait and re-check
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000);
    }

    const rows = await extractRoundData(page).catch(() => []);

    let added = 0;
    for (const row of rows) {
      if (!row.home || !row.away) continue;

      const matchId = matchIdFromLink(row.href);
      const uid = matchId || `${roundNum}-${row.home}-${row.away}`;
      if (seenIds.has(uid)) continue;
      seenIds.add(uid);

      const date = parseFrenchDate(row.date || '');
      if (!date) {
        console.warn(`  ⚠️  Date non parsée: "${row.date}" pour ${row.home} vs ${row.away}`);
        continue;
      }

      allMatches.push({
        id:       matchId ? `lnr-${matchId}` : `lnr-j${roundNum}-${toTeamId(row.home)}-${toTeamId(row.away)}`,
        round:    roundNum,
        comp:     'Top 14',
        home:     toTeamId(row.home),
        away:     toTeamId(row.away),
        homeName: row.home,
        awayName: row.away,
        date,
        time:     parseTime(row.time),
        venue:    venueFromLink(row.href),
        status:   row.time ? 'scheduled' : 'played',
      });
      added++;
    }

    console.log(`${added} matchs ✅${rows.length === 0 ? ' (page vide?)' : ''}`);
  }

  await browser.close();

  allMatches.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  console.log(`\n✅ Total: ${allMatches.length} matchs`);

  if (allMatches.length === 0) {
    console.error('\n❌ Aucun match extrait. Vérifier le HTML de la page.');
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
    updatedAt: new Date().toISOString(),
    season: SEASON,
    matches: allMatches,
  }, null, 2));

  console.log(`💾 Sauvegardé: ${OUTPUT_FILE}\n`);
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
