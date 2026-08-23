import { useState } from 'react';
import { RUGBY_TEAMS, NATION_FLAGS } from './rugby';

const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS   = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  // Le calendrier couvre plusieurs saisons (Coupe du monde 2027) : on précise
  // l'année dès qu'elle diffère de l'année courante.
  const year = d.getFullYear() === new Date().getFullYear() ? '' : ` ${d.getFullYear()}`;
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}${year}`;
}

// "23–24 oct 2027" : deux jours possibles pour un même tour
export function formatRange(from, to) {
  const a = new Date(from + 'T12:00:00');
  const b = new Date(to + 'T12:00:00');
  const year = b.getFullYear() === new Date().getFullYear() ? '' : ` ${b.getFullYear()}`;
  if (a.getMonth() === b.getMonth()) {
    return `${a.getDate()}–${b.getDate()} ${MONTHS[b.getMonth()]}${year}`;
  }
  return `${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]}${year}`;
}

// Badge coloré par compétition
const COMP_STYLE = {
  'Top 14':               { bg: '#E63329', text: '#fff',   label: 'Top 14' },
  'Top 14 — Barrage':     { bg: '#111',    text: '#fff',   label: 'Barrage' },
  'Top 14 — Access':      { bg: '#111',    text: '#fff',   label: 'Access' },
  'Top 14 — Demi-Finale': { bg: '#111',    text: '#fff',   label: 'Demi-Finale' },
  'Top 14 — Finale':      { bg: '#111',    text: '#fff',   label: 'Finale' },
  'Champions Cup':        { bg: '#1B2B6B', text: '#fff',   label: 'Champions Cup' },
  'Challenge Cup':        { bg: '#E87722', text: '#fff',   label: 'Challenge Cup' },
  'Tournoi des 6 Nations': { bg: '#0A1D5C', text: '#fff',  label: '6 Nations' },
  'Nations Championship': { bg: '#1B4D3E', text: '#fff',   label: 'Nations Champ.' },
  'Coupe du monde':       { bg: '#B8860B', text: '#fff',   label: 'Coupe du monde' },
};

function getCompStyle(comp) {
  return COMP_STYLE[comp] || { bg: '#999', text: '#fff', label: comp };
}

function TeamLogo({ id, name, size = 20 }) {
  const [err, setErr] = useState(false);
  const team = RUGBY_TEAMS.find(t => t.id === id);
  // Sélections étrangères : pas de logo en base, on affiche le drapeau
  if ((!team || !team.logo || err) && NATION_FLAGS[id]) {
    return <span style={{ fontSize: size * 0.9, lineHeight: 1 }}>{NATION_FLAGS[id]}</span>;
  }
  if (!team || !team.logo || err) return null;
  return (
    <img src={team.logo} alt={name || team.name}
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
      onError={() => setErr(true)} />
  );
}

// Affiche un match de façon claire : badge compétition + les deux équipes
export function MatchRow({ match, highlightId }) {
  const isTbd  = match.home === 'tbd' || match.away === 'tbd';
  const cs     = getCompStyle(match.comp);
  const homeTeam = RUGBY_TEAMS.find(t => t.id === match.home);
  const awayTeam = RUGBY_TEAMS.find(t => t.id === match.away);

  const homeName = match.homeName || homeTeam?.name || match.home;
  const awayName = match.awayName || awayTeam?.name || match.away;

  const highlightHome = highlightId && match.home === highlightId;
  const highlightAway = highlightId && match.away === highlightId;

  // Label de round lisible
  const roundLabel = typeof match.round === 'number'
    ? `J${match.round}`
    : (match.round || '');

  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#F0EFEC] last:border-0">

      {/* Date — une fenêtre pour un repère de phase finale, une date sinon */}
      <div className="w-16 shrink-0 text-right pt-0.5">
        <div className="text-[11px] font-bold text-[#111] leading-tight">
          {match.allDay && match.endDate ? formatRange(match.date, match.endDate) : formatDate(match.date)}
        </div>
        <div className="text-[10px] text-[#BBB]">
          {match.allDay
            ? 'date à confirmer'
            : (/^([01]\d|2[0-3]):[0-5]\d$/.test(match.time || '') ? match.time : 'horaire à venir')}
        </div>
      </div>

      {/* Badge compétition */}
      <span className="shrink-0 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wide mt-0.5"
        style={{ backgroundColor: cs.bg, color: cs.text }}>
        {cs.label}
      </span>

      {/* Équipes */}
      <div className="flex-1 min-w-0">
        {isTbd ? (
          <span className="text-sm text-[#999]">
            {match.round ? `${match.round} — affiche à venir` : 'À déterminer'}
          </span>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Équipe domicile */}
            <span className={`flex items-center gap-1 text-sm ${highlightHome ? 'font-black text-[#111]' : 'font-medium text-[#444]'}`}>
              <TeamLogo id={match.home} name={homeName} size={20} />
              {homeName}
            </span>
            <span className="text-[10px] text-[#CCC] font-bold">vs</span>
            {/* Équipe extérieur */}
            <span className={`flex items-center gap-1 text-sm ${highlightAway ? 'font-black text-[#111]' : 'font-medium text-[#444]'}`}>
              <TeamLogo id={match.away} name={awayName} size={20} />
              {awayName}
            </span>
          </div>
        )}
        {/* Round en dessous — déjà affiché au centre pour un match sans affiche */}
        {roundLabel && !isTbd && (
          <div className="text-[10px] text-[#CCC] mt-0.5">{roundLabel}</div>
        )}
      </div>
    </div>
  );
}
