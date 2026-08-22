/**
 * Scraper CalVirage — Champions Cup & Challenge Cup (EPCR)
 * Lit le sitemap, scrape chaque page de match (HTML SSR, pas de JS requis).
 * Ne conserve que les matchs impliquant au moins un club français.
 */

const fs   = require('fs');
const path = require('path');

const OUTPUT_FILE  = path.join(__dirname, '..', 'data', 'fixtures.json');
const SITEMAP_URL  = 'https://www.epcrugby.com/matches-sitemap.xml';
const DELAY_MS     = 1200; // politesse

// EPCR slug → ID interne
const SLUG_MAP = {
  'stade-toulousain':          'toulouse',
  'stade-rochelais':           'larochelle',
  'union-bordeaux-begles':     'bordeaux',
  'rc-toulon':                 'toulon',
  'racing-92':                 'racing92',
  'stade-francais-paris':      'stadefrancais',
  'asm-clermont-auvergne':     'clermont',
  'asm-clermont':              'clermont',
  'lyon-o-u':                  'lyon',
  'lou-rugby':                 'lyon',
  'castres-olympique':         'castres',
  'section-paloise':           'pau',
  'aviron-bayonnais':          'bayonne',
  'usap':                      'perpignan',
  'usa-perpignan':             'perpignan',
  'montpellier-herault-rugby': 'montpellier',
  'rc-vannes':                 'vannes',
};

const FRENCH_IDS = new Set(Object.values(SLUG_MAP));
const EPCR_COMPS = new Set(['Champions Cup', 'Challenge Cup']);

const MONTHS_EN = {
  jan:'01', feb:'02', mar:'03', apr:'04', may:'05', jun:'06',
  jul:'07', aug:'08', sep:'09', oct:'10', nov:'11', dec:'12',
};

function parseEpcrDate(str) {
  // "Fri, 5 Dec 2025"  ou  "5 Dec 2025"
  const m = str.match(/(\d{1,2})\s+(\w{3,})\s+(\d{4})/);
  if (!m) return null;
  const day   = m[1].padStart(2, '0');
  const month = MONTHS_EN[m[2].toLowerCase().slice(0, 3)];
  return month ? `${m[3]}-${month}-${day}` : null;
}

// "Round 3" → 3 (rendu "J3" comme le Top 14) ; phases finales → libellé français
const KO_LABELS = {
  'round of 16':  '8es de finale',
  'quarter-final': 'Quart de finale',
  'quarter final': 'Quart de finale',
  'semi-final':   'Demi-finale',
  'semi final':   'Demi-finale',
  'final':        'Finale',
};

function parseRound(raw) {
  const label = raw.replace(/\s+/g, ' ').trim();
  const poolRound = label.match(/^Round\s*(\d+)$/i);
  if (poolRound) return parseInt(poolRound[1], 10);
  return KO_LABELS[label.toLowerCase()] || label;
}

