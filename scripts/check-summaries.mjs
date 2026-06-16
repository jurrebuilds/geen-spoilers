#!/usr/bin/env node
// Zoekt automatisch NOS-video's voor gespeelde wedstrijden en vult ze in:
// - samenvatting (youtubeId): NOS-samenvattingstitel (zie lijktSamenvatting)
//   + beide teamnamen
// - terugkijkbare livestream (livestreamId): titel bevat "live" + beide
//   teamnamen. Pas vanaf 4 uur na de aftrap, zodat we nooit een nog lopende
//   stream toevoegen (die zou op het live-moment starten en de stand verraden).
//
// Twee modi:
// - DB-modus: als SUPABASE_URL + SUPABASE_SERVICE_KEY gezet zijn (zo draait de
//   GitHub Actions-cron), schrijft hij naar de Supabase-tabel.
// - Bestandsmodus: anders bewerkt hij src/data/matches.js (lokaal, zonder setup).
//
// Bron is primair de NOS-RSS-feed; als die onbereikbaar is (YouTube wees het
// feeds-endpoint tijdelijk breed met 404 af) valt het script per wedstrijd
// terug op een NOS-gerichte YouTube-zoek (zie zoekKandidaten).
// Elke gevonden video wordt via oEmbed gecheckt op afspeelbaarheid; een
// zoek-treffer moet bovendien echt van NOS zijn.
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

// Alternatieve schrijfwijzen die NOS weleens gebruikt. Aliassen worden door
// naamVarianten genormaliseerd, dus ze mogen hier gewoon natuurlijk (met
// hoofdletters/accenten). Koppelteken-vs-spatie hoeft hier NIET: normaliseer
// maakt daar al één vorm van (Zuid-Korea == Zuid Korea). Alleen écht andere
// namen horen hier. Houd ze onderscheidend: te korte aliassen (bijv. "vs")
// geven valse treffers.
const ALIASSEN = {
  'Bosnië en Herzegovina': ['Bosnië'],
  'Verenigde Staten': ['Amerika'],
  'DR Congo': ['Congo'],
  // NOS titelt dit als "Saudi-Arabië", de app gebruikt "Saoedi-Arabië"
  'Saoedi-Arabië': ['Saudi-Arabië'],
  'Zuid-Korea': ['Korea'],
  'Oezbekistan': ['Uzbekistan'],
  'Turkije': ['Türkiye'],
  'Irak': ['Iraq'],
}

const STIL = process.argv.includes('--stil')

