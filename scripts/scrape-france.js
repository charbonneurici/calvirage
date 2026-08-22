#!/usr/bin/env node
/**
 * Scraper XV de France — API ESPN (sports.core.api.espn.com)
 *
 * Agrège les matchs de l'équipe de France masculine sur trois compétitions :
 *   - Nations Championship (fenêtres de juillet et novembre)
 *   - Tournoi des Six Nations
 *   - Coupe du monde
 *
 * ESPN publie les calendriers au fil de l'eau : une saison sans match renvoie
 * simplement 0 événement, le scraper l'ignore et la reprendra au run suivant.
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'fixtures.json');
const CORE = 'https://sports.core.api.espn.com/v2/sports/rugby/leagues';
const FRANCE_TEAM_ID = '9';
const ID_PREFIX = 'fr-';

// Saisons interrogées : année en cours et les deux suivantes.
const YEAR = new Date().getFullYear();
const SEASONS = [YEAR, YEAR + 1, YEAR + 2];

const LEAGUES = [
  { id: 17567,  comp: 'Nations Championship' },
  { id: 180659, comp: 'Tournoi des 6 Nations' },
  { id: 164205, comp: 'Coupe du monde' },
];

// Noms ESPN (anglais) → noms français affichés
const NATIONS = {
  'France': 'France',
  'England': 'Angleterre',
  'Ireland': 'Irlande',
  'Scotland': 'Écosse',
  'Wales': 'Pays de Galles',
  'Italy': 'Italie',
  'South Africa': 'Afrique du Sud',
  'New Zealand': 'Nouvelle-Zélande',
  'Australia': 'Australie',
  'Argentina': 'Argentine',
  'Japan': 'Japon',
  'Fiji': 'Fidji',
  'Samoa': 'Samoa',
  'Tonga': 'Tonga',
  'Georgia': 'Géorgie',
  'Romania': 'Roumanie',
  'Portugal': 'Portugal',
  'Spain': 'Espagne',
  'Uruguay': 'Uruguay',
  'Chile': 'Chili',
  'Canada': 'Canada',
  'United States of America': 'États-Unis',
  'Hong Kong': 'Hong Kong',
  'Zimbabwe': 'Zimbabwe',
  'Namibia': 'Namibie',
};

function frName(englishName) {
  return NATIONS[englishName] || englishName;
}

function teamId(englishName) {
  return englishName === 'France'
    ? 'france'
    : englishName.toLowerCase().replace(/[^a-z]+/g, '');
}

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'CalVirage/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json();
}

// Un match ESPN a une date UTC ; on l'affiche en heure de Paris.
function toParis(isoUtc) {
  const d = new Date(isoUtc);
  const parts = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}`,
  };
}

const teamCache = new Map();
async function resolveTeam(ref) {
  if (!teamCache.has(ref)) {
    const t = await getJson(ref.replace(/^http:/, 'https:'));
    teamCache.set(ref, t.displayName || t.name);
  }
  return teamCache.get(ref);
}

async function fetchLeagueSeason(league, season) {
  let index;
  try {
    index = await getJson(`${CORE}/${league.id}/seasons/${season}/types/1/events?limit=100`);
  } catch {
    return []; // saison inexistante côté ESPN
  }
  if (!index.count) return [];

  const matches = [];
  for (const item of index.items) {
    const event = await getJson(item.$ref.replace(/^http:/, 'https:'));
    const competition = event.competitions?.[0];
    if (!competition) continue;

    const competitors = competition.competitors || [];
    if (!competitors.some(c => c.id === FRANCE_TEAM_ID)) continue;

    const home = competitors.find(c => c.homeAway === 'home') || competitors[0];
    const away = competitors.find(c => c.homeAway === 'away') || competitors[1];
    if (!home || !away) continue;

    const homeName = await resolveTeam(home.team.$ref);
    const awayName = await resolveTeam(away.team.$ref);
    const { date, time } = toParis(event.date);

    matches.push({
      id: `${ID_PREFIX}${event.id}`,
      round: null,
      comp: league.comp,
      home: teamId(homeName),
      away: teamId(awayName),
      homeName: frName(homeName),
      awayName: frName(awayName),
      date,
      time,
      venue: competition.venue
        ? [competition.venue.fullName, competition.venue.address?.city].filter(Boolean).join(', ')
        : null,
      status: 'scheduled',
    });
  }
  return matches;
}

async function main() {
  console.log('\n🇫🇷 Scraper CalVirage — XV de France (ESPN)\n');

  const all = [];
  for (const league of LEAGUES) {
    for (const season of SEASONS) {
      process.stdout.write(`  ${league.comp} ${season}... `);
      const matches = await fetchLeagueSeason(league, season);
      all.push(...matches);
      console.log(`${matches.length} match${matches.length > 1 ? 's' : ''}`);
    }
  }

  if (all.length === 0) {
    console.error('\n❌ Aucun match France trouvé — on ne touche pas au fichier.');
    process.exit(1);
  }

  // Dédoublonnage (un même match peut remonter sur deux saisons ESPN)
  const byId = new Map(all.map(m => [m.id, m]));
  const franceMatches = [...byId.values()];

  let existing = { season: '2026-2027', matches: [] };
  try {
    existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  } catch (e) {
    console.warn('⚠️  fixtures.json illisible, création:', e.message);
  }

  const others = (existing.matches || []).filter(m => !m.id?.startsWith(ID_PREFIX));
  const merged = [...others, ...franceMatches]
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
    ...existing,
    updatedAt: new Date().toISOString(),
    matches: merged,
  }, null, 2));

  console.log(`\n✅ ${franceMatches.length} matchs du XV de France`);
  console.log(`💾 Sauvegardé: ${OUTPUT_FILE}\n`);
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
