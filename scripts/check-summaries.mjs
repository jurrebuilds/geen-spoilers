#!/usr/bin/env node
// Zoekt automatisch NOS-video's voor gespeelde wedstrijden en vult ze in:
// - samenvatting (youtubeId): titel bevat "samenvatting" + beide teamnamen
// - terugkijkbare livestream (livestreamId): titel bevat "live" + beide
//   teamnamen. Pas vanaf 4 uur na de aftrap, zodat we nooit een nog lopende
//   stream toevoegen (die zou op het live-moment starten en de stand verraden).
//
// Twee modi:
// - DB-modus: als SUPABASE_URL + SUPABASE_SERVICE_KEY gezet zijn (zo draait de
//   GitHub Actions-cron), schrijft hij naar de Supabase-tabel.
// - Bestandsmodus: anders bewerkt hij src/data/matches.js (lokaal, zonder setup).
//
// Elke gevonden video wordt via oEmbed gecheckt op afspeelbaarheid.
// SPOILERVEILIG: dit script drukt nooit videotitels af.
//
// Gebruik: npm run check  (draait ook automatisch bij npm run dev)

import { readFile, writeFile } from 'node:fs/promises'

const MATCHES_URL = new URL('../src/data/matches.js', import.meta.url)
const DB_MODE = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY,
)

// Bronnen: kanaalfeed van NOS Sport + WK2026-playlist. Feeds tonen alleen
// de ~15 nieuwste video's, dus draai dit script regelmatig (elke ochtend
// of gewoon via npm run dev). SPOILERVRIJ_FEEDS overschrijft (voor tests).
const FEEDS = process.env.SPOILERVRIJ_FEEDS
  ? process.env.SPOILERVRIJ_FEEDS.split(',')
  : [
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCT4oPufBQa0f6C67Fw_HXNg',
      'https://www.youtube.com/feeds/videos.xml?playlist_id=PLnJJ42LOJsdFm1NIMUr_jjZFvvJ29NIUb',
    ]

// Alternatieve schrijfwijzen die NOS weleens gebruikt
const ALIASSEN = {
  'Bosnië en Herzegovina': ['bosnie'],
  'Verenigde Staten': ['verenigde staten', 'amerika'],
  'DR Congo': ['congo'],
}

const STIL = process.argv.includes('--stil')

function normaliseer(tekst) {
  return tekst
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function decodeerEntities(tekst) {
  return tekst
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function naamVarianten(team) {
  return [normaliseer(team), ...(ALIASSEN[team] || [])]
}

async function haalFeed(bron) {
  let xml
  if (bron.startsWith('http')) {
    const res = await fetch(bron)
    if (!res.ok) throw new Error(`feed gaf ${res.status}`)
    xml = await res.text()
  } else {
    xml = await readFile(bron, 'utf8')
  }
  const entries = []
  for (const blok of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const videoId = blok[1].match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]
    const titel = blok[1].match(/<media:title>([^<]*)<\/media:title>/)?.[1]
    if (videoId && titel) {
      entries.push({ videoId, titel: normaliseer(decodeerEntities(titel)) })
    }
  }
  return entries
}

async function isEmbedbaar(videoId) {
  const res = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
  )
  return res.ok
}

// Vul een veld (youtubeId of livestreamId) in op de regel van deze wedstrijd
function vulIn(bron, matchId, veld, videoId) {
  const regels = bron.split('\n')
  const i = regels.findIndex(
    (r) => r.includes(`id: '${matchId}'`) && r.includes(`${veld}: null`),
  )
  if (i === -1) return null
  regels[i] = regels[i].replace(`${veld}: null`, `${veld}: '${videoId}'`)
  return regels.join('\n')
}

// Databaserij -> appvorm (inline, zodat dit script geen frontend-modules laadt)
const fromRow = (r) => ({
  id: r.id,
  teamA: r.team_a,
  teamB: r.team_b ?? '',
  kickoff: r.kickoff,
  youtubeId: r.youtube_id ?? null,
  livestreamId: r.livestream_id ?? null,
})

