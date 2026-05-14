import Head from 'next/head';
import Link from 'next/link';

const steps = [
  {
    num: '1',
    title: 'Choisis tes équipes',
    desc: 'Sélectionne une ou plusieurs équipes parmi les 14 clubs du Top 14. Tu peux aussi mélanger rugby, et bientôt d'autres sports.',
    emoji: '🏉',
  },
  {
    num: '2',
    title: 'Génère ton lien de calendrier',
    desc: 'Clique sur "Créer mon calendrier". Tu obtiens un lien unique au format .ics, compatible avec tous les agendas.',
    emoji: '🔗',
  },
  {
    num: '3',
    title: 'Abonne-toi — une seule fois',
    desc: 'Ajoute le lien à Apple Calendar, Google Calendar ou Outlook. C'est un abonnement : il se met à jour tout seul à chaque nouveau match ou changement d'horaire.',
    emoji: '📅',
  },
  {
    num: '4',
    title: 'Profite',
    desc: 'Tous les matchs apparaissent dans ton agenda habituel, avec le nom des équipes et l'heure. Plus jamais un match loupé.',
    emoji: '✅',
  },
];

const platforms = [
  {
    name: 'Apple Calendar',
    emoji: '🍎',
    steps: [
      'Clique sur le bouton "+ Apple Calendar"',
      'iOS / macOS ouvre automatiquement l'application Calendrier',
      'Confirme l'abonnement',
      'C'est bon — les matchs apparaissent instantanément',
    ],
  },
  {
    name: 'Google Calendar',
    emoji: '🗓',
    steps: [
      'Clique sur "+ Google Calendar"',
      'Google te demande de confirmer l'ajout',
      'Les matchs apparaissent dans ton agenda (peut prendre quelques minutes)',
      'Fonctionne aussi sur Android via l'app Google Calendar',
    ],
  },
  {
    name: 'Outlook / autres',
    emoji: '📧',
    steps: [
      'Copie le lien avec le bouton "Copier le lien"',
      'Dans Outlook : Fichier → Paramètres du compte → Calendriers Internet → Nouveau',
      'Colle le lien et confirme',
      'Fonctionne aussi avec Thunderbird, Fantastical, etc.',
    ],
  },
];

const faq = [
  {
    q: 'C'est gratuit ?',
    a: 'Oui, totalement gratuit. Pas d'inscription, pas de carte bancaire.',
  },
  {
    q: 'Le calendrier se met à jour automatiquement ?',
    a: 'Oui. Dès qu'un match est ajouté, déplacé ou annulé, ton agenda se synchronise. Apple Calendar vérifie toutes les heures, Google Calendar toutes les 24h environ.',
  },
  {
    q: 'Quels matchs sont inclus ?',
    a: 'Tous les matchs de Top 14, Champions Cup et Challenge Cup pour les équipes que tu suis. Les phases finales (barrages, demi-finales, finale) sont incluses dès que les équipes qualifiées sont connues.',
  },
  {
    q: 'Et si un match est reporté ou annulé ?',
    a: 'Le calendrier se met à jour automatiquement dès que l'info est disponible. Nos scrapers tournent deux fois par semaine (lundi et jeudi).',
  },
  {
    q: 'Pourquoi un abonnement plutôt qu'un fichier .ics à télécharger ?',
    a: 'Un fichier .ics est statique : si les horaires changent, ton agenda ne le sait pas. Un abonnement est dynamique : il se synchronise automatiquement.',
  },
  {
    q: 'Ça marche sur iPhone / Android ?',
    a: 'Oui. Sur iPhone, clique "+ Apple Calendar". Sur Android, clique "+ Google Calendar". Les deux fonctionnent parfaitement.',
  },
];

export default function HowItWorks() {
  return (
    <>
      <Head>
        <title>Comment ça marche — CalVirage</title>
        <meta name="description" content="Comment abonner son agenda aux matchs de rugby : Apple Calendar, Google Calendar, Outlook. Guide pas à pas." />
        <meta property="og:title" content="Comment ça marche — CalVirage" />
        <meta property="og:description" content="Abonne-toi aux matchs de rugby en 2 minutes. Guide complet pour Apple Calendar, Google Calendar et Outlook." />
        <meta property="og:image" content="https://calvirage.vercel.app/api/og" />
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

        <main className="max-w-2xl mx-auto px-6 py-10">

          {/* Hero */}
          <div className="mb-10">
            <h1 className="text-4xl font-black tracking-tight text-[#111] leading-none mb-3">
              Comment ça marche ?
            </h1>
            <p className="text-base text-[#777]">
              En 2 minutes, tous les matchs de tes équipes apparaissent dans ton agenda — et se mettent à jour tout seuls.
            </p>
          </div>

          {/* Steps */}
          <div className="bg-white rounded-3xl border border-[#E8E8E6] p-6 mb-6">
            <h2 className="text-sm font-black text-[#111] uppercase tracking-wide mb-5">Les 4 étapes</h2>
            <div className="space-y-5">
              {steps.map((step) => (
                <div key={step.num} className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#E63329] text-white font-black text-lg flex items-center justify-center shrink-0">
                    {step.num}
                  </div>
                  <div>
                    <div className="font-black text-[#111] text-sm flex items-center gap-2">
                      <span>{step.emoji}</span> {step.title}
                    </div>
                    <p className="text-sm text-[#777] mt-1">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-[#111] rounded-3xl p-6 mb-6 text-center">
            <p className="text-white font-black text-lg mb-3">Prêt à ne plus rater un match ?</p>
            <Link
              href="/"
              className="inline-block bg-[#E63329] text-white font-black text-sm px-6 py-3 rounded-2xl hover:bg-[#CC2A24] transition-colors"
            >
              Créer mon calendrier →
            </Link>
          </div>

          {/* Platform guides */}
          <div className="mb-6">
            <h2 className="text-lg font-black text-[#111] mb-4">Guide par application</h2>
            <div className="space-y-3">
              {platforms.map((platform) => (
                <div key={platform.name} className="bg-white rounded-2xl border border-[#E8E8E6] p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{platform.emoji}</span>
                    <h3 className="font-black text-[#111]">{platform.name}</h3>
                  </div>
                  <ol className="space-y-1.5">
                    {platform.steps.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-[#555]">
                        <span className="text-[#CCC] font-bold shrink-0">{i + 1}.</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-3xl border border-[#E8E8E6] p-6">
            <h2 className="text-sm font-black text-[#111] uppercase tracking-wide mb-5">FAQ</h2>
            <div className="space-y-5">
              {faq.map((item) => (
                <div key={item.q} className="border-b border-[#F0EFEC] last:border-0 pb-5 last:pb-0">
                  <p className="font-black text-sm text-[#111] mb-1">{item.q}</p>
                  <p className="text-sm text-[#777]">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer className="border-t border-[#E8E8E6] bg-white mt-8">
          <div className="max-w-2xl mx-auto px-6 py-4 text-center">
            <Link href="/" className="text-xs text-[#BBB] hover:text-[#111] transition-colors">
              ← Retour à CalVirage — créer mon calendrier
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}
