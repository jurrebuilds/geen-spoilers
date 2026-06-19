#!/usr/bin/env node
// Zet de wedstrijden uit src/data/matches.js één keer in Supabase.
// Draaien met:  SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npm run seed
// (de service-sleutel staat in Supabase onder Project Settings > API)

import { createClient } from '@supabase/supabase-js'
import { matches } from '../src/data/matches.js'

// Appvorm -> databaserij (inline, zodat dit script geen frontend-modules laadt)
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

const rijen = matches.map((m) => {
  const rij = toRow(m)
  const oud = reedsIngevuld.get(m.id)
  // een al gevonden video in de database niet per ongeluk wissen
  if (oud?.youtube_id && !rij.youtube_id) rij.youtube_id = oud.youtube_id
  return rij
})

const { error } = await supabase.from('matches').upsert(rijen, { onConflict: 'id' })
if (error) {
  console.error('Seeden mislukt:', error.message)
  process.exit(1)
}
console.log(`${rijen.length} wedstrijden in Supabase gezet.`)
