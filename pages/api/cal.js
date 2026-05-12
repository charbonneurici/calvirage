import { FIXTURES, TOP14_TEAMS } from '../../lib/rugby';

const pad = n => n.toString().padStart(2, '0');

function formatDt(dateStr, timeStr) {
  const [h, m] = (timeStr || '15:00').split(':');
  return `${dateStr.replace(/-/g, '')}T${h}${m}00`;
}

function addHours(dateStr, timeStr, hours) {
  const dt = new Date(`${dateStr}T${timeStr || '15:00'}:00`);
  dt.setTime(dt.getTime() + hours * 3600 * 1000);
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

function esc(str) {
  return (str || '').replace(/[\\;,]/g, m => `\\${m}`).replace(/\n/g, '\\n');
}

const teamName = id => TOP14_TEAMS.find(t => t.id === id)?.name ?? id;

export default function handler(req, res) {
  const { teams } = req.query;
  if (!teams) return res.status(400).send('No teams selected');

  let selected;
  try {
    selected = new Set(Buffer.from(teams, 'base64').toString().split(',').map(t => t.trim()));
  } catch {
    return res.status(400).send('Invalid teams parameter');
  }

  const filtered = FIXTURES.filter(f => selected.has(f.home) || selected.has(f.away));

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CalVirage//Rugby//FR',
    'X-WR-CALNAME:CalVirage 🏉',
    'X-WR-CALDESC:Top 14 · Champions Cup · Challenge Cup',
    'X-WR-TIMEZONE:Europe/Paris',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'REFRESH-INTERVAL;VALUE=DURATION:PT12H',
    'X-PUBLISHED-TTL:PT12H',
  ];

  filtered.forEach(f => {
    const home = teamName(f.home);
    const away = teamName(f.away);
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${f.id}@calvirage.fr`);
    lines.push(`SUMMARY:🏉 ${esc(home)} - ${esc(away)}`);
    lines.push(`DTSTART;TZID=Europe/Paris:${formatDt(f.date, f.time)}`);
    lines.push(`DTEND;TZID=Europe/Paris:${addHours(f.date, f.time, 2)}`);
    lines.push(`DESCRIPTION:${esc(f.comp)}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=43200, stale-while-revalidate=86400');
  res.status(200).send(lines.join('\r\n'));
}
