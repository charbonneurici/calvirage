import { useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import path from 'path';
import fs from 'fs';
import { TOP14_TEAMS, FRANCE_TEAM } from '../lib/rugby';
import { todayISO } from '../lib/dates';
import { MatchRow, formatDate } from '../lib/MatchRow';

const BASE_URL = 'https://calvirage.vercel.app';

function TeamCard({ team, selected, onToggle }) {
  const [imgError, setImgError] = useState(false);
  const showLogo = team.logo && !imgError;

  return (
    <button
      onClick={() => onToggle(team.id)}
      aria-pressed={selected}
      className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E63329] focus-visible:ring-offset-2 ${
        selected
          ? 'border-[#111] bg-[#111]'
          : 'border-[#E8E8E6] bg-white hover:border-[#CBCBC9] hover:-translate-y-0.5'
      }`}
    >
      {selected && (
        <span className="absolute top-2 right-2 w-4 h-4 bg-white rounded-full flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-[#111]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </span>
      )}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden ${selected ? 'bg-white/10' : 'bg-white'}`}>
        {showLogo ? (
          <img
            src={team.logo}
            alt=""
            className="w-11 h-11 object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs tracking-tight"
            style={{ backgroundColor: team.color, color: team.text }}
          >
            {team.abbrev}
          </div>
        )}
      </div>
      <span className={`text-[10px] font-black uppercase tracking-tight text-center leading-tight w-full ${selected ? 'text-white' : 'text-[#444]'}`}>
        {team.name}
      </span>
    </button>
  );
}