function normaliseer(tekst) {
  return tekst
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // accenten weg: \u00e9 -> e
    .replace(/[-\u2013\u2014]/g, ' ') // koppeltekens -> spatie (Zuid-Korea == Zuid Korea)
    .replace(/\s+/g, ' ') // dubbele spaties samen
    .trim()
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
  return [team, ...(ALIASSEN[team] || [])].map(normaliseer)
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

// Herkent een NOS-samenvatting aan de titel. Meestal staat het woord
// "samenvatting" erin, maar soms vergeet NOS dat (bijv. "Verenigde Staten -
// Paraguay | Groep D | WK2026" stond zonder dat woord online). Daarom
// accepteren we ook het vaste NOS-metaformat "... | WK2026". Korte goal-clips
// zijn losse zinnen zonder dat format en blijven dus buiten beeld. Een nog
// terugkijkbare livestream ("live" in de titel) sluiten we hier uit; die heeft
// een eigen tak verderop, want hij start op het live-moment en verraadt de stand.
function lijktSamenvatting(titel) {
  if (/\blive\b/.test(titel)) return false
  return titel.includes('samenvatting') || /\|\s*wk\s?2026\b/.test(titel)
}

// oEmbed-info (of null als de video niet afspeelbaar/embedbaar is). Geeft o.a.
// author_name terug, zodat we bij de zoek-fallback kunnen eisen dat de video
// echt van NOS is — de RSS-feed is dat per definitie, zoekresultaten niet.
async function haalVideoInfo(videoId) {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    )
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function isNos(info) {
  return /\bnos\b/i.test(info?.author_name || '')
}

// Terugval als de RSS-feeds onbereikbaar zijn (zoals gebeurde toen YouTube het
// feeds-endpoint breed met 404 begon af te wijzen): zoek de wedstrijd
// rechtstreeks op YouTube en lever dezelfde {videoId, titel}-vorm als de feeds.
// De aanroeper past er exact dezelfde spoilerveilige filters op toe en checkt
// bovendien via oEmbed dat de video van NOS komt.
// De query bevat bewust "NOS samenvatting": zonder die woorden ranken de
// FIFA-clips en niet-NOS video's (vaak mét de stand in de titel) bovenaan en
// staat de NOS-samenvatting buiten beeld. Deze fallback mikt dus op
// samenvattingen; livestreams blijven via de feeds lopen.
async function zoekKandidaten(wedstrijd) {
  const q = `NOS samenvatting ${wedstrijd.teamA} ${wedstrijd.teamB} WK2026`
  const url =
    'https://www.youtube.com/results?search_query=' + encodeURIComponent(q)
  let html
  try {
    const res = await fetch(url, { headers: { 'Accept-Language': 'nl-NL' } })
    if (!res.ok) return []
    html = await res.text()
  } catch {
    return []
  }
  const entries = []
  const gezien = new Set()
  const re =
    /"videoId":"([\w-]{11})","thumbnail".*?"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"\}/g
  let m
  while ((m = re.exec(html)) !== null && entries.length < 15) {
    if (gezien.has(m[1])) continue
    gezien.add(m[1])
    let tekst
    try {
      tekst = JSON.parse(`"${m[2]}"`) // ontsnapt \uXXXX, \" etc.
    } catch {
      continue
    }
    entries.push({ videoId: m[1], titel: normaliseer(decodeerEntities(tekst)) })
  }
  return entries
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
    // Via de REST-API i.p.v. de SDK: geen WebSocket nodig (de SDK eist die op
    // oudere Node-versies), werkt overal. De service-sleutel omzeilt RLS.
    const base = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_KEY
    const headers = { apikey: key, Authorization: `Bearer ${key}` }
    const veldNaam = { youtubeId: 'youtube_id', livestreamId: 'livestream_id' }
    return {
      async getMatches() {
        const res = await fetch(
          `${base}/rest/v1/matches?select=*&order=kickoff.asc`,
          { headers },
        )
        if (!res.ok) throw new Error(`Supabase gaf ${res.status}`)
        return (await res.json()).map(fromRow)
      },
      async vul(matchId, veld, videoId) {
        const res = await fetch(`${base}/rest/v1/matches?id=eq.${matchId}`, {
          method: 'PATCH',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            [veldNaam[veld]]: videoId,
            updated_at: new Date().toISOString(),
          }),
        })
        return res.ok
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
  // Feeds onbereikbaar is niet langer fataal: we vallen per wedstrijd terug op
  // een gerichte YouTube-zoekopdracht (zie zoekKandidaten).
  if (entries.length === 0 && !STIL) {
    console.log('Geen RSS-feed bereikbaar — terugval op YouTube-zoek per wedstrijd.')
  }

  let toegevoegd = 0

  for (const wedstrijd of teChecken) {
    const naam = `${wedstrijd.teamA} – ${wedstrijd.teamB}`
    const bevatTeams = (e) =>
      naamVarianten(wedstrijd.teamA).some((v) => e.titel.includes(v)) &&
      naamVarianten(wedstrijd.teamB).some((v) => e.titel.includes(v))

    // Zoekt de eerste écht bruikbare video: afspeelbaar, en — bij een
    // zoek-treffer — ook echt van NOS. Eerst de feeds (per definitie NOS),
    // anders een gerichte YouTube-zoek (lui: max één per wedstrijd).
    // SPOILERVEILIG: we pakken niet zomaar de eerste titel-match. Een niet-NOS
    // video kan de stand in de titel hebben ("... (1-1)"); die slaan we over en
    // we zoeken door naar de NOS-versie.
    let zoekPool = null
    const vindBruikbaar = async (predikaat) => {
      const past = (e) => bevatTeams(e) && predikaat(e)
      for (const entry of entries.filter(past)) {
        if (await haalVideoInfo(entry.videoId)) return entry
      }
      if (zoekPool === null) zoekPool = await zoekKandidaten(wedstrijd)
      for (const entry of zoekPool.filter(past)) {
        const info = await haalVideoInfo(entry.videoId)
        if (info && isNos(info)) return entry
      }
      return null
    }

    // 1. Samenvatting
    if (!wedstrijd.youtubeId) {
      const treffer = await vindBruikbaar((e) => lijktSamenvatting(e.titel))
      if (!treffer) {
        if (!STIL) console.log(`· Nog geen samenvatting: ${naam}`)
      } else if (await opslag.vul(wedstrijd.id, 'youtubeId', treffer.videoId)) {
        toegevoegd++
        console.log(`✓ Samenvatting toegevoegd: ${naam}`)
      }
    }

    // 2. Terugkijkbare livestream (pas als de wedstrijd zeker is afgelopen)
    const klaar =
      nu > new Date(wedstrijd.kickoff).getTime() + 4 * 60 * 60 * 1000
    if (!wedstrijd.livestreamId && klaar) {
      const treffer = await vindBruikbaar(
        (e) => /\blive\b/.test(e.titel) && !e.titel.includes('samenvatting'),
      )
      if (treffer && (await opslag.vul(wedstrijd.id, 'livestreamId', treffer.videoId))) {
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
    // Alleen bij een echte wijziging een Vercel-rebuild aanstoten, zodat de
    // statische SEO-pagina's de nieuwe samenvatting tonen. Geen wijziging =
    // geen deploy (voorkomt een bouwlus elke 10 minuten).
    await triggerDeploy()
  } else if (!STIL) {
    console.log('Niets nieuws gevonden.')
  }
}

// Roept de Vercel Deploy Hook aan als die is ingesteld. Faalt stil: een
// gemiste rebuild mag de cron nooit laten crashen.
async function triggerDeploy() {
  const url = process.env.VERCEL_DEPLOY_HOOK_URL
  if (!url) return
  try {
    const res = await fetch(url, { method: 'POST' })
    console.log(res.ok ? '↻ Vercel-rebuild aangestoten.' : `Deploy hook gaf ${res.status}.`)
  } catch (fout) {
    console.log(`Deploy hook overgeslagen (${fout.message}).`)
  }
}

try {
  await main()
} catch (fout) {
  // nooit de dev-server blokkeren, bijv. zonder internet
  console.log(`Samenvattingen-check overgeslagen (${fout.message})`)
}
