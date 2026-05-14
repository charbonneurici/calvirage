import { useState } from 'react';
import { TOP14_TEAMS } from './rugby';

const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS   = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
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
};

function getCompStyle(comp) {
  return COMP_STYLE[comp] || { bg: '#999', text: '#fff', label: comp };
}

function TeamLogo({ id, name, size = 6 }) {
  const [err, setErr] = useState(false);
  const team = TOP14_TEAMS.find(t => t.id === id);
  if (!team || !team.logo || err) return null;
  return (
    <img src={team.logo} alt={name || team.name}
      className={`w-${size} h-${size} object-contain shrink-0`}
      onError={() => setErr(true)} />
  );
}

// Affiche un match de façon claire : badge compétition + les deux équipes
export function MatchRow({ match, highlightId }) {
  const isTbd  = match.home === 'tbd' || match.away === 'tbd';
  const cs     = getCompStyle(match.comp);
  const homeTeam = TOP14_TEAMS.find(t => t.id === match.home);
  const awayTeam = TOP14_TEAMS.find(t => t.id === match.away);

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

      {/* Date */}
      <div className="w-16 shrink-0 text-right pt-0.5">
        <div className="text-[11px] font-bold text-[#111] leading-tight">{formatDate(match.date)}</div>
        <div className="text-[10px] text-[#BBB]">{match.time}</div>
      </div>

      {/* Badge compétition */}
      <span className="shrink-0 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wide mt-0.5"
        style={{ backgroundColor: cs.bg, color: cs.text }}>
        {cs.label}
      </span>

      {/* Équipes */}
      <div className="flex-1 min-w-0">
        {isTbd ? (
          <span className="text-sm text-[#999]">À déterminer</span>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Équipe domicile */}
            <span className={`flex items-center gap-1 text-sm ${highlightHome ? 'font-black text-[#111]' : 'font-medium text-[#444]'}`}>
              <TeamLogo id={match.home} name={homeName} size={5} />
              {homeName}
            </span>
            <span className="text-[10px] text-[#CCC] font-bold">vs</span>
            {/* Équipe extérieur */}
            <span className={`flex items-center gap-1 text-sm ${highlightAway ? 'font-black text-[#111]' : 'font-medium text-[#444]'}`}>
              <TeamLogo id={match.away} name={awayName} size={5} />
              {awayName}
            </span>
          </div>
        )}
        {/* Round en dessous */}
        {roundLabel && (
          <div className="text-[10px] text-[#CCC] mt-0.5">{roundLabel}</div>
        )}
      </div>
    </div>
  );
}
