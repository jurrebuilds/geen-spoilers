import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  supabaseConfigured,
} from './supabase.js'
import { matches as localMatches } from '../data/matches.js'
import { etappes as localEtappes } from '../data/etappes.js'

// Databaserij (snake_case) -> appvorm (camelCase) die de rest van de app gebruikt
export function fromRow(r) {
  return {
    id: r.id,
    teamA: r.team_a,
    teamB: r.team_b ?? '',
    flagA: r.flag_a ?? '',
    flagB: r.flag_b ?? '',
    kickoff: r.kickoff,
    stage: r.stage ?? '',
    youtubeId: r.youtube_id ?? null,
    // Tour de France-etappe of WK-wedstrijd. Valt terug op 'wk' zodat dit ook
    // klopt zolang de sport-kolom nog niet in de database bestaat.
    sport: r.sport ?? 'wk',
    etappeNr: r.etappe_nr ?? null,
    startPlaats: r.start_plaats ?? null,
    finishPlaats: r.finish_plaats ?? null,
    afstandKm: r.afstand_km ?? null,
    etappeType: r.etappe_type ?? null,
    // Verrijking onder de video (mag ontbreken: dan tonen we die secties niet)
    venue: r.venue ?? null,
    city: r.city ?? null,
    capacity: r.capacity ?? null,
    venueTz: r.venue_tz ?? null,
    attendance: r.attendance ?? null,
    tempC: r.temp_c ?? null,
    windKmh: r.wind_kmh ?? null,
    weatherCode: r.weather_code ?? null,
    lineup: r.lineup ?? null,
    photo: r.photo ?? null,
    photoCredit: r.photo_credit ?? null,
  }
}

// Appvorm -> databaserij, voor het seed- en admin-scherm
export function toRow(m) {
  return {
    id: m.id,
    team_a: m.teamA,
    team_b: m.teamB,
    flag_a: m.flagA,
    flag_b: m.flagB,
    kickoff: m.kickoff,
    stage: m.stage,
    youtube_id: m.youtubeId,
  }
}

// Wedstrijden + etappes samen, als Supabase niet is ingesteld of niet antwoordt
const lokaleData = [...localMatches, ...localEtappes]

// Laadt de wedstrijden uit Supabase via de REST-API (geen SDK nodig, scheelt
// laadtijd). Valt terug op de lokale lijst als Supabase nog niet is ingesteld
// of onbereikbaar is.
export async function loadMatches() {
  if (!supabaseConfigured) return lokaleData
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/matches?select=*&order=kickoff.asc`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      },
    )
    if (!res.ok) return lokaleData
    const data = await res.json()
    return Array.isArray(data) && data.length ? data.map(fromRow) : lokaleData
  } catch {
    return lokaleData
  }
}
