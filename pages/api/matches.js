import { todayISO } from '../../lib/dates';
import { loadFixtures, filterForTeams, parseTeams } from '../../lib/fixtures';

export default function handler(req, res) {
  const { teams, limit = 20 } = req.query;
  if (!teams) return res.status(400).json({ error: 'No teams' });

  const selected = parseTeams(teams);
  if (!selected) return res.status(400).json({ error: 'Invalid teams' });

  const today = todayISO();
  const fixtures = loadFixtures();

  const filtered = filterForTeams(fixtures, selected)
    .filter(f => (f.endDate || f.date) >= today)
    .slice(0, parseInt(limit));

  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  res.status(200).json({ matches: filtered });
}
