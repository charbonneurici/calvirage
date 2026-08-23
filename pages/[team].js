import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { RUGBY_TEAMS, teamOf } from '../lib/rugby';
import { loadFixtures, filterForTeams } from '../lib/fixtures';
import { todayISO } from '../lib/dates';
import { MatchRow } from '../lib/MatchRow';

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


export default function TeamPage({ team, upcoming, past, calUrl }) {
  const of = teamOf(team);
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
        <meta name="description" content={`Tous les matchs ${of} dans votre calendrier. Mis à jour automatiquement.`} />
        <meta property="og:title" content={`${team.name} sur CalVirage`} />
        <meta property="og:description" content={`Abonne-toi au calendrier ${of} — mis à jour automatiquement.`} />
        <meta property="og:image" content={`https://calvirage.vercel.app/api/og?team=${team.id}`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`https://calvirage.vercel.app/api/og?team=${team.id}`} />
        <meta property="og:url" content={`https://calvirage.vercel.app/${team.id}`} />
        <link rel="canonical" href={`https://calvirage.vercel.app/${team.id}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏉</text></svg>" />
      </Head>

      <div className="min-h-screen bg-[#F7F6F3]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}>

        {/* Header */}
        <header className="bg-white border-b border-[#E8E8E6]">
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-sm font-black text-[#111] hover:text-[#E63329] transition-colors">
              ← 🏉 CalVirage
            </Link>
            <Link href="/comment-ca-marche" className="text-sm font-bold text-[#777] hover:text-[#111] transition-colors">
              Comment ça marche ?
            </Link>
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
            <h2 className="text-lg font-black text-[#111] mb-1">Ajoute-les à ton agenda</h2>
            <p className="text-sm text-[#999] mb-5">
              Une seule fois. Ensuite le calendrier {of} se met à jour tout seul — horaires décalés,
              matchs reportés et phases finales compris.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <a
                href={webcalUrl}
                className="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl font-black text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: team.color }}
              >
                <span aria-hidden="true">🍎</span> Apple Calendar
              </a>
              <a
                href={`https://www.google.com/calendar/render?cid=${encodeURIComponent(calUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl font-black text-sm bg-[#111] text-white hover:bg-[#333] transition-all active:scale-[0.98]"
              >
                <span aria-hidden="true">🗓</span> Google Calendar
              </a>
            </div>

            <div className="flex items-center gap-2 bg-[#F7F6F3] rounded-xl p-1.5 pl-4">
              <code className="text-[11px] text-[#999] truncate flex-1 min-w-0">{calUrl}</code>
              <button
                onClick={copy}
                className={`shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-white text-[#111] hover:bg-[#EEECEA] border border-[#E8E8E6]'
                }`}
              >
                {copied ? '✓ Copié' : 'Copier'}
              </button>
            </div>
            <p className="text-[11px] text-[#BBB] mt-2">
              Outlook, Thunderbird, Fantastical : colle ce lien dans les calendriers Internet de ton app.{' '}
              <Link href="/comment-ca-marche" className="font-bold text-[#999] hover:text-[#111] underline underline-offset-2">
                Guide détaillé
              </Link>
            </p>
          </div>

          {/* Upcoming matches */}
          <div className="bg-white rounded-3xl border border-[#E8E8E6] p-6">
            <h2 className="text-base font-black text-[#111] mb-4">Prochains matchs</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-[#AAA] text-center py-4">Aucun match à venir.</p>
            ) : (
              <div>
                {upcoming.map(m => <MatchRow key={m.id} match={m} highlightId={team.id} />)}
              </div>
            )}
          </div>

          {/* Share */}
          <div className="mt-4 bg-white rounded-3xl border border-[#E8E8E6] p-5">
            <p className="text-xs font-black text-[#111] uppercase tracking-wide mb-3">Partager cette page</p>
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Les matchs ${of} dans mon calendrier 🏉 https://calvirage.vercel.app/${team.id}`)}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:opacity-90 transition-opacity"
              >
                <span>💬</span> WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Les matchs ${of} dans mon calendrier 🏉`)}&url=${encodeURIComponent(`https://calvirage.vercel.app/${team.id}`)}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#000] text-white text-xs font-bold hover:opacity-80 transition-opacity"
              >
                <span>𝕏</span> Twitter
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(`https://calvirage.vercel.app/${team.id}`)}&text=${encodeURIComponent(`Les matchs ${of} dans ton calendrier 🏉`)}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0088cc] text-white text-xs font-bold hover:opacity-90 transition-opacity"
              >
                <span>✈️</span> Telegram
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://calvirage.vercel.app/${team.id}`)}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1877F2] text-white text-xs font-bold hover:opacity-90 transition-opacity"
              >
                <span>👍</span> Facebook
              </a>
            </div>
          </div>
        </main>

        <footer className="border-t border-[#E8E8E6] bg-white mt-8">
          <div className="max-w-2xl mx-auto px-6 py-4 text-center">
            <Link href="/" className="text-xs text-[#BBB] hover:text-[#111] transition-colors">
              ← Ajouter d&apos;autres équipes à mon calendrier
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}

export async function getStaticProps({ params }) {
  const team = RUGBY_TEAMS.find(t => t.id === params.team);
  if (!team) return { notFound: true };

  const today = todayISO();
  // filterForTeams rattache aussi les phases finales sans affiche connue
  const teamMatches = filterForTeams(loadFixtures(), new Set([team.id]));
  const upcoming = teamMatches.filter(m => (m.endDate || m.date) >= today);
  const past = teamMatches.filter(m => (m.endDate || m.date) < today).slice(-3);

  const encoded = Buffer.from(team.id).toString('base64');
  const calUrl = `https://calvirage.vercel.app/api/cal?teams=${encoded}`;

  return {
    props: { team, upcoming, past, calUrl },
    revalidate: 3600,
  };
}

export async function getStaticPaths() {
  return {
    paths: RUGBY_TEAMS.map(t => ({ params: { team: t.id } })),
    fallback: false,
  };
}
