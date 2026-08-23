#!/usr/bin/env node
/**
 * Scraper XV de France — deux sources, une compétition chacune.
 *
 *   sixnationsrugby.com  → Tournoi des 6 Nations
 *   API ESPN             → Nations Championship, Coupe du monde
 *
 * Le Tournoi ne vient pas d'ESPN : ESPN ne charge les affiches que quelques
 * semaines avant le coup d'envoi, alors que le site officiel les publie près
 * d'un an à l'avance. Une source unique par compétition évite d'avoir à
 * dédoublonner et garde les UID stables côté agendas abonnés.
 *
 * Pour les compétitions ESPN, une saison pas encore publiée renvoie 0
 * événement : le scraper l'ignore et la reprendra au run suivant.
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
  { id: 164205, comp: 'Coupe du monde' },
];

const SIX_NATIONS = 'https://www.sixnationsrugby.com/en/m6n/fixtures';

// Le site officiel donne l'heure locale du stade : il faut le fuseau du pays hôte
const SIX_NATIONS_TEAMS = {
  france:   { id: 'france',   name: 'France',         tz: 'Europe/Paris'  },
  italy:    { id: 'italy',    name: 'Italie',         tz: 'Europe/Rome'   },
  england:  { id: 'england',  name: 'Angleterre',     tz: 'Europe/London' },
  scotland: { id: 'scotland', name: 'Écosse',         tz: 'Europe/London' },
  wales:    { id: 'wales',    name: 'Pays de Galles', tz: 'Europe/London' },
  ireland:  { id: 'ireland',  name: 'Irlande',        tz: 'Europe/Dublin' },
};

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

// Décalage du fuseau `tz` à un instant donné
function tzOffsetMs(date, tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(date).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day,
    parts.hour % 24, parts.minute, parts.second);
  return asUtc - date.getTime();
}

// "16h40 heure de Cardiff" → l'instant correspondant.
// Deux passes : le décalage dépend de l'instant qu'on cherche justement à établir.
function wallTimeToDate(year, month, day, hour, minute, tz) {
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  let ts = naive;
  for (let i = 0; i < 2; i++) ts = naive - tzOffsetMs(new Date(ts), tz);
  return new Date(ts);
}

/**
 * Le site officiel encode tout dans l'URL de chaque match :
 *   /en/m6n/fixtures/202700/france-v-wales-06022027-1640/
 * soit domicile, extérieur, JJMMAAAA et l'heure LOCALE du stade.
 * Le stade lui-même est le dernier annoncé avant le lien dans la page.
 */
async function fetchSixNations(season) {
  const res = await fetch(`${SIX_NATIONS}/${season}00`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CalVirage/1.0)' },
  });
  if (!res.ok) throw new Error(`Six Nations HTTP ${res.status}`);
  const html = await res.text();

  const venues = [...html.matchAll(/fixturesResultsCard_stadium__\w+\\?",\\?"children\\?":\\?"([^"\\]+)/g)]
    .map(m => ({ pos: m.index, name: m[1] }));

  const matches = [];
  const seen = new Set();

  for (const m of html.matchAll(/\/en\/m6n\/fixtures\/\d+\/([a-z-]+)-v-([a-z-]+)-(\d{2})(\d{2})(\d{4})-(\d{2})(\d{2})\//g)) {
    const [, homeSlug, awaySlug, dd, mm, yyyy, hh, min] = m;
    const home = SIX_NATIONS_TEAMS[homeSlug];
    const away = SIX_NATIONS_TEAMS[awaySlug];
    if (!home || !away) continue;
    if (home.id !== 'france' && away.id !== 'france') continue;

    const key = `${homeSlug}-${awaySlug}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const kickoff = wallTimeToDate(+yyyy, +mm, +dd, +hh, +min, home.tz);
    const { date, time } = toParis(kickoff.toISOString());

    const before = venues.filter(v => v.pos < m.index);
    const venue = before.length ? before[before.length - 1].name : null;

    matches.push({
      // Clé naturelle : survit à un report de date ou à un changement d'horaire
      id: `${ID_PREFIX}6n-${season}-${homeSlug}-${awaySlug}`,
      round: null,
      comp: 'Tournoi des 6 Nations',
      home: home.id,
      away: away.id,
      homeName: home.name,
      awayName: away.name,
      date,
      time,
      venue,
      status: 'scheduled',
    });
  }
  return matches;
}

/**
 * Phases finales de la Coupe du monde 2027 — repères de dates.
 *
 * Aucune source ne les publie sous forme de match tant que les poules ne sont
 * pas jouées : les affiches dépendent du classement. Le calendrier World Rugby,
 * lui, est fixé. On pose donc un repère par tour, en journée entière sur la
 * fenêtre du tour — un quart peut tomber le samedi ou le dimanche, annoncer
 * une heure précise serait faux une fois sur deux.
 *
 * Ces repères s'effacent d'eux-mêmes : dès qu'un vrai match de la France est
 * publié dans la fenêtre, le repère correspondant disparaît.
 */
const WORLD_CUP_KNOCKOUTS = [
  { key: 'huitiemes', round: 'Huitièmes de finale', from: '2027-10-23', to: '2027-10-24' },
  { key: 'quarts',    round: 'Quarts de finale',    from: '2027-10-30', to: '2027-10-31' },
  { key: 'demies',    round: 'Demi-finales',        from: '2027-11-05', to: '2027-11-06' },
  { key: 'finale',    round: 'Finale',              from: '2027-11-12', to: '2027-11-13' },
];

function worldCupPlaceholders(matches) {
  const worldCupDates = matches.filter(m => m.comp === 'Coupe du monde').map(m => m.date);
  if (worldCupDates.length === 0) return []; // la France n'est pas au tournoi

  return WORLD_CUP_KNOCKOUTS
    .filter(ko => !worldCupDates.some(d => d >= ko.from && d <= ko.to))
    .map(ko => ({
      id: `${ID_PREFIX}cdm2027-${ko.key}`,
      round: ko.round,
      comp: 'Coupe du monde',
      home: 'tbd',
      away: 'tbd',
      homeName: 'À déterminer',
      awayName: 'À déterminer',
      date: ko.from,
      endDate: ko.to,
      time: null,
      allDay: true,
      venue: null,
      status: 'tbd',
    }));
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
  console.log('\n🇫🇷 Scraper CalVirage — XV de France\n');

  const all = [];

  // Tournoi des 6 Nations — site officiel
  let sixNationsCount = 0;
  for (const season of SEASONS) {
    process.stdout.write(`  Tournoi des 6 Nations ${season}... `);
    try {
      const matches = await fetchSixNations(season);
      all.push(...matches);
      sixNationsCount += matches.length;
      console.log(`${matches.length} match${matches.length > 1 ? 's' : ''}`);
    } catch (e) {
      console.log(`⚠️  ${e.message}`);
    }
  }

  // Nations Championship & Coupe du monde — ESPN
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

  // La fusion remplace TOUS les matchs France : écrire sans le Tournoi
  // reviendrait à l'effacer du calendrier des abonnés.
  if (sixNationsCount === 0) {
    console.error('\n❌ Aucun match du Tournoi récupéré — on ne touche pas au fichier.');
    process.exit(1);
  }

  // Dédoublonnage (un même match peut remonter sur deux saisons ESPN)
  const byId = new Map(all.map(m => [m.id, m]));
  const franceMatches = [...byId.values()];

  const placeholders = worldCupPlaceholders(franceMatches);
  if (placeholders.length) {
    console.log(`  Repères phases finales CDM 2027... ${placeholders.length}`);
    franceMatches.push(...placeholders);
  }

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
