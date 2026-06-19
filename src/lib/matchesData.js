import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  supabaseConfigured,
} from './supabase.js'
import { matches as localMatches } from '../data/matches.js'

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

// Laadt de wedstrijden uit Supabase via de REST-API (geen SDK nodig, scheelt
// laadtijd). Valt terug op de lokale lijst als Supabase nog niet is ingesteld
// of onbereikbaar is.
export async function loadMatches() {
  if (!supabaseConfigured) return localMatches
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
    if (!res.ok) return localMatches
    const data = await res.json()
    return Array.isArray(data) && data.length ? data.map(fromRow) : localMatches
  } catch {
    return localMatches
  }
}
