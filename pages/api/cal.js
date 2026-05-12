import path from 'path';
import fs from 'fs';

const pad = n => n.toString().padStart(2, '0');

function formatDt(dateStr, timeStr) {
  const [h, m] = (timeStr || '15:00').split(':');
  return `${dateStr.replace(/-/g, '')}T${(h||'15').padStart(2,'0')}${(m||'00').padStart(2,'0')}00`;
}

function addHours(dateStr, timeStr, hours) {
  const dt = new Date(`${dateStr}T${timeStr || '15:00'}:00`);
  dt.setTime(dt.getTime() + hours * 3600 * 1000);
  return `${dt.getFullYear()}${pad(dt.getMonth()+1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

function esc(str) {
  return (str || '').replace(/[\\;,]/g, m => `\\${m}`).replace(/\n/g, '\\n');
}

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
  const { teams } = req.query;
  if (!teams) return res.status(400).send('No teams selected');

  let selected;
  try {
    selected = new Set(Buffer.from(teams, 'base64').toString().split(',').map(t => t.trim()));
  } catch {
    return res.status(400).send('Invalid teams parameter');
  }

  const fixtures = loadFixtures();
  const filtered = fixtures.filter(f => selected.has(f.home) || selected.has(f.away));

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CalVirage//Rugby//FR',
    'X-WR-CALNAME:CalVirage 🏉',
    'X-WR-CALDESC:Top 14 — CalVirage',
    'X-WR-TIMEZONE:Europe/Paris',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'REFRESH-INTERVAL;VALUE=DURATION:PT12H',
    'X-PUBLISHED-TTL:PT12H',
  ];

  filtered.forEach(f => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${f.id}@calvirage.fr`);
    lines.push(`SUMMARY:🏉 ${esc(f.homeName || f.home)} - ${esc(f.awayName || f.away)}`);
    lines.push(`DTSTART;TZID=Europe/Paris:${formatDt(f.date, f.time)}`);
    lines.push(`DTEND;TZID=Europe/Paris:${addHours(f.date, f.time, 2)}`);
    if (f.venue) lines.push(`LOCATION:${esc(f.venue)}`);
    lines.push(`DESCRIPTION:${esc(f.comp)} — J${f.round || ''}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(lines.join('\r\n'));
}
