import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import path from 'path';
import fs from 'fs';
import { F1_TEAM } from '../lib/rugby';
import { MatchRow } from '../lib/MatchRow';

export default function F1Page({ upcoming, past, calUrl }) {
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
        <title>Formule 1 2026 — CalVirage</title>
        <meta name="description" content="Tous les Grands Prix F1 2026 dans votre calendrier. Mis à jour automatiquement." />
        <meta property="og:title" content="Formule 1 2026 sur CalVirage" />
        <meta property="og:description" content="Abonne-toi au calendrier F1 2026 — mis à jour automatiquement." />
        <meta property="og:image" content="https://calvirage.vercel.app/api/og" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="og:url" content="https://calvirage.vercel.app/f1" />
        <link rel="canonical" href="https://calvirage.vercel.app/f1" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏎</text></svg>" />
      </Head>

      <div className="min-h-screen bg-[#F7F6F3]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}>

        {/* Header */}
        <header className="bg-white border-b border-[#E8E8E6]">
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-sm font-black text-[#111] hover:text-[#E10600] transition-colors">
              ← CalVirage
            </Link>
            <Link href="/comment-ca-marche" className="text-sm font-bold text-[#777] hover:text-[#111] transition-colors">
              Comment ça marche ?
            </Link>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-6 py-8">

          {/* Hero */}
          <div
            className="rounded-3xl p-8 mb-6 flex items-center gap-6"
            style={{ backgroundColor: F1_TEAM.color }}
          >
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shrink-0"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              🏎
            </div>
            <div>
              <h1 className="text-3xl font-black leading-none text-white">
                Formule 1 2026
              </h1>
              <p className="text-sm mt-1 opacity-75 text-white">
                {upcoming.length} prochain{upcoming.length > 1 ? 's' : ''} Grand{upcoming.length > 1 ? 's' : ''} Prix
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
              Abonne-toi au calendrier Formule 1 2026. Tous les Grands Prix apparaissent dans ton agenda, mis à jour automatiquement.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={webcalUrl}
                className="flex-1 py-3 px-4 rounded-xl font-black text-sm text-center text-white transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: F1_TEAM.color }}
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

          {/* Upcoming GPs */}
          <div className="bg-white rounded-3xl border border-[#E8E8E6] p-6">
            <h2 className="text-base font-black text-[#111] mb-4">Prochains Grands Prix</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-[#AAA] text-center py-4">Aucun Grand Prix à venir.</p>
            ) : (
              <div>
                {upcoming.map(m => <MatchRow key={m.id} match={m} />)}
              </div>
            )}
          </div>

          {/* Share */}
          <div className="mt-4 bg-white rounded-3xl border border-[#E8E8E6] p-5">
            <p className="text-xs font-black text-[#111] uppercase tracking-wide mb-3">Partager cette page</p>
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent('Le calendrier F1 2026 dans mon agenda 🏎 https://calvirage.vercel.app/f1')}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:opacity-90 transition-opacity"
              >
                <span>💬</span> WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Le calendrier F1 2026 dans mon agenda 🏎')}&url=${encodeURIComponent('https://calvirage.vercel.app/f1')}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#000] text-white text-xs font-bold hover:opacity-80 transition-opacity"
              >
                <span>𝕏</span> Twitter
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent('https://calvirage.vercel.app/f1')}&text=${encodeURIComponent('Le calendrier F1 2026 dans mon agenda 🏎')}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0088cc] text-white text-xs font-bold hover:opacity-90 transition-opacity"
              >
                <span>✈️</span> Telegram
              </a>
            </div>
          </div>
        </main>

        <footer className="border-t border-[#E8E8E6] bg-white mt-8">
          <div className="max-w-2xl mx-auto px-6 py-4 text-center">
            <Link href="/" className="text-xs text-[#BBB] hover:text-[#111] transition-colors">
              ← Retour à CalVirage — choisir d&apos;autres sports
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}

export async function getStaticProps() {
  let upcoming = [];
  let past = [];

  try {
    const filePath = path.join(process.cwd(), 'data', 'fixtures.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const allMatches = JSON.parse(raw).matches || [];

    const today = new Date().toISOString().slice(0, 10);
    const f1Matches = allMatches.filter(m => m.comp === 'Formula 1');
    upcoming = f1Matches.filter(m => m.date >= today);
    past = f1Matches.filter(m => m.date < today).slice(-3);
  } catch {}

  const calUrl = 'https://calvirage.vercel.app/api/cal?teams=ZjE=';

  return {
    props: { upcoming, past, calUrl },
    revalidate: 3600,
  };
}