// De opslag verschilt per modus, de zoeklogica eronder is identiek.
async function maakOpslag() {
  if (DB_MODE) {
    const { createClient } = await import('@supabase/supabase-js')
    const db = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      { auth: { persistSession: false } },
    )
    const veldNaam = { youtubeId: 'youtube_id', livestreamId: 'livestream_id' }
    return {
      async getMatches() {
        const { data, error } = await db
          .from('matches')
          .select('*')
          .order('kickoff', { ascending: true })
        if (error) throw new Error(`Supabase: ${error.message}`)
        return (data || []).map(fromRow)
      },
      async vul(matchId, veld, videoId) {
        const { error } = await db
          .from('matches')
          .update({ [veldNaam[veld]]: videoId, updated_at: new Date().toISOString() })
          .eq('id', matchId)
        return !error
      },
      async klaar() {},
    }
  }

  // Bestandsmodus
  let bron = await readFile(MATCHES_URL, 'utf8')
  let gewijzigd = false
  return {
    async getMatches() {
      const { matches } = await import(MATCHES_URL.href)
      return matches
    },
    async vul(matchId, veld, videoId) {
      const nieuw = vulIn(bron, matchId, veld, videoId)
      if (!nieuw) return false
      bron = nieuw
      gewijzigd = true
      return true
    },
    async klaar() {
      if (gewijzigd) await writeFile(MATCHES_URL, bron)
    },
  }
}

async function main() {
  const opslag = await maakOpslag()
  const matches = await opslag.getMatches()
  const nu = Date.now()
  const teChecken = matches.filter(
    (m) =>
      m.teamB &&
      new Date(m.kickoff).getTime() < nu &&
      (!m.youtubeId || !m.livestreamId),
  )

  if (teChecken.length === 0) {
    if (!STIL) console.log('Geen gespeelde wedstrijden zonder samenvatting.')
    return
  }

  const resultaten = await Promise.allSettled(FEEDS.map(haalFeed))
  const entries = []
  const gezien = new Set()
  for (const r of resultaten) {
    if (r.status !== 'fulfilled') continue
    for (const e of r.value) {
      if (!gezien.has(e.videoId)) {
        gezien.add(e.videoId)
        entries.push(e)
      }
    }
  }
  if (entries.length === 0) throw new Error('geen enkele feed bereikbaar')

  let toegevoegd = 0

  for (const wedstrijd of teChecken) {
    const naam = `${wedstrijd.teamA} – ${wedstrijd.teamB}`
    const bevatTeams = (e) =>
      naamVarianten(wedstrijd.teamA).some((v) => e.titel.includes(v)) &&
      naamVarianten(wedstrijd.teamB).some((v) => e.titel.includes(v))

    // 1. Samenvatting
    if (!wedstrijd.youtubeId) {
      const treffer = entries.find(
        (e) => e.titel.includes('samenvatting') && bevatTeams(e),
      )
      if (!treffer) {
        if (!STIL) console.log(`· Nog geen samenvatting: ${naam}`)
      } else if (!(await isEmbedbaar(treffer.videoId))) {
        if (!STIL) console.log(`· Gevonden maar niet afspeelbaar: ${naam}`)
      } else if (await opslag.vul(wedstrijd.id, 'youtubeId', treffer.videoId)) {
        toegevoegd++
        console.log(`✓ Samenvatting toegevoegd: ${naam}`)
      }
    }

    // 2. Terugkijkbare livestream (pas als de wedstrijd zeker is afgelopen)
    const klaar =
      nu > new Date(wedstrijd.kickoff).getTime() + 4 * 60 * 60 * 1000
    if (!wedstrijd.livestreamId && klaar) {
      const treffer = entries.find(
        (e) =>
          /\blive\b/.test(e.titel) &&
          !e.titel.includes('samenvatting') &&
          bevatTeams(e),
      )
      if (
        treffer &&
        (await isEmbedbaar(treffer.videoId)) &&
        (await opslag.vul(wedstrijd.id, 'livestreamId', treffer.videoId))
      ) {
        toegevoegd++
        console.log(`✓ Livestream toegevoegd: ${naam}`)
      }
    }
  }

  await opslag.klaar()
  if (toegevoegd > 0) {
    console.log(
      `${toegevoegd} video('s) ingevuld${DB_MODE ? ' in Supabase' : ' in src/data/matches.js'}.`,
    )
  } else if (!STIL) {
    console.log('Niets nieuws gevonden.')
  }
}

try {
  await main()
} catch (fout) {
  // nooit de dev-server blokkeren, bijv. zonder internet
  console.log(`Samenvattingen-check overgeslagen (${fout.message})`)
}
