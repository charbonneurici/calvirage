import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

const TEAMS = {
  toulouse:      { name: 'Toulouse',       color: '#C8102E', text: '#fff', abbrev: 'TLS' },
  larochelle:    { name: 'La Rochelle',    color: '#FFCD00', text: '#111', abbrev: 'LRO' },
  bordeaux:      { name: 'Bordeaux',       color: '#1A1A2E', text: '#fff', abbrev: 'UBB' },
  toulon:        { name: 'Toulon',         color: '#002D72', text: '#fff', abbrev: 'RCT' },
  racing92:      { name: 'Racing 92',      color: '#6CACE4', text: '#fff', abbrev: 'R92' },
  stadefrancais: { name: 'Stade Français', color: '#E8417A', text: '#fff', abbrev: 'SFP' },
  clermont:      { name: 'Clermont',       color: '#FFD100', text: '#111', abbrev: 'ASM' },
  lyon:          { name: 'Lyon',           color: '#C8102E', text: '#fff', abbrev: 'LOU' },
  castres:       { name: 'Castres',        color: '#003A8C', text: '#fff', abbrev: 'CO'  },
  pau:           { name: 'Pau',            color: '#007A53', text: '#fff', abbrev: 'PAU' },
  bayonne:       { name: 'Bayonne',        color: '#003087', text: '#fff', abbrev: 'BAY' },
  perpignan:     { name: 'Perpignan',      color: '#8B1A2A', text: '#fff', abbrev: 'PER' },
  montpellier:   { name: 'Montpellier',    color: '#002147', text: '#fff', abbrev: 'MHR' },
  montauban:     { name: 'Montauban',      color: '#1B3A6B', text: '#fff', abbrev: 'MTB' },
};

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('team');
  const team = TEAMS[teamId];

  // Generic OG for homepage
  if (!team) {
    return new ImageResponse(
      <div style={{
        width: '100%', height: '100%',
        background: '#111',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'sans-serif',
      }}>
        <div style={{ fontSize: 80 }}>🏉</div>
        <div style={{ fontSize: 64, fontWeight: 900, color: '#fff', marginTop: 16, letterSpacing: '-2px' }}>
          CalVirage
        </div>
        <div style={{ fontSize: 28, color: '#E63329', fontWeight: 700, marginTop: 12 }}>
          Ne loupe plus jamais un match
        </div>
        <div style={{ fontSize: 20, color: '#888', marginTop: 8 }}>
          Top 14 · Champions Cup · Challenge Cup
        </div>
      </div>,
      { width: 1200, height: 630 }
    );
  }

  return new ImageResponse(
    <div style={{
      width: '100%', height: '100%',
      background: team.color,
      display: 'flex', flexDirection: 'column',
      padding: '60px 80px',
      fontFamily: 'sans-serif',
      justifyContent: 'space-between',
    }}>
      {/* Top: branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 32 }}>🏉</span>
        <span style={{
          fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px',
          color: team.text, opacity: 0.7,
        }}>
          CalVirage
        </span>
      </div>

      {/* Middle: team name */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{
          fontSize: 100, fontWeight: 900, color: team.text,
          letterSpacing: '-4px', lineHeight: 1,
        }}>
          {team.name}
        </div>
        <div style={{
          fontSize: 28, fontWeight: 700, color: team.text,
          opacity: 0.75, marginTop: 16,
        }}>
          Abonne-toi au calendrier · mis à jour automatiquement
        </div>
      </div>

      {/* Bottom: badge */}
      <div style={{
        display: 'flex', gap: 12,
      }}>
        {['Top 14', 'Champions Cup', 'Challenge Cup'].map(comp => (
          <div key={comp} style={{
            background: 'rgba(0,0,0,0.25)',
            color: team.text,
            fontSize: 18, fontWeight: 700,
            padding: '8px 16px', borderRadius: 8,
          }}>
            {comp}
          </div>
        ))}
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