// Le XV de France n'est pas un club : carte large, qui annonce ses compétitions
function FranceCard({ team, selected, onToggle }) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={() => onToggle(team.id)}
      aria-pressed={selected}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E63329] focus-visible:ring-offset-2 ${
        selected
          ? 'border-[#0A1D5C] bg-[#0A1D5C]'
          : 'border-[#E8E8E6] bg-white hover:border-[#CBCBC9]'
      }`}
    >
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${selected ? 'bg-white/10' : 'bg-[#F7F6F3]'}`}>
        {team.logo && !imgError ? (
          <img src={team.logo} alt="" className="w-12 h-12 object-contain" onError={() => setImgError(true)} />
        ) : (
          <span className="font-black text-sm" style={{ color: selected ? '#fff' : team.color }}>{team.abbrev}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className={`text-sm font-black uppercase tracking-tight ${selected ? 'text-white' : 'text-[#111]'}`}>
          {team.name}
        </div>
        <div className={`text-xs mt-0.5 ${selected ? 'text-white/60' : 'text-[#999]'}`}>
          Tournoi des 6 Nations · Nations Championship · Coupe du monde 2027
        </div>
      </div>

      <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
        selected ? 'bg-white' : 'border-2 border-[#E8E8E6]'
      }`}>
        {selected && (
          <svg className="w-3 h-3 text-[#0A1D5C]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </span>
    </button>
  );
}

// Les trois arguments qui distinguent un abonnement d'un fichier .ics téléchargé
const VALUE_PROPS = [
  {
    title: 'Une seule fois',
    desc: 'Tu ajoutes le lien à ton agenda, et tu n’y touches plus jamais.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    ),
  },
  {
    title: 'Toujours à jour',
    desc: 'Horaire décalé, match reporté, phase finale : ton agenda suit tout seul.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    ),
  },
  {
    title: 'Gratuit, sans compte',
    desc: 'Pas d’inscription, pas d’app à installer, pas de pub.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
];

function ValueProp({ title, desc, icon }) {
  return (
    <div className="flex gap-3">
      <svg className="w-5 h-5 text-[#E63329] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        {icon}
      </svg>
      <div>
        <div className="text-sm font-black text-[#111] leading-tight">{title}</div>
        <p className="text-[13px] text-[#888] mt-0.5 leading-snug">{desc}</p>
      </div>
    </div>
  );
}

export default function Home({ teams, franceTeam, weekendMatches, totalMatches }) {
  const [selected, setSelected] = useState(new Set());
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState(null);
  const resultRef = useRef(null);

  const allIds = [...teams.map(t => t.id), franceTeam.id];

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setResult(null);
  };

  const toggleAll = () => {
    setSelected(prev => prev.size === allIds.length ? new Set() : new Set(allIds));
    setResult(null);
  };

  const generate = async () => {
    const encoded = btoa(Array.from(selected).join(','));
    setResult(`${BASE_URL}/api/cal?teams=${encoded}`);
    setPreview(null);
    // Le résultat apparaît sous le sélecteur : on y amène l'utilisateur
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    try {
      const res = await fetch(`/api/matches?teams=${encoded}&limit=6`);
      const data = await res.json();
      setPreview(data.matches || []);
    } catch {}
  };

  const copy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const count = selected.size;
  const webcalUrl = result?.replace('https://', 'webcal://');

  // "Prochainement" filtré sur la sélection
  const weekend = count === 0 || !weekendMatches ? [] : weekendMatches
    .map(group => ({
      ...group,
      matches: group.matches.filter(m => selected.has(m.home) || selected.has(m.away)),
    }))
    .filter(group => group.matches.length > 0);

  return (
    <>
      <Head>
        <title>CalVirage — Le rugby dans ton agenda</title>
        <meta name="description" content="Tous les matchs de tes équipes de rugby dans ton calendrier : Top 14, Champions Cup, Challenge Cup et XV de France. Un lien, une fois, et ça se met à jour tout seul." />
        <meta property="og:title" content="CalVirage — Le rugby dans ton agenda" />
        <meta property="og:description" content="Top 14, Champions Cup, Challenge Cup, XV de France. Abonne ton agenda une fois : il se met à jour tout seul." />
        <meta property="og:image" content={`${BASE_URL}/api/og`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${BASE_URL}/api/og`} />
        <meta property="og:url" content={`${BASE_URL}/`} />
        <link rel="canonical" href={`${BASE_URL}/`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏉</text></svg>" />
      </Head>

      <div className="min-h-screen bg-[#F7F6F3]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}>

        {/* Header — la marque d'abord, la tagline en second */}
        <header className="bg-white border-b border-[#E8E8E6] sticky top-0 z-20">
          <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-2.5 min-w-0">
              <span className="text-lg font-black tracking-tight text-[#111]">🏉 CalVirage</span>
              <span className="hidden sm:inline text-xs text-[#BBB] truncate">Les vrais fans s&apos;organisent</span>
            </div>
            <Link href="/comment-ca-marche" className="text-sm font-bold text-[#777] hover:text-[#111] transition-colors whitespace-nowrap">
              Comment ça marche ?
            </Link>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-10 md:py-14 pb-28 md:pb-14">

          {/* Hero */}
          <div className="mb-8 md:mb-10">
            <span className="inline-block text-[11px] font-black uppercase tracking-widest text-[#E63329] mb-3">
              Rugby français
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#111] leading-[1.05] mb-4">
              Le rugby dans<br />
              <span className="text-[#E63329]">ton agenda.</span>
            </h1>
            <p className="text-base md:text-lg text-[#666] max-w-xl leading-relaxed">
              Choisis tes équipes, ajoute le lien à ton calendrier.
              Tous leurs matchs y apparaissent — et s&apos;y mettent à jour tout seuls.
            </p>
          </div>

          {/* Ce qui rend l'abonnement différent d'un fichier .ics */}
          <div className="grid sm:grid-cols-3 gap-5 sm:gap-6 mb-8 md:mb-10">
            {VALUE_PROPS.map(p => <ValueProp key={p.title} {...p} />)}
          </div>

          {/* Couverture */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {['Top 14', 'Champions Cup', 'Challenge Cup', 'XV de France'].map(comp => (
              <span key={comp} className="text-xs font-bold text-[#666] bg-white border border-[#E8E8E6] rounded-full px-3 py-1.5">
                {comp}
              </span>
            ))}
            {totalMatches > 0 && (
              <span className="text-xs text-[#BBB] px-1">{totalMatches} matchs à venir</span>
            )}
          </div>

          {/* Sélecteur d'équipes */}
          <div className="bg-white rounded-3xl border border-[#E8E8E6] p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-6">
              <div>
                <h2 className="text-lg font-black text-[#111]">
                  <span className="text-[#E63329] mr-1.5">1.</span>Choisis tes équipes
                </h2>
                <p className="text-sm text-[#999] mt-0.5">Autant que tu veux — elles iront dans le même calendrier.</p>
              </div>
              <button
                onClick={toggleAll}
                className="self-start text-xs font-bold text-[#999] hover:text-[#111] transition-colors underline underline-offset-2 whitespace-nowrap sm:mt-1"
              >
                {count === allIds.length ? 'Tout décocher' : 'Tout sélectionner'}
              </button>
            </div>

            <p className="text-[10px] font-black text-[#AAA] uppercase tracking-widest mb-3">Sélection nationale</p>
            <div className="mb-6 pb-6 border-b border-[#F0EFEC]">
              <FranceCard team={franceTeam} selected={selected.has(franceTeam.id)} onToggle={toggle} />
            </div>

            <p className="text-[10px] font-black text-[#AAA] uppercase tracking-widest mb-3">Clubs — Top 14</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
              {teams.map(team => (
                <TeamCard key={team.id} team={team} selected={selected.has(team.id)} onToggle={toggle} />
              ))}
            </div>
          </div>

          {/* CTA desktop */}
          <div className="hidden md:flex items-center justify-between gap-4 mt-6">
            <p className={`text-sm font-semibold transition-colors ${count > 0 ? 'text-[#111]' : 'text-[#CCC]'}`}>
              {count > 0
                ? `${count} équipe${count > 1 ? 's' : ''} sélectionnée${count > 1 ? 's' : ''}`
                : 'Sélectionne au moins une équipe'}
            </p>
            <button
              onClick={generate}
              disabled={count === 0}
              className={`px-7 py-4 rounded-2xl font-black text-sm transition-all ${
                count > 0
                  ? 'bg-[#E63329] text-white hover:bg-[#CC2A24] shadow-lg shadow-red-900/20 active:scale-95'
                  : 'bg-[#EEECEA] text-[#CCC] cursor-not-allowed'
              }`}
            >
              Créer mon calendrier →
            </button>
          </div>

          {/* Résultat */}
          <div ref={resultRef} className="scroll-mt-20">
          {result && (
            <div className="mt-6 bg-white rounded-3xl border border-[#E8E8E6] overflow-hidden">
              <div className="p-6 md:p-8">
                <h2 className="text-lg font-black text-[#111] mb-1">
                  <span className="text-[#E63329] mr-1.5">2.</span>Ajoute-le à ton agenda
                </h2>
                <p className="text-sm text-[#999] mb-5">
                  Une seule fois. Ensuite il se met à jour tout seul.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <a
                    href={webcalUrl}
                    className="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl font-black text-sm bg-[#111] text-white hover:bg-[#333] transition-all active:scale-[0.98]"
                  >
                    <span aria-hidden="true">🍎</span> Apple Calendar
                  </a>
                  <a
                    href={`https://www.google.com/calendar/render?cid=${encodeURIComponent(result)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl font-black text-sm bg-[#111] text-white hover:bg-[#333] transition-all active:scale-[0.98]"
                  >
                    <span aria-hidden="true">🗓</span> Google Calendar
                  </a>
                </div>

                {/* Outlook & co : le lien brut, en retrait */}
                <div className="flex items-center gap-2 bg-[#F7F6F3] rounded-xl p-1.5 pl-4">
                  <code className="text-[11px] text-[#999] truncate flex-1 min-w-0">{result}</code>
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
                  Pour Outlook, Thunderbird ou Fantastical : copie ce lien et colle-le dans les calendriers Internet de ton app.{' '}
                  <Link href="/comment-ca-marche" className="font-bold text-[#999] hover:text-[#111] underline underline-offset-2">
                    Guide détaillé
                  </Link>
                </p>
              </div>

              {/* Aperçu des matchs inclus */}
              {preview && preview.length > 0 && (
                <div className="bg-[#FBFAF8] border-t border-[#F0EFEC] px-6 md:px-8 py-5">
                  <p className="text-[10px] font-black text-[#AAA] uppercase tracking-widest mb-1">
                    Ce que tu vas recevoir
                  </p>
                  {preview.map(m => (
                    <MatchRow key={m.id} match={m} highlightId={count === 1 ? Array.from(selected)[0] : null} />
                  ))}
                  {count === 1 && (
                    <Link href={`/${Array.from(selected)[0]}`}
                      className="block mt-3 text-center text-xs font-bold text-[#E63329] hover:underline">
                      Voir tous les matchs →
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
          </div>

          {/* Prochainement */}
          {weekend.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#E8E8E6] p-6 md:p-8 mt-6">
              <h2 className="text-base font-black text-[#111] mb-4">Prochainement 🏉</h2>
              {weekend.map(group => (
                <div key={group.date}>
                  <div className="text-[10px] font-black text-[#AAA] uppercase tracking-widest mb-1 mt-3 first:mt-0">
                    {formatDate(group.date)}
                  </div>
                  {group.matches.map(m => (
                    <MatchRow key={m.id} match={m} highlightId={count === 1 ? Array.from(selected)[0] : null} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </main>

        {/* CTA collant sur mobile : le bouton reste atteignable pendant qu'on scrolle la grille */}
        {count > 0 && !result && (
          <div className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur border-t border-[#E8E8E6] px-6 py-3 flex items-center gap-3">
            <span className="text-xs font-bold text-[#111] whitespace-nowrap">
              {count} équipe{count > 1 ? 's' : ''}
            </span>
            <button
              onClick={generate}
              className="flex-1 py-3.5 rounded-2xl font-black text-sm bg-[#E63329] text-white active:scale-95 transition-transform"
            >
              Créer mon calendrier →
            </button>
          </div>
        )}

        <footer className="border-t border-[#E8E8E6] bg-white">
          <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-sm font-black text-[#111]">🏉 CalVirage</span>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <Link href="/comment-ca-marche" className="text-xs text-[#999] hover:text-[#111] transition-colors">
                Comment ça marche ?
              </Link>
              <span className="text-xs text-[#DDD]" aria-hidden="true">·</span>
              <span className="text-xs text-[#BBB]">Top 14 · Champions Cup · Challenge Cup · XV de France</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export async function getStaticProps() {
  let weekendMatches = [];
  let totalMatches = 0;

  try {
    const filePath = path.join(process.cwd(), 'data', 'fixtures.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const allMatches = JSON.parse(raw).matches || [];

    const todayStr = todayISO();
    const in14Str = todayISO(14);

    totalMatches = allMatches.filter(m => m.date >= todayStr).length;
    const upcoming = allMatches.filter(m => m.date >= todayStr && m.date <= in14Str);

    // Regroupement par date, 3 premières journées
    const byDate = {};
    for (const m of upcoming) {
      if (!byDate[m.date]) byDate[m.date] = [];
      byDate[m.date].push(m);
    }

    weekendMatches = Object.keys(byDate)
      .sort()
      .slice(0, 3)
      .map(date => ({ date, matches: byDate[date] }));
  } catch {}

  return {
    props: { teams: TOP14_TEAMS, franceTeam: FRANCE_TEAM, weekendMatches, totalMatches },
    revalidate: 3600,
  };
}
