#!/usr/bin/env node
// Verrijkt gespeelde wedstrijden met stadion, weer en de opstelling bij aftrap.
//
// SPOILERVRIJ. Drie waarborgen:
//  1. Alleen /fixtures (op datum) en /fixtures/lineups worden bevraagd.
//     Nooit /fixtures/events of de gebundelde fixture (die bevatten doelpunten,
//     kaarten en wissels).
//  2. Write-once: de opstelling en het weer worden pas ná aftrap één keer
//     opgehaald en daarna nooit overschreven. De opgeslagen versie blijft zo
//     exact de aftrap-stand; latere wissels kunnen er niet insluipen.
//  3. De opstelling-data zelf bevat per speler alleen nummer/naam/positie/grid.
//
// Twee modi (net als check-summaries.mjs):
//  - DB-modus: met SUPABASE_URL + SUPABASE_SERVICE_KEY -> schrijft naar Supabase.
//  - Bestandsmodus: anders leest hij src/data/matches.js (alleen lezen; deze
//    velden staan niet in dat bestand, dus daar kan alleen --dry zinvol zijn).
//
// Vlaggen:
//  --dry         niets wegschrijven, alleen tonen wat er zou worden opgeslagen
//  --only=<id>   beperk tot één wedstrijd (bijv. --only=usa-par)
//  --stil        minder uitvoer
//
// Vereist: APISPORTS_KEY in de omgeving (api-sports.io, gratis tier).
// Gebruik: node scripts/enrich-matches.mjs   (of npm run enrich)

import {
  fetchFixturesByDate,
  fetchLineups,
  fetchWeather,
  findFixture,
  resolveVenue,
  buildLineup,
} from './wk-data.mjs'

const DRY = process.argv.includes('--dry')
const STIL = process.argv.includes('--stil')
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.slice(7) || null

const API_KEY = process.env.APISPORTS_KEY
const DB_MODE = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY,
)

const log = (...a) => !STIL && console.log(...a)

if (!API_KEY) {
  console.error('Zet APISPORTS_KEY in je omgeving (api-sports.io, gratis tier).')
  process.exit(1)
}

// Databaserij -> appvorm. Alleen de velden die dit script nodig heeft.
const fromRow = (r) => ({
  id: r.id,
  teamA: r.team_a,
  teamB: r.team_b ?? '',
  kickoff: r.kickoff,
  venue: r.venue ?? null,
  temp_c: r.temp_c ?? null,
  lineup: r.lineup ?? null,
  photo: r.photo ?? null,
})

async function maakOpslag() {
  if (DB_MODE) {
    const base = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_KEY
    const headers = { apikey: key, Authorization: `Bearer ${key}` }
    return {
      async getMatches() {
        const res = await fetch(
          `${base}/rest/v1/matches?select=*&order=kickoff.asc`,
          { headers },
        )
        if (!res.ok) throw new Error(`Supabase gaf ${res.status}`)
        return (await res.json()).map(fromRow)
      },
      async update(id, velden) {
        const res = await fetch(`${base}/rest/v1/matches?id=eq.${id}`, {
          method: 'PATCH',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ ...velden, updated_at: new Date().toISOString() }),
        })
        return res.ok
      },
    }
  }
  // Bestandsmodus: alleen lezen (de verrijkingsvelden bestaan hier niet).
  const { matches } = await import('../src/data/matches.js')
  return {
    async getMatches() {
      return matches.map((m) => ({ ...m, venue: null, temp_c: null, lineup: null, photo: null }))
    },
    async update() {
      log('  (bestandsmodus: niets weggeschreven)')
      return false
    },
  }
}

function utcDatum(iso) {
  return new Date(iso).toISOString().slice(0, 10)
}

