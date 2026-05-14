import path from 'path';
import fs from 'fs';

function loadFixtures() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'fixtures.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw).matches || [];
  } catch {
    return [];
  }
}

export default function handler(req, res) {
  const { teams, limit = 20 } = req.query;
  if (!teams) return res.status(400).json({ error: 'No teams' });

  let selected;
  try {
    selected = new Set(Buffer.from(teams, 'base64').toString().split(',').map(t => t.trim()));
  } catch {
    return res.status(400).json({ error: 'Invalid teams' });
  }

  const today = new Date().toISOString().slice(0, 10);
  const fixtures = loadFixtures();

  const hasTop14 = fixtures.some(f =>
    (selected.has(f.home) || selected.has(f.away)) && f.comp?.startsWith('Top 14')
  );

  const filtered = fixtures
    .filter(f =>
      selected.has(f.home) || selected.has(f.away) ||
      (hasTop14 && (f.home === 'tbd' || f.away === 'tbd'))
    )
    .filter(f => f.date >= today)
    .slice(0, parseInt(limit));

  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  res.status(200).json({ matches: filtered });
}
