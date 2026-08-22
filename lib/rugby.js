const LNR = 'https://cdn.lnr.fr/club';
const H = 'eae194b58011c3dab78398e6a95c20deff6ac0b0';
const lnr = slug => `${LNR}/${slug}/photo/logo-thumbnail-2x.${H}`;

const W = 'https://upload.wikimedia.org/wikipedia/fr/thumb';

export const TOP14_TEAMS = [
  { id: 'toulouse',      name: 'Toulouse',       abbrev: 'TLS', color: '#C8102E', text: '#fff', logo: lnr('toulouse') },
  { id: 'larochelle',    name: 'La Rochelle',    abbrev: 'LRO', color: '#FFCD00', text: '#111', logo: lnr('la-rochelle') },
  { id: 'bordeaux',      name: 'Bordeaux',       abbrev: 'UBB', color: '#1A1A2E', text: '#fff', logo: lnr('bordeaux-begles') },
  { id: 'toulon',        name: 'Toulon',         abbrev: 'RCT', color: '#002D72', text: '#fff', logo: lnr('toulon') },
  { id: 'racing92',      name: 'Racing 92',      abbrev: 'R92', color: '#6CACE4', text: '#fff', logo: lnr('racing-92') },
  { id: 'stadefrancais', name: 'Stade Français', abbrev: 'SFP', color: '#E8417A', text: '#fff', logo: lnr('paris') },
  { id: 'clermont',      name: 'Clermont',       abbrev: 'ASM', color: '#FFD100', text: '#111', logo: lnr('clermont') },
  { id: 'lyon',          name: 'Lyon',           abbrev: 'LOU', color: '#C8102E', text: '#fff', logo: lnr('lyon') },
  { id: 'castres',       name: 'Castres',        abbrev: 'CO',  color: '#003A8C', text: '#fff', logo: lnr('castres') },
  { id: 'pau',           name: 'Pau',            abbrev: 'PAU', color: '#007A53', text: '#fff', logo: `${W}/5/54/Logo_Section_paloise_B%C3%A9arn_Pyr%C3%A9n%C3%A9es_2021.svg/330px-Logo_Section_paloise_B%C3%A9arn_Pyr%C3%A9n%C3%A9es_2021.svg.png` },
  { id: 'bayonne',       name: 'Bayonne',        abbrev: 'BAY', color: '#003087', text: '#fff', logo: lnr('bayonne') },
  { id: 'perpignan',     name: 'Perpignan',      abbrev: 'PER', color: '#8B1A2A', text: '#fff', logo: lnr('perpignan') },
  { id: 'montpellier',   name: 'Montpellier',    abbrev: 'MHR', color: '#002147', text: '#fff', logo: lnr('montpellier') },
  { id: 'vannes',        name: 'Vannes',         abbrev: 'RCV', color: '#00843D', text: '#fff', logo: lnr('vannes') },
];

export const FRANCE_TEAM = {
  id: 'france',
  name: 'XV de France',
  abbrev: 'FRA',
  color: '#0A1D5C',
  text: '#fff',
  logo: `${W}/c/c3/Logo_XV_France_masculin_%28Rugby%29_-_2019.svg/330px-Logo_XV_France_masculin_%28Rugby%29_-_2019.svg.png`,
};

// Adversaires internationaux du XV de France : id généré par scrape-france.js → drapeau
export const NATION_FLAGS = {
  france: '🇫🇷', england: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', ireland: '🇮🇪', scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', wales: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', italy: '🇮🇹',
  southafrica: '🇿🇦', newzealand: '🇳🇿', australia: '🇦🇺', argentina: '🇦🇷', japan: '🇯🇵',
  fiji: '🇫🇯', samoa: '🇼🇸', tonga: '🇹🇴', georgia: '🇬🇪', romania: '🇷🇴', portugal: '🇵🇹',
  spain: '🇪🇸', uruguay: '🇺🇾', chile: '🇨🇱', canada: '🇨🇦', unitedstatesofamerica: '🇺🇸',
  hongkong: '🇭🇰', zimbabwe: '🇿🇼', namibia: '🇳🇦',
};

// Toutes les équipes rugby abonnables (clubs + sélection nationale)
export const RUGBY_TEAMS = [...TOP14_TEAMS, FRANCE_TEAM];

// "les matchs de Toulouse" mais "les matchs du XV de France"
export function teamOf(team) {
  return team.id === 'france' ? `du ${team.name}` : `de ${team.name}`;
}

export function findTeam(id) {
  return RUGBY_TEAMS.find(t => t.id === id) || null;
}
