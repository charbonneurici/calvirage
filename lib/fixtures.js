import path from 'path';
import fs from 'fs';

export function loadFixtures() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'fixtures.json');
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')).matches || [];
  } catch {
    return [];
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
  const follows = f => selected.has(f.home) || selected.has(f.away);

  const families = new Set(
    fixtures.filter(f => follows(f) && !isTbd(f)).map(f => compFamily(f.comp))
  );

  return fixtures.filter(f =>
    follows(f) || (isTbd(f) && families.has(compFamily(f.comp)))
  );
}
