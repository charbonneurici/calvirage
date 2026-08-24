import { loadFixtures, filterForTeams, parseTeams, calendarName, shortMatchLabel } from '../../lib/fixtures';

const pad = n => n.toString().padStart(2, '0');

// Horaire pas encore fixé (null, "-", "à confirmer"…) → 15:00 par défaut.
// Le flux étant rafraîchi toutes les 12h, l'heure réelle arrive dès sa publication.
const DEFAULT_TIME = '15:00';
function safeTime(timeStr) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(timeStr || '') ? timeStr : DEFAULT_TIME;
}

function formatDt(dateStr, timeStr) {
  const [h, m] = safeTime(timeStr).split(':');
  return `${dateStr.replace(/-/g, '')}T${h}${m}00`;
}

function addHours(dateStr, timeStr, hours) {
  const dt = new Date(`${dateStr}T${safeTime(timeStr)}:00`);
  dt.setTime(dt.getTime() + hours * 3600 * 1000);
  return `${dt.getFullYear()}${pad(dt.getMonth()+1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

// Le round vaut un numéro (Top 14), un libellé (EPCR, phases finales) ou rien (sélections).
// On l'omet quand la compétition le répète déjà ("Top 14 — Finale" + round "finale").
function roundLabel(round, comp) {
  if (round === null || round === undefined || round === '') return '';
  if (typeof round === 'number') return ` — J${round}`;
  return comp?.toLowerCase().endsWith(round.toLowerCase()) ? '' : ` — ${round}`;
}

const ymd = d => d.replace(/-/g, '');

function nextDay(dateStr) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function esc(str) {
  return (str || '').replace(/[\\;,]/g, m => `\\${m}`).replace(/\n/g, '\\n');
}


export default function handler(req, res) {
  const { teams } = req.query;
  if (!teams) return res.status(400).send('No teams selected');

  const selected = parseTeams(teams);
  if (!selected) return res.status(400).send('Invalid teams parameter');

  const fixtures = loadFixtures();
  const filtered = filterForTeams(fixtures, selected);

  // Le nom du calendrier est ce qu'on lit dans la barre latérale de son agenda,
  // et ce à quoi on assigne une couleur : il doit décrire l'abonnement.
  const name = calendarName(selected);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CalVirage//Rugby//FR',
    `X-WR-CALNAME:${esc(name)}`,
    `X-WR-CALDESC:${esc(name)} — calvirage.vercel.app`,
    'X-WR-TIMEZONE:Europe/Paris',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'REFRESH-INTERVAL;VALUE=DURATION:PT12H',
    'X-PUBLISHED-TTL:PT12H',
  ];

  filtered.forEach(f => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${f.id}@calvirage.fr`);
    const isTbd = f.home === 'tbd' || f.away === 'tbd';
    // Pour un match sans affiche, le tour passe devant : c'est l'info qui
    // distingue, et elle survit à la troncature en vue mois.
    const summary = isTbd
      ? `🏉 ${esc(f.round ? `${f.round} — ${f.comp}` : f.comp)}`
      : `🏉 ${esc(shortMatchLabel(f))}`;
    lines.push(`SUMMARY:${summary}`);
    if (f.allDay) {
      // DTEND est exclusif : il faut le lendemain du dernier jour de la fenêtre
      lines.push(`DTSTART;VALUE=DATE:${ymd(f.date)}`);
      lines.push(`DTEND;VALUE=DATE:${ymd(nextDay(f.endDate || f.date))}`);
    } else {
      lines.push(`DTSTART;TZID=Europe/Paris:${formatDt(f.date, f.time)}`);
      lines.push(`DTEND;TZID=Europe/Paris:${addHours(f.date, f.time, 2)}`);
    }
    if (f.venue) lines.push(`LOCATION:${esc(f.venue)}`);
    lines.push(f.allDay
      ? `DESCRIPTION:Si la France est qualifiée.\\nAffiche et horaire connus après les poules.`
      : `DESCRIPTION:${esc(f.homeName || f.home)} - ${esc(f.awayName || f.away)}\\n${esc(f.comp)}${roundLabel(f.round, f.comp)}`);
    lines.push(f.allDay ? 'STATUS:TENTATIVE' : 'STATUS:CONFIRMED');
    // Alerte la veille à 18h — sans objet pour un repère qui couvre un week-end
    if (!f.allDay) {
      const matchDate = new Date(`${f.date}T${safeTime(f.time)}:00`);
      const eve = new Date(matchDate);
      eve.setDate(eve.getDate() - 1);
      eve.setHours(18, 0, 0, 0);
      const eveDt = `${eve.getFullYear()}${pad(eve.getMonth()+1)}${pad(eve.getDate())}T180000`;
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push(`TRIGGER;VALUE=DATE-TIME:${eveDt}`);
      lines.push(`DESCRIPTION:🏉 Match demain — ${isTbd ? esc(f.comp) : esc(shortMatchLabel(f))}`);
      lines.push('END:VALARM');
    }
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(lines.join('\r\n'));
}