async function main() {
  const opslag = await maakOpslag()
  const matches = await opslag.getMatches()
  const nu = Date.now()

  // Alleen echte wedstrijden waarvan de teams bekend zijn en die al begonnen
  // zijn (opstelling is dan definitief). In --only mag een toekomstige toch.
  const teDoen = matches.filter((m) => {
    if (ONLY && m.id !== ONLY) return false
    if (!m.teamB || m.teamA === 'Nog te bepalen') return false
    const kickoffMs = new Date(m.kickoff).getTime()
    const begonnen = kickoffMs <= nu
    if (!begonnen && !ONLY) return false
    // Buiten het gratis API-venster (~3 dagen) toch niet meer proberen
    const teOud = kickoffMs < nu - 3 * 24 * 60 * 60 * 1000
    if (teOud && !ONLY) return false
    const mist = !m.venue || m.temp_c == null || !m.lineup || !m.photo
    return mist
  })

  if (teDoen.length === 0) {
    log('Niets te verrijken.')
    return
  }

  // Fixtures per datum hergebruiken (scheelt API-requests)
  const fixturesCache = new Map()
  let bijgewerkt = 0

  for (const m of teDoen) {
    const naam = `${m.teamA} – ${m.teamB}`
    try {
      const datum = utcDatum(m.kickoff)
      if (!fixturesCache.has(datum)) {
        fixturesCache.set(datum, await fetchFixturesByDate(datum, API_KEY))
      }
      const fx = findFixture(fixturesCache.get(datum), m.teamA, m.teamB)
      if (!fx) {
        log(`· Geen fixture gevonden: ${naam} (${datum})`)
        continue
      }

      const venue = resolveVenue(fx.fixture?.venue?.name)
      const velden = {}

      // Stadion (statisch; mag altijd bijgewerkt)
      if (!m.venue) {
        velden.venue = fx.fixture?.venue?.name ?? null
        velden.city = venue?.city ?? fx.fixture?.venue?.city ?? null
        velden.capacity = venue?.capacity ?? null
        velden.venue_tz = venue?.tz ?? null
        velden.apisports_fixture_id = fx.fixture?.id ?? null
      }

      // Stadionfoto + bronvermelding (los van de naam, zodat al gevulde
      // wedstrijden alsnog een foto krijgen)
      if (!m.photo && venue?.photo) {
        velden.photo = venue.photo
        velden.photo_credit = venue.photoCredit ?? null
      }

      // Weer bij aftrap (write-once)
      if (m.temp_c == null && venue) {
        try {
          const w = await fetchWeather(venue.lat, venue.lng, m.kickoff)
          if (w) Object.assign(velden, w)
        } catch (e) {
          log(`  weer overgeslagen voor ${naam}: ${e.message}`)
        }
      }

      // Opstelling bij aftrap (write-once, spoilervrij)
      if (!m.lineup) {
        const lu = await fetchLineups(fx.fixture.id, API_KEY)
        const lineup = buildLineup(lu, m.teamA, m.teamB, new Date().toISOString())
        if (lineup) velden.lineup = lineup
        else log(`· Opstelling nog niet beschikbaar: ${naam}`)
      }

      if (Object.keys(velden).length === 0) {
        log(`· Niets nieuws: ${naam}`)
        continue
      }

      if (DRY) {
        console.log(`\n=== ${naam} (fixture ${fx.fixture.id}) ===`)
        console.log(JSON.stringify(toonbaar(velden), null, 2))
      } else if (await opslag.update(m.id, velden)) {
        bijgewerkt++
        const wat = [
          velden.venue && 'stadion',
          velden.temp_c != null && 'weer',
          velden.lineup && 'opstelling',
        ]
          .filter(Boolean)
          .join(' + ')
        console.log(`✓ ${naam}: ${wat}`)
      }
    } catch (e) {
      log(`· Overgeslagen ${naam}: ${e.message}`)
    }
  }

  if (!DRY && bijgewerkt > 0) {
    console.log(`${bijgewerkt} wedstrijd(en) verrijkt${DB_MODE ? ' in Supabase' : ''}.`)
  } else if (!DRY) {
    log('Niets nieuws weggeschreven.')
  }
}

// Compacte weergave voor --dry: de opstelling als korte regels.
function toonbaar(velden) {
  const v = { ...velden }
  if (v.lineup) {
    const fmt = (t) =>
      `${t.formation} · coach ${t.coach} · basis ${t.start.length} · bank ${t.subs.length}`
    v.lineup = {
      a: fmt(v.lineup.a),
      b: fmt(v.lineup.b),
      basisA: v.lineup.a.start.map((p) => `${p.n} ${p.name}`),
      basisB: v.lineup.b.start.map((p) => `${p.n} ${p.name}`),
    }
  }
  return v
}

try {
  await main()
} catch (fout) {
  console.error(`Verrijken mislukt: ${fout.message}`)
  process.exit(1)
}
