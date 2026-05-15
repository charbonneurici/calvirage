#!/usr/bin/env node
/**
 * Scraper F1 — Jolpica API (successeur Ergast)
 * Fetch le calendrier F1 de la saison en cours et met à jour data/fixtures.json
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://api.jolpi.ca/ergast/f1/current/races/';
const FIXTURES_PATH = path.join(__dirname, '..', 'data', 'fixtures.json');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'CalVirage/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('JSON parse error: ' + e.message));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching F1 calendar from Jolpica API...');
  const json = await fetchJson(API_URL);

  const races = json?.MRData?.RaceTable?.Races;
  if (!Array.isArray(races) || races.length === 0) {
    console.error('No races found in API response');
    process.exit(1);
  }

  console.log(`Found ${races.length} races`);

  const f1Fixtures = races.map(race => ({
    id: `f1-${race.season}-r${race.round}`,
    comp: 'Formula 1',
    home: 'f1',
    away: 'f1',
    homeName: race.raceName,
    awayName: '',
    date: race.date,
    time: race.time ? race.time.slice(0, 5) : '14:00',
    venue: race.Circuit?.circuitName || '',
    round: parseInt(race.round, 10),
    status: 'scheduled',
  }));

  // Load existing fixtures.json
  let existing = { updatedAt: new Date().toISOString(), season: '2025-2026', matches: [] };
  try {
    const raw = fs.readFileSync(FIXTURES_PATH, 'utf-8');
    existing = JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read fixtures.json, starting fresh:', e.message);
  }

  // Remove old F1 entries
  const nonF1 = (existing.matches || []).filter(m => m.comp !== 'Formula 1');

  // Merge and sort by date
  const merged = [...nonF1, ...f1Fixtures].sort((a, b) => {
    if (a.date < b.date) return -1;
    if (a.date > b.date) return 1;
    return 0;
  });

  existing.matches = merged;
  existing.updatedAt = new Date().toISOString();

  fs.writeFileSync(FIXTURES_PATH, JSON.stringify(existing, null, 2), 'utf-8');
  console.log(`Saved ${f1Fixtures.length} F1 fixtures to data/fixtures.json`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
