import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import path from 'path';
import fs from 'fs';
import { TOP14_TEAMS } from '../lib/rugby';

function TeamLogo({ team }) {
  const [err, setErr] = useState(false);
  if (!team.logo || err) {
    return (
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0"
        style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: team.text }}>
        {team.abbrev}
      </div>
    );
  }
  return (
    <img src={team.logo} alt={team.name}
      className="w-20 h-20 object-contain drop-shadow-lg shrink-0"
      onError={() => setErr(true)} />
  );
}

const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function MatchRow({ match, teamId }) {
  const isHome = match.home === teamId;
  const opponent = isHome
    ? (match.awayName || match.away)
    : (match.homeName || match.home);
  const opponentTeam = TOP14_TEAMS.find(t => t.id === (isHome ? match.away : match.home));
  const [imgError, setImgError] = useState(false);

  const isPast = match.date < new Date().toISOString().slice(0, 10);
  const isTbd = match.home === 'tbd' || match.away === 'tbd';

  return (
    <div className={`flex items-center gap-3 py-3 border-b border-[#F0EFEC] last:border-0 ${isPast ? 'opacity-50' : ''}`}>
      {/* Date */}
      <div className="w-20 shrink-0 text-right">
        <div className="text-xs font-bold text-[#111]">{formatDate(match.date)}</div>
        <div className="text-[10px] text-[#AAA]">{match.time}</div>
      </div>

      {/* H/A badge */}
      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
        isTbd ? 'bg-[#F0EFEC] text-[#999]' :
        isHome ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFF3E0] text-[#E65100]'
      }`}>
        {isTbd ? '?' : isHome ? 'DOM' : 'EXT'}
      </span>

      {/* Opponent */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {!isTbd && opponentTeam?.logo && (
          <img
            src={opponentTeam.logo}
            alt={opponentTeam.name}
            className="w-6 h-6 object-contain shrink-0"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
        <span className="text-sm font-semibold text-[#111]">
          {isTbd ? 'À déterminer' : opponent}
        </span>
      </div>

      {/* Comp badge */}
      <span className="text-[9px] font-bold text-[#999] bg-[#F7F6F3] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
        {match.comp.replace('Top 14 — ', '').replace('Top 14', 'J' + match.round)}
      </span>
    </div>
  );
}

export default function TeamPage({ team, upcoming, past, calUrl }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(calUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const webcalUrl = calUrl.replace('https://', 'webcal://');

  return (
    <>
      <Head>
        <title>{team.name} — CalVirage</title>
        <meta name="description" content={`Tous les matchs de ${team.name} dans votre calendrier. Mis à jour automatiquement.`} />
        <meta property="og:title" content={`${team.name} sur CalVirage`} />
        <meta property="og:description" content={`Abonne-toi au calendrier de ${team.name} — mis à jour automatiquement.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏉</text></svg>" />
      </Head>

      <div className="min-h-screen bg-[#F7F6F3]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}>

        {/* Header */}
        <header className="bg-white border-b border-[#E8E8E6]">
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-sm font-black text-[#111] hover:text-[#E63329] transition-colors">
              ← CalVirage
            </Link>
            <span className="text-xs text-[#AAA]">Les vrais fans s&apos;organisent</span>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-6 py-8">

          {/* Team hero */}
          <div
            className="rounded-3xl p-8 mb-6 flex items-center gap-6"
            style={{ backgroundColor: team.color }}
          >
            <TeamLogo team={team} />
            <div>
              <h1 className="text-3xl font-black leading-none" style={{ color: team.text }}>
                {team.name}
              </h1>
              <p className="text-sm mt-1 opacity-75" style={{ color: team.text }}>
                {upcoming.length} prochain{upcoming.length > 1 ? 's' : ''} match{upcoming.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Subscribe CTA */}
          <div className="bg-white rounded-3xl border border-[#E8E8E6] p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span className="text-sm font-bold text-emerald-600">Mis à jour automatiquement</span>
            </div>
            <p className="text-sm text-[#777] mb-4">
              Abonne-toi au calendrier de {team.name}. Tous les matchs apparaissent dans ton agenda, mis à jour à chaque changement.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={webcalUrl}
                className="flex-1 py-3 px-4 rounded-xl font-black text-sm text-center text-white transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: team.color }}
              >
                + Apple Calendar
              </a>
              <a
                href={`https://www.google.com/calendar/render?cid=${encodeURIComponent(calUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-[#F7F6F3] text-[#111] hover:bg-[#EEECEA] transition-all text-center"
              >
                + Google Calendar
              </a>
              <button
                onClick={copy}
                className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-[#F7F6F3] text-[#111] hover:bg-[#EEECEA]'
                }`}
              >
                {copied ? '✓ Copié !' : 'Copier le lien'}
              </button>
            </div>
          </div>

          {/* Upcoming matches */}
          <div className="bg-white rounded-3xl border border-[#E8E8E6] p-6">
            <h2 className="text-base font-black text-[#111] mb-4">Prochains matchs</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-[#AAA] text-center py-4">Aucun match à venir.</p>
            ) : (
              <div>
                {upcoming.map(m => <MatchRow key={m.id} match={m} teamId={team.id} />)}
              </div>
            )}
          </div>

          {/* Share */}
          <div className="mt-4 text-center">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Les matchs de ${team.name} dans mon calendrier 🏉 ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#AAA] hover:text-[#111] transition-colors"
            >
              Partager cette page →
            </a>
          </div>
        </main>

        <footer className="border-t border-[#E8E8E6] bg-white mt-8">
          <div className="max-w-2xl mx-auto px-6 py-4 text-center">
            <Link href="/" className="text-xs text-[#BBB] hover:text-[#111] transition-colors">
              ← Retour à CalVirage — choisir d&apos;autres équipes
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}

export async function getStaticProps({ params }) {
  const team = TOP14_TEAMS.find(t => t.id === params.team);
  if (!team) return { notFound: true };

  let matches = [];
  try {
    const filePath = path.join(process.cwd(), 'data', 'fixtures.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    matches = JSON.parse(raw).matches || [];
  } catch {}

  const today = new Date().toISOString().slice(0, 10);
  const teamMatches = matches.filter(m => m.home === team.id || m.away === team.id);
  const upcoming = teamMatches.filter(m => m.date >= today);
  const past = teamMatches.filter(m => m.date < today).slice(-3);

  const encoded = Buffer.from(team.id).toString('base64');
  const calUrl = `https://calvirage.vercel.app/api/cal?teams=${encoded}`;

  return {
    props: { team, upcoming, past, calUrl },
  };
}

export async function getStaticPaths() {
  return {
    paths: TOP14_TEAMS.map(t => ({ params: { team: t.id } })),
    fallback: false,
  };
}
