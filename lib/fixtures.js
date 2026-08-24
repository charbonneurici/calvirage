import path from 'path';
import fs from 'fs';
import { RUGBY_TEAMS } from './rugby';

export function loadFixtures() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'fixtures.json');
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')).matches || [];
  } catch {
    return [];
  }
}

// Jeton d'abonnement à tout le rugby français. Un abonné "tout" suit les
// compétitions, pas une liste d'équipes figée : quand Vannes remplace Montauban
// en Top 14, son calendrier suit sans qu'il ait à se réabonner.
export const ALL = 'all';

export function parseTeams(raw) {
  if (raw === ALL) return ALL;
  try {
    const ids = Buffer.from(raw, 'base64').toString()
      .split(',').map(t => t.trim()).filter(Boolean);
    return ids.length ? new Set(ids) : null;
  } catch {
    return null;
  }
}

// "Top 14 — Finale" et "Top 14" sont la même compétition
function compFamily(comp) {
  return (comp || '').split(' — ')[0];
}

const isTbd = f => f.home === 'tbd' || f.away === 'tbd';

/**
 * Les matchs dont l'affiche n'est pas connue — phases finales du Top 14,
 * repères des phases finales de la Coupe du monde — n'ont pas d'équipe à
 * laquelle se rattacher. On les livre à qui suit déjà la compétition.
 */
export function filterForTeams(fixtures, selected) {
  if (selected === ALL) return fixtures;

  const follows = f => selected.has(f.home) || selected.has(f.away);

  const families = new Set(
    fixtures.filter(f => follows(f) && !isTbd(f)).map(f => compFamily(f.comp))
  );

  return fixtures.filter(f =>
    follows(f) || (isTbd(f) && families.has(compFamily(f.comp)))
  );
}

/**
 * Nom du calendrier tel qu'il apparaît dans la barre latérale d'un agenda —
 * c'est aussi ce à quoi on assigne une couleur. Il doit donc décrire
 * l'abonnement, sinon deux calendriers CalVirage sont indistinguables.
 */
export function calendarName(selected) {
  if (selected === ALL) return '🏉 Tout le rugby français';

  const names = RUGBY_TEAMS.filter(t => selected.has(t.id)).map(t => t.name);
  if (names.length === 0) return '🏉 CalVirage';
  if (names.length === 1) return `🏉 ${names[0]}`;
  if (names.length === 2) return `🏉 ${names.join(' & ')}`;
  return `🏉 Rugby — ${names.length} équipes`;
}

const SHORT_NAMES = new Map(RUGBY_TEAMS.map(t => [t.id, t.name]));

/**
 * Titre d'événement court. Les noms officiels montent à 46 caractères
 * ("Montpellier Hérault Rugby - Section Paloise") : illisible dans une vue
 * journée où sept matchs du samedi se chevauchent. Le nom complet reste dans
 * la description de l'événement.
 */
export function shortMatchLabel(f) {
  // Le plus court des deux libellés : "Toulouse" plutôt que "Stade Toulousain",
  // mais "France" plutôt que "XV de France".
  const pick = (id, full) => {
    const short = SHORT_NAMES.get(id);
    if (!short) return full || id;
    if (!full) return short;
    return short.length <= full.length ? short : full;
  };
  return `${pick(f.home, f.homeName)} - ${pick(f.away, f.awayName)}`;
}
