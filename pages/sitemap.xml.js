import { TOP14_TEAMS } from '../lib/rugby';

const BASE = 'https://calvirage.vercel.app';

function sitemap(teams) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE}/comment-ca-marche</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE}/f1</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
${teams.map(t => `  <url>
    <loc>${BASE}/${t.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`).join('\n')}
</urlset>`;
}

export default function Sitemap() { return null; }

export async function getServerSideProps({ res }) {
  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
  res.write(sitemap(TOP14_TEAMS));
  res.end();
  return { props: {} };
}
