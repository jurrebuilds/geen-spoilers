// Hulpdata en -functies voor het verrijken van wedstrijden (enrich-matches.mjs).
// Bevat: de 16 WK-stadions (capaciteit, tijdzone, coördinaten), de koppeling
// van Nederlandse teamnamen naar de API-Football-namen, en kleine helpers om
// fixtures te matchen, de opstelling te bouwen en het weer op te halen.
//
// SPOILERVRIJ: hier wordt alleen de opstelling-endpoint gebruikt. Nooit
// /fixtures/events (doelpunten, kaarten, wissels) of de gebundelde fixture.

export function norm(tekst) {
  return (tekst || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// ── Stadions ────────────────────────────────────────────────────────────
// Gekoppeld op (genormaliseerde) stadionnaam zoals API-Football die teruggeeft.
// city = nette weergavenaam (NL), capacity in personen, tz = IANA-zone,
// lat/lng voor het weer. aliassen vangen sponsor-/FIFA-namen op.
const STADIONS = [
  { match: ['sofi stadium'], city: 'Los Angeles', capacity: 70240, tz: 'America/Los_Angeles', lat: 33.9535, lng: -118.3392 },
  { match: ['metlife stadium'], city: 'New York / New Jersey', capacity: 82500, tz: 'America/New_York', lat: 40.8135, lng: -74.0745 },
  { match: ['at t stadium', 'att stadium', 'dallas stadium', 'arlington'], city: 'Dallas', capacity: 80000, tz: 'America/Chicago', lat: 32.7473, lng: -97.0945 },
  { match: ['mercedes benz stadium', 'atlanta stadium'], city: 'Atlanta', capacity: 71000, tz: 'America/New_York', lat: 33.7553, lng: -84.4006 },
  { match: ['nrg stadium', 'houston stadium'], city: 'Houston', capacity: 72220, tz: 'America/Chicago', lat: 29.6847, lng: -95.4107 },
  { match: ['arrowhead stadium', 'geha field', 'kansas city stadium'], city: 'Kansas City', capacity: 76416, tz: 'America/Chicago', lat: 39.0489, lng: -94.4839 },
  { match: ['hard rock stadium', 'miami stadium'], city: 'Miami', capacity: 65326, tz: 'America/New_York', lat: 25.9580, lng: -80.2389 },
  { match: ['gillette stadium', 'boston stadium', 'foxborough'], city: 'Boston', capacity: 65878, tz: 'America/New_York', lat: 42.0909, lng: -71.2643 },
  { match: ['lincoln financial field', 'philadelphia stadium'], city: 'Philadelphia', capacity: 69596, tz: 'America/New_York', lat: 39.9008, lng: -75.1675 },
  { match: ['levi s stadium', 'levis stadium', 'san francisco bay area stadium', 'bay area'], city: 'San Francisco Bay Area', capacity: 68500, tz: 'America/Los_Angeles', lat: 37.4030, lng: -121.9700 },
  { match: ['lumen field', 'seattle stadium'], city: 'Seattle', capacity: 68740, tz: 'America/Los_Angeles', lat: 47.5952, lng: -122.3316 },
  { match: ['bmo field', 'toronto stadium'], city: 'Toronto', capacity: 45000, tz: 'America/Toronto', lat: 43.6332, lng: -79.4185 },
  { match: ['bc place', 'vancouver stadium'], city: 'Vancouver', capacity: 54500, tz: 'America/Vancouver', lat: 49.2768, lng: -123.1120 },
  { match: ['estadio azteca', 'estadio banorte', 'mexico city stadium'], city: 'Mexico-Stad', capacity: 87523, tz: 'America/Mexico_City', lat: 19.3029, lng: -99.1505 },
  { match: ['estadio akron', 'estadio guadalajara', 'guadalajara stadium'], city: 'Guadalajara', capacity: 48071, tz: 'America/Mexico_City', lat: 20.6818, lng: -103.4626 },
  { match: ['estadio bbva', 'estadio monterrey', 'monterrey stadium'], city: 'Monterrey', capacity: 53500, tz: 'America/Monterrey', lat: 25.6694, lng: -100.2444 },
]

// Zoekt het stadion op aan de hand van de API-naam. Geeft null als onbekend
// (dan vult het script alleen de naam in die de API gaf).
export function resolveVenue(apiName) {
  const a = norm(apiName)
  if (!a) return null
  return (
    STADIONS.find((s) => s.match.some((m) => a.includes(m) || m.includes(a))) ||
    null
  )
}

// ── Teams: Nederlands -> fragmenten zoals API-Football ze schrijft ───────
const TEAMS = {
  Mexico: ['mexico'],
  'Zuid-Afrika': ['south africa'],
  'Zuid-Korea': ['korea republic', 'south korea'],
  Tsjechië: ['czech republic', 'czechia'],
  Canada: ['canada'],
  'Bosnië en Herzegovina': ['bosnia and herzegovina', 'bosnia herzegovina'],
  Qatar: ['qatar'],
  Zwitserland: ['switzerland'],
  Brazilië: ['brazil'],
  Marokko: ['morocco'],
  Haïti: ['haiti'],
  Schotland: ['scotland'],
  'Verenigde Staten': ['usa', 'united states'],
  Paraguay: ['paraguay'],
  Australië: ['australia'],
  Turkije: ['turkey', 'turkiye'],
  Duitsland: ['germany'],
  Curaçao: ['curacao'],
  Ivoorkust: ['ivory coast', 'cote d ivoire'],
  Ecuador: ['ecuador'],
  Nederland: ['netherlands'],
  Japan: ['japan'],
  Zweden: ['sweden'],
  Tunesië: ['tunisia'],
  België: ['belgium'],
  Egypte: ['egypt'],
  Iran: ['iran'],
  'Nieuw-Zeeland': ['new zealand'],
  Spanje: ['spain'],
  Kaapverdië: ['cape verde', 'cabo verde'],
  'Saoedi-Arabië': ['saudi arabia'],
  Uruguay: ['uruguay'],
  Frankrijk: ['france'],
  Senegal: ['senegal'],
  Irak: ['iraq'],
  Noorwegen: ['norway'],
  Argentinië: ['argentina'],
  Algerije: ['algeria'],
  Oostenrijk: ['austria'],
  Jordanië: ['jordan'],
  Portugal: ['portugal'],
  'DR Congo': ['congo dr', 'dr congo', 'democratic republic'],
  Oezbekistan: ['uzbekistan'],
  Colombia: ['colombia'],
  Engeland: ['england'],
  Kroatië: ['croatia'],
  Ghana: ['ghana'],
  Panama: ['panama'],
}

function teamFragments(nlNaam) {
  return TEAMS[nlNaam] || [norm(nlNaam)]
}

function isTeam(apiNaam, nlNaam) {
  const a = norm(apiNaam)
  return teamFragments(nlNaam).some((f) => a === f || a.includes(f) || f.includes(a))
}

// Kiest uit de fixtures-van-een-dag de WK-wedstrijd met deze twee teams.
// Voorkeur voor de "World Cup"-competitie; teamvolgorde mag omgedraaid zijn.
export function findFixture(fixtures, teamA, teamB) {
  const wk = fixtures.filter((f) => norm(f.league?.name).includes('world cup'))
  const pool = wk.length ? wk : fixtures
  return (
    pool.find((f) => {
      const h = f.teams?.home?.name
      const w = f.teams?.away?.name
      return (
        (isTeam(h, teamA) && isTeam(w, teamB)) ||
        (isTeam(h, teamB) && isTeam(w, teamA))
      )
    }) || null
  )
}

// Bouwt de bevroren opstelling. De API geeft home/away; wij ordenen naar
// onze teamA/teamB. Per speler bewaren we alleen nummer, naam, positie en
// veldpositie (grid) — nooit minuut, rating of wisselinfo.
export function buildLineup(apiLineups, teamA, teamB, fetchedAtISO) {
  const pick = (nl) =>
    apiLineups.find((l) => isTeam(l.team?.name, nl)) || null
  const vorm = (l) => {
    if (!l) return null
    const spelers = (arr) =>
      (arr || []).map((x) => ({
        n: x.player?.number ?? null,
        name: x.player?.name ?? '',
        pos: x.player?.pos ?? null,
        grid: x.player?.grid ?? null,
      }))
    return {
      formation: l.formation ?? null,
      coach: l.coach?.name ?? null,
      start: spelers(l.startXI),
      subs: spelers(l.substitutes),
    }
  }
  const a = vorm(pick(teamA))
  const b = vorm(pick(teamB))
  if (!a || !b) return null
  return { a, b, fetchedAt: fetchedAtISO }
}

// ── Open-Meteo: weer bij aftrap (gratis, openbaar, geen sleutel) ─────────
// Pakt het uur dat het dichtst bij de aftrap (UTC) ligt.
export async function fetchWeather(lat, lng, kickoffISO, fetchFn = fetch) {
  const d = new Date(kickoffISO)
  const datum = d.toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
  const uur = d.toISOString().slice(0, 13) + ':00' // YYYY-MM-DDTHH:00
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&hourly=temperature_2m,wind_speed_10m,weather_code&timezone=UTC` +
    `&start_date=${datum}&end_date=${datum}`
  const res = await fetchFn(url)
  if (!res.ok) throw new Error(`Open-Meteo gaf ${res.status}`)
  const data = await res.json()
  const tijden = data.hourly?.time || []
  let i = tijden.indexOf(uur)
  if (i === -1) i = 0
  if (!tijden.length) return null
  return {
    temp_c: Math.round((data.hourly.temperature_2m[i] ?? 0) * 10) / 10,
    wind_kmh: Math.round(data.hourly.wind_speed_10m[i] ?? 0),
    weather_code: data.hourly.weather_code[i] ?? null,
  }
}

// ── API-Football ────────────────────────────────────────────────────────
const API_BASE = 'https://v3.football.api-sports.io'

async function apiGet(pad, key, fetchFn = fetch) {
  const res = await fetchFn(`${API_BASE}${pad}`, {
    headers: { 'x-apisports-key': key },
  })
  if (!res.ok) throw new Error(`API-Football gaf ${res.status} op ${pad}`)
  const data = await res.json()
  if (data.errors && Object.keys(data.errors).length) {
    throw new Error(`API-Football: ${JSON.stringify(data.errors)}`)
  }
  return data.response || []
}

export function fetchFixturesByDate(datum, key, fetchFn = fetch) {
  return apiGet(`/fixtures?date=${datum}`, key, fetchFn)
}

export function fetchLineups(fixtureId, key, fetchFn = fetch) {
  return apiGet(`/fixtures/lineups?fixture=${fixtureId}`, key, fetchFn)
}
