#!/usr/bin/env node
// Zet de wedstrijden uit src/data/matches.js één keer in Supabase.
// Draaien met:  SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npm run seed
// (de service-sleutel staat in Supabase onder Project Settings > API)

import { createClient } from '@supabase/supabase-js'
import { matches } from '../src/data/matches.js'
import { etappes } from '../src/data/etappes.js'

// Appvorm -> databaserij (inline, zodat dit script geen frontend-modules laadt).
// WK-rijen krijgen bewust géén sport-veld mee: de databasekolom heeft default
// 'wk', dus dit script werkt ook tegen een database zonder de Tour-kolommen.
const toRow = (m) => ({
  id: m.id,
  team_a: m.teamA,
  team_b: m.teamB,
  flag_a: m.flagA,
  flag_b: m.flagB,
  kickoff: m.kickoff,
  stage: m.stage,
  youtube_id: m.youtubeId,
})

// Tour-etappe -> databaserij (vereist de Tour-kolommen uit supabase/schema.sql)
const toTourRow = (e) => ({
  ...toRow(e),
  sport: 'tour',
  etappe_nr: e.etappeNr,
  start_plaats: e.startPlaats,
  finish_plaats: e.finishPlaats,
  afstand_km: e.afstandKm,
  etappe_type: e.etappeType,
})

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY
if (!url || !key) {
  console.error('Zet eerst SUPABASE_URL en SUPABASE_SERVICE_KEY in je omgeving.')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

// upsert: bestaande wedstrijden worden bijgewerkt, nieuwe toegevoegd.
// Bestaande youtube_id's overschrijven we niet met null (zie merge hieronder).
const { data: bestaand } = await supabase
  .from('matches')
  .select('id, youtube_id')
const reedsIngevuld = new Map((bestaand || []).map((r) => [r.id, r]))

const metBestaandeVideo = (rij) => {
  const oud = reedsIngevuld.get(rij.id)
  // een al gevonden video in de database niet per ongeluk wissen
  if (oud?.youtube_id && !rij.youtube_id) rij.youtube_id = oud.youtube_id
  return rij
}

// Twee losse upserts: PostgREST eist dat alle rijen in één bulk dezelfde
// kolommen hebben, en WK-rijen sturen de Tour-kolommen bewust niet mee.
const wkRijen = matches.map((m) => metBestaandeVideo(toRow(m)))
const { error } = await supabase.from('matches').upsert(wkRijen, { onConflict: 'id' })
if (error) {
  console.error('Seeden mislukt:', error.message)
  process.exit(1)
}

const tourRijen = etappes.map((e) => metBestaandeVideo(toTourRow(e)))
const { error: tourFout } = await supabase
  .from('matches')
  .upsert(tourRijen, { onConflict: 'id' })
if (tourFout) {
  // WK staat er dan al wel in; meld duidelijk wat er misging (waarschijnlijk
  // ontbreken de Tour-kolommen nog — voer eerst supabase/schema.sql uit).
  console.error('Tour-etappes seeden mislukt:', tourFout.message)
  console.error('Draai eerst het Tour-blok uit supabase/schema.sql in de SQL-editor.')
  process.exit(1)
}
console.log(
  `${wkRijen.length} wedstrijden en ${tourRijen.length} etappes in Supabase gezet.`,
)