function slugToId(slug) {
  return SLUG_MAP[slug] || slug; // garde le slug brut si club étranger
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CalVirage/1.0)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getMatchIds() {
  const xml  = await fetchText(SITEMAP_URL);
  const seen = new Set();
  const ids  = [];
  for (const [, url] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const m = url.match(/\/(champions-cup|challenge-cup)\/matches\/(\d+)\//);
    if (m && !seen.has(m[2])) {
      seen.add(m[2]);
      ids.push({ competition: m[1], id: m[2] });
    }
  }
  return ids;
}

async function scrapeMatch({ competition, id }) {
  const url  = `https://www.epcrugby.com/${competition}/matches/${id}/`;
  const html = await fetchText(url);

  // Noms d'équipes via le <title>
  const titleRaw  = (html.match(/<title>([^<]+)<\/title>/) || [])[1] || '';
  const vsMatch   = titleRaw.match(/^(.+?)\s+vs\.\s+(.+?)\s*\|/);
  const homeName  = vsMatch?.[1]?.trim() || '';
  const awayName  = vsMatch?.[2]?.trim() || '';

  // Slugs via les liens /clubs/
  const clubSlugs = [...html.matchAll(/href="[^"]*\/clubs\/([^"/]+)/g)].map(m => m[1]);
  const homeSlug  = clubSlugs[0] || '';
  const awaySlug  = clubSlugs[1] || '';

  // Texte brut pour date/heure/lieu/round
  const txt = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  // Bandeau du match : "Round 1 Fri, 16 Oct 2026 - 19:00 Kingsholm Stadium Attendance: -"
  const header = txt.match(
    /(Round of 16|Quarter[- ]?Final|Semi[- ]?Final|Final|Round\s*\d+)\s+(\w{3},\s*\d{1,2}\s+\w+\s+\d{4})\s*[-–]\s*(\d{2}:\d{2})\s+(.+?)\s+Attendance/i
  );

  const round = header ? parseRound(header[1]) : null;
  const date  = header ? parseEpcrDate(header[2]) : null;
  const time  = header?.[3] || null;
  const venue = header?.[4]?.trim() || null;

  const comp = competition === 'champions-cup' ? 'Champions Cup' : 'Challenge Cup';

  return { id, comp, homeName, awayName,
           home: slugToId(homeSlug), away: slugToId(awaySlug),
           date, time, round, venue };
}

async function main() {
  console.log('\n🏆 Scraper CalVirage — Champions Cup & Challenge Cup\n');

  // Charger les fixtures existantes : on ne remplace que les coupes d'Europe
  let existing = { matches: [] };
  try {
    existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  } catch { /* premier run */ }
  const others = (existing.matches || []).filter(m => !EPCR_COMPS.has(m.comp));
  console.log(`📂 ${others.length} matchs des autres compétitions conservés\n`);

  // Sitemap
  console.log('📡 Chargement du sitemap...');
  const matchIds = await getMatchIds();
  const cc  = matchIds.filter(m => m.competition === 'champions-cup').length;
  const chc = matchIds.filter(m => m.competition === 'challenge-cup').length;
  console.log(`📋 ${matchIds.length} matchs (${cc} CC + ${chc} ChC)\n`);

  const epcrMatches = [];

  for (const { competition, id } of matchIds) {
    const tag = competition === 'champions-cup' ? 'CC ' : 'ChC';
    process.stdout.write(`  ${tag} #${id}... `);

    try {
      const m = await scrapeMatch({ competition, id });

      // Garder seulement si au moins un club français
      if (!FRENCH_IDS.has(m.home) && !FRENCH_IDS.has(m.away)) {
        console.log('pas de club français — ignoré');
        await sleep(DELAY_MS);
        continue;
      }

      if (!m.date) {
        console.log('date manquante ⚠️');
        await sleep(DELAY_MS);
        continue;
      }

      epcrMatches.push({
        id:       `epcr-${id}`,
        round:    m.round,
        comp:     m.comp,
        home:     m.home,
        away:     m.away,
        homeName: m.homeName,
        awayName: m.awayName,
        date:     m.date,
        time:     m.time,
        venue:    m.venue,
        status:   'scheduled',
      });
      console.log(`${m.homeName} vs ${m.awayName} — ${m.date} ✅`);
    } catch (e) {
      console.log(`erreur: ${e.message.slice(0, 60)} ❌`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n✅ ${epcrMatches.length} matchs EPCR avec clubs français`);

  if (epcrMatches.length === 0) {
    console.error('\n❌ Aucun match EPCR extrait — on ne touche pas au fichier.');
    process.exit(1);
  }

  const all = [...others, ...epcrMatches]
    .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.time || '').localeCompare(b.time || ''));

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
    ...existing,
    updatedAt: new Date().toISOString(),
    matches:   all,
  }, null, 2));

  console.log(`💾 ${OUTPUT_FILE} — ${all.length} matchs total\n`);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
