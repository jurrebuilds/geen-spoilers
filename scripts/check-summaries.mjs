#!/usr/bin/env node
// Zoekt automatisch NOS-samenvattingen voor gespeelde wedstrijden en vult het
// youtubeId in: NOS-samenvattingstitel (zie lijktSamenvatting) + beide teamnamen.
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
const ETAPPES_URL = new URL('../src/data/etappes.js', import.meta.url)
const DB_MODE = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY,
)

// Bronnen: kanaalfeed van NOS Sport + WK2026-playlist. Feeds tonen alleen
// de ~15 nieuwste video's, dus draai dit script regelmatig (elke ochtend
// of gewoon via npm run dev). SPOILERVRIJ_FEEDS overschrijft (voor tests).
// SPOILERVRIJ_TOUR_PLAYLIST voegt optioneel de NOS Tour-playlist toe: tijdens
// de WK/Tour-overlap kan een etappevideo binnen uren uit de kanaalfeed draaien.
const FEEDS = process.env.SPOILERVRIJ_FEEDS
  ? process.env.SPOILERVRIJ_FEEDS.split(',')
  : [
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCT4oPufBQa0f6C67Fw_HXNg',
      'https://www.youtube.com/feeds/videos.xml?playlist_id=PLnJJ42LOJsdFm1NIMUr_jjZFvvJ29NIUb',
      ...(process.env.SPOILERVRIJ_TOUR_PLAYLIST
        ? [
            `https://www.youtube.com/feeds/videos.xml?playlist_id=${process.env.SPOILERVRIJ_TOUR_PLAYLIST}`,
          ]
        : []),
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

// Video's rondom een wedstrijd die géén wedstrijdsamenvatting zijn (halftime
// show, ceremonies, persconferenties, voor-/nabeschouwingen) dragen soms
// hetzelfde NOS-metaformat "... | WK2026" mét beide teamnamen — en kunnen
// zelfs "samenvatting" in de titel hebben ("samenvatting van de halftime
// show", zo kreeg de finale de show i.p.v. de wedstrijd). Deze woorden staan
// nooit in een echte wedstrijdsamenvatting, dus uitsluiten kost geen treffers.
// Titels zijn al genormaliseerd (kleine letters, koppeltekens -> spaties).
const GEEN_WEDSTRIJDVIDEO =
  /\bhalf\s?time\b|\bhalftime\b|\brustshow\b|\bshow\b|ceremonie\b|\bopening\b|\bpersconferentie\b|\bvoorbeschouwing\b|\bnabeschouwing\b|\binterview\b|\breactie\b|\bhuldiging\b|\boptreden\b|\baftermovie\b/

// Herkent een NOS-samenvatting aan de titel. Meestal staat het woord
// "samenvatting" erin, maar soms vergeet NOS dat (bijv. "Verenigde Staten -
// Paraguay | Groep D | WK2026" stond zonder dat woord online). Daarom
// accepteren we ook het vaste NOS-metaformat "... | WK2026". Korte goal-clips
// zijn losse zinnen zonder dat format en blijven dus buiten beeld. Een nog
// lopende live-uitzending ("live" in de titel) sluiten we uit: die start op het
// live-moment en zou de stand kunnen verraden.
function lijktSamenvatting(titel) {
  if (/\blive\b/.test(titel)) return false
  if (GEEN_WEDSTRIJDVIDEO.test(titel)) return false
  return titel.includes('samenvatting') || /\|\s*wk\s?2026\b/.test(titel)
}

// Herkent de NOS-samenvatting van één specifieke Tour-etappe. NOS titelt die
// in 2026 als "Highlights etappe 4 ... | Tour de France 2026" (geverifieerd in
// de kanaalfeed); "samenvatting" accepteren we ook, voor als ze wisselen.
// De \b om het nummer is essentieel: "etappe 1" is een substring van
// "etappe 15" en zou anders de verkeerde video aan een etappe koppelen.
// Praatprogramma's als "De Avondetappe" vallen af doordat het sleutelwoord
// verplicht is én \betappe niet matcht binnen "avondetappe". Vrouwen-etappes
// (Tour de France Femmes, vanaf 1 augustus) sluiten we expliciet uit, net als
// titels die een winnaar verklappen — NOS zet die woorden nooit in een
// samenvattingstitel, dus dit kost geen echte treffers.
function lijktEtappeSamenvatting(titel, etappeNr) {
  if (/\blive\b/.test(titel)) return false
  if (!titel.includes('samenvatting') && !titel.includes('highlights')) {
    return false
  }
  if (/\bvrouwen\b|\bfemmes\b/.test(titel)) return false
  if (/\bwint\b|\bwinnaar\b|\bzege\b/.test(titel)) return false
  return (
    new RegExp(`\\betappe ${etappeNr}\\b`).test(titel) && /\btour\b/.test(titel)
  )
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
// staat de NOS-samenvatting buiten beeld.
async function zoekKandidaten(wedstrijd) {
  // Tour: NOS noemt etappesamenvattingen "Highlights", dus zo zoeken we ook
  const q =
    wedstrijd.sport === 'tour'
      ? `NOS highlights etappe ${wedstrijd.etappeNr} Tour de France 2026`
      : `NOS samenvatting ${wedstrijd.teamA} ${wedstrijd.teamB} WK2026`
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

// Vul het youtubeId in op de regel van deze wedstrijd
function vulIn(bron, matchId, veld, videoId) {
  const regels = bron.split('\n')
  const i = regels.findIndex(
    (r) => r.includes(`id: '${matchId}'`) && r.includes(`${veld}: null`),
  )
  if (i === -1) return null
  regels[i] = regels[i].replace(`${veld}: null`, `${veld}: '${videoId}'`)
  return regels.join('\n')
}

// Databaserij -> appvorm (inline, zodat dit script geen frontend-modules laadt).
// sport valt terug op 'wk' zodat dit ook klopt vóór de Tour-migratie.
const fromRow = (r) => ({
  id: r.id,
  teamA: r.team_a,
  teamB: r.team_b ?? '',
  kickoff: r.kickoff,
  youtubeId: r.youtube_id ?? null,
  sport: r.sport ?? 'wk',
  etappeNr: r.etappe_nr ?? null,
})

// De opslag verschilt per modus, de zoeklogica eronder is identiek.
async function maakOpslag() {
  if (DB_MODE) {
    // Via de REST-API i.p.v. de SDK: geen WebSocket nodig (de SDK eist die op
    // oudere Node-versies), werkt overal. De service-sleutel omzeilt RLS.
    const base = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_KEY
    const headers = { apikey: key, Authorization: `Bearer ${key}` }
    const veldNaam = { youtubeId: 'youtube_id' }
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

  // Bestandsmodus: wedstrijden én etappes, elk in hun eigen databestand.
  // vul() probeert beide bronnen; alleen gewijzigde bestanden worden geschreven.
  const bestanden = [
    { url: MATCHES_URL, bron: await readFile(MATCHES_URL, 'utf8'), gewijzigd: false },
    { url: ETAPPES_URL, bron: await readFile(ETAPPES_URL, 'utf8'), gewijzigd: false },
  ]
  return {
    async getMatches() {
      const { matches } = await import(MATCHES_URL.href)
      const { etappes } = await import(ETAPPES_URL.href)
      return [...matches, ...etappes]
    },
    async vul(matchId, veld, videoId) {
      for (const bestand of bestanden) {
        const nieuw = vulIn(bestand.bron, matchId, veld, videoId)
        if (nieuw) {
          bestand.bron = nieuw
          bestand.gewijzigd = true
          return true
        }
      }
      return false
    },
    async klaar() {
      for (const bestand of bestanden) {
        if (bestand.gewijzigd) await writeFile(bestand.url, bestand.bron)
      }
    },
  }
}

async function main() {
  const opslag = await maakOpslag()
  const matches = await opslag.getMatches()
  const nu = Date.now()
  // WK: pas checken als beide teams bekend zijn. Tour: elke etappe is vooraf
  // bekend, dus alleen het etappenummer is vereist. De etappesamenvatting
  // verschijnt pas 's avonds; de cron probeert het gewoon elke run opnieuw.
  const speelbaar = (m) =>
    m.sport === 'tour' ? Boolean(m.etappeNr) : Boolean(m.teamB)
  const teChecken = matches.filter(
    (m) => speelbaar(m) && new Date(m.kickoff).getTime() < nu && !m.youtubeId,
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
    const isTour = wedstrijd.sport === 'tour'
    // teamA is bij een etappe de leesbare naam ("Etappe 5")
    const naam = isTour
      ? `${wedstrijd.teamA} (Tour)`
      : `${wedstrijd.teamA} – ${wedstrijd.teamB}`
    const bevatTeams = (e) =>
      naamVarianten(wedstrijd.teamA).some((v) => e.titel.includes(v)) &&
      naamVarianten(wedstrijd.teamB).some((v) => e.titel.includes(v))
    // Herkent één titel als dé samenvatting van deze wedstrijd/etappe
    const pastBijDeze = isTour
      ? (e) => lijktEtappeSamenvatting(e.titel, wedstrijd.etappeNr)
      : (e) => bevatTeams(e) && lijktSamenvatting(e.titel)

    // Zoekt de eerste écht bruikbare video: afspeelbaar, en — bij een
    // zoek-treffer — ook echt van NOS. Eerst de feeds (per definitie NOS),
    // anders een gerichte YouTube-zoek (lui: max één per wedstrijd).
    // SPOILERVEILIG: we pakken niet zomaar de eerste titel-match. Een niet-NOS
    // video kan de stand in de titel hebben ("... (1-1)"); die slaan we over en
    // we zoeken door naar de NOS-versie.
    let zoekPool = null
    const vindBruikbaar = async (past) => {
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

    // Samenvatting
    if (!wedstrijd.youtubeId) {
      const treffer = await vindBruikbaar(pastBijDeze)
      if (!treffer) {
        if (!STIL) console.log(`· Nog geen samenvatting: ${naam}`)
      } else if (await opslag.vul(wedstrijd.id, 'youtubeId', treffer.videoId)) {
        toegevoegd++
        console.log(`✓ Samenvatting toegevoegd: ${naam}`)
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
