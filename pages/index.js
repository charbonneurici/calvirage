import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { TOP14_TEAMS } from '../lib/rugby';
import { MatchRow } from '../lib/MatchRow';

function TeamCard({ team, selected, onToggle }) {
  const [imgError, setImgError] = useState(false);
  const showLogo = team.logo && !imgError;

  return (
    <button
      onClick={() => onToggle(team.id)}
      className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-150 focus:outline-none ${
        selected
          ? 'border-[#111] bg-[#111]'
          : 'border-[#E8E8E6] bg-white hover:border-[#CBCBC9]'
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
            alt={team.name}
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

export default function Home({ teams }) {
  const [selected, setSelected] = useState(new Set());
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState(null);

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setResult(null);
  };

  const toggleAll = () => {
    setSelected(prev => prev.size === teams.length ? new Set() : new Set(teams.map(t => t.id)));
    setResult(null);
  };

  const generate = async () => {
    const encoded = btoa(Array.from(selected).join(','));
    const base = 'https://calvirage.vercel.app';
    const url = `${base}/api/cal?teams=${encoded}`;
    setResult(url);
    setPreview(null);
    try {
      const res = await fetch(`/api/matches?teams=${encoded}&limit=8`);
      const data = await res.json();
      setPreview(data.matches || []);
    } catch {}
  };

  const copy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addToGoogle = () => {
    window.open(`https://www.google.com/calendar/render?cid=${encodeURIComponent(result)}`, '_blank');
  };

  return (
    <>
      <Head>
        <title>CalVirage — Les vrais fans s&apos;organisent</title>
        <meta name="description" content="Créez votre calendrier sportif personnalisé. Ne ratez plus un seul match de vos équipes." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏉</text></svg>" />
      </Head>

      <div className="min-h-screen bg-[#F7F6F3]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}>

        {/* Header */}
        <header className="bg-white border-b border-[#E8E8E6]">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <span className="text-xl font-black tracking-tight text-[#111]">Les vrais fans s&apos;organisent</span>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-10 md:py-16">

          {/* Hero */}
          <div className="mb-10">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#111] leading-none mb-5">
              Ne loupe plus jamais<br />
              <span className="text-[#E63329]">un match de ton équipe.</span>
            </h1>
            <ol className="text-base md:text-lg text-[#777] space-y-1">
              <li>1. Choisis tes équipes</li>
              <li>2. Ajoute le lien à ton calendrier (en t&apos;abonnant)</li>
              <li>3. Ne loupe plus jamais un match de ton équipe préférée</li>
            </ol>
            <p className="text-sm text-[#AAA] mt-3">Mis à jour automatiquement.</p>
          </div>

          {/* Sport tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#111] text-white rounded-full text-sm font-bold">
              <span>🏉</span> Rugby
            </button>
            {[{ label: 'Formule 1', emoji: '🏎' }, { label: 'Football', emoji: '⚽' }].map(s => (
              <button
                key={s.label}
                disabled
                className="relative flex items-center gap-2 px-4 py-2 bg-white border border-[#E8E8E6] rounded-full text-sm font-bold text-[#CCC] cursor-not-allowed"
              >
                <span>{s.emoji}</span> {s.label}
                <span className="absolute -top-2 -right-1 bg-[#777] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                  Bientôt
                </span>
              </button>
            ))}
          </div>

          {/* Team selector card */}
          <div className="bg-white rounded-3xl border border-[#E8E8E6] p-6 md:p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-black text-[#111]">Choisissez vos équipes</h2>
                <p className="text-sm text-[#999] mt-0.5">Top 14 · Champions Cup · Challenge Cup</p>
              </div>
              <button
                onClick={toggleAll}
                className="text-xs font-bold text-[#999] hover:text-[#111] transition-colors underline underline-offset-2 whitespace-nowrap ml-4 mt-0.5"
              >
                {selected.size === teams.length ? 'Tout décocher' : 'Tout sélectionner'}
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
              {teams.map(team => (
                <TeamCard
                  key={team.id}
                  team={team}
                  selected={selected.has(team.id)}
                  onToggle={toggle}
                />
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between gap-4">
            <p className={`text-sm font-semibold transition-colors ${selected.size > 0 ? 'text-[#111]' : 'text-[#CCC]'}`}>
              {selected.size > 0
                ? `${selected.size} équipe${selected.size > 1 ? 's' : ''} sélectionnée${selected.size > 1 ? 's' : ''}`
                : 'Sélectionnez au moins une équipe'}
            </p>
            <button
              onClick={generate}
              disabled={selected.size === 0}
              className={`px-7 py-4 rounded-2xl font-black text-sm transition-all ${
                selected.size > 0
                  ? 'bg-[#E63329] text-white hover:bg-[#CC2A24] shadow-lg shadow-red-900/20 active:scale-95'
                  : 'bg-[#EEECEA] text-[#CCC] cursor-not-allowed'
              }`}
            >
              Créer mon calendrier →
            </button>
          </div>

          {/* Result */}
          {result && (
            <div className="mt-6 bg-white rounded-3xl border border-emerald-200 p-6 md:p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" style={{ animation: 'pulse 2s infinite' }} />
                <span className="text-sm font-bold text-emerald-600">Calendrier prêt — mis à jour automatiquement</span>
              </div>

              <div className="bg-[#F7F6F3] rounded-xl px-4 py-3 mb-5 overflow-hidden">
                <code className="text-[11px] text-[#777] block truncate">{result}</code>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <button
                  onClick={copy}
                  className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                    copied ? 'bg-emerald-500 text-white' : 'bg-[#F7F6F3] text-[#111] hover:bg-[#EEECEA]'
                  }`}
                >
                  {copied ? '✓ Copié !' : 'Copier le lien'}
                </button>
                <button
                  onClick={addToGoogle}
                  className="py-3 px-4 rounded-xl font-bold text-sm bg-[#F7F6F3] text-[#111] hover:bg-[#EEECEA] transition-all"
                >
                  + Google Calendar
                </button>
                <a
                  href={result.replace('https://', 'webcal://')}
                  className="py-3 px-4 rounded-xl font-bold text-sm bg-[#F7F6F3] text-[#111] hover:bg-[#EEECEA] transition-all text-center"
                >
                  + Apple Calendar
                </a>
              </div>

              <p className="text-[11px] text-[#BBB] text-center leading-relaxed">
                Ajoutez le lien une seule fois dans votre agenda. Il se met à jour tout seul à chaque nouveau match.
              </p>

              {/* Match preview */}
              {preview && preview.length > 0 && (
                <div className="mt-5 border-t border-[#F0EFEC] pt-5">
                  <p className="text-xs font-black text-[#111] mb-1 uppercase tracking-wide">Prochains matchs inclus</p>
                  <div>
                    {preview.map(m => (
                      <MatchRow key={m.id} match={m}
                        highlightId={selected.size === 1 ? Array.from(selected)[0] : null} />
                    ))}
                  </div>
                  {selected.size === 1 && (
                    <Link href={`/${Array.from(selected)[0]}`}
                      className="block mt-3 text-center text-xs font-bold text-[#E63329] hover:underline">
                      Voir tous les matchs →
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        <footer className="border-t border-[#E8E8E6] bg-white mt-16">
          <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
            <span className="text-sm font-black text-[#111]">CalVirage</span>
            <span className="text-xs text-[#BBB]">Top 14 · Champions Cup · Challenge Cup</span>
          </div>
        </footer>
      </div>
    </>
  );
}

export async function getStaticProps() {
  return {
    props: { teams: TOP14_TEAMS },
  };
}
