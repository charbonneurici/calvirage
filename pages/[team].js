import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import path from 'path';
import fs from 'fs';
import { TOP14_TEAMS } from '../lib/rugby';
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
              ← CalVirage
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
                {upcoming.map(m => <MatchRow key={m.id} match={m} highlightId={team.id} />)}
              </div>
            )}
          </div>

          {/* Share */}
          <div className="mt-4 bg-white rounded-3xl border border-[#E8E8E6] p-5">
            <p className="text-xs font-black text-[#111] uppercase tracking-wide mb-3">Partager cette page</p>
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Les matchs de ${team.name} dans mon calendrier 🏉 https://calvirage.vercel.app/${team.id}`)}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:opacity-90 transition-opacity"
              >
                <span>💬</span> WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Les matchs de ${team.name} dans mon calendrier 🏉`)}&url=${encodeURIComponent(`https://calvirage.vercel.app/${team.id}`)}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#000] text-white text-xs font-bold hover:opacity-80 transition-opacity"
              >
                <span>𝕏</span> Twitter
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(`https://calvirage.vercel.app/${team.id}`)}&text=${encodeURIComponent(`Les matchs de ${team.name} dans ton calendrier 🏉`)}`}
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
    revalidate: 3600,
  };
}

export async function getStaticPaths() {
  return {
    paths: TOP14_TEAMS.map(t => ({ params: { team: t.id } })),
    fallback: false,
  };
}
