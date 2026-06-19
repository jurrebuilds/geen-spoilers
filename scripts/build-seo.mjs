#!/usr/bin/env node
// Genereert na `vite build` statische SEO-landingspagina's in dist/ met de
// volledige content al in de bron-HTML (geen JS nodig om te lezen). Per
// wedstrijd, team, groep en knock-outronde een eigen pagina op een echt
// URL-pad, plus een crawlbare overzichtspagina (/wedstrijden/), sitemap.xml
// en robots.txt.
//
// De pagina's hergebruiken exact dezelfde gecompileerde Tailwind-CSS als de
// app (uit dist/index.html), zodat ze er hetzelfde uitzien. Ze zijn statisch
// en linken via #wedstrijd/<id> terug naar de app.
//
// Twee databronnen, net als de andere scripts:
// - DB-modus: SUPABASE_URL + sleutel gezet (zo draait de Vercel-build) ->
//   verse data inclusief samenvatting, stadion, weer en opstelling.
// - Bestandsmodus: anders de lokale lijst uit src/data/matches.js.
//
// SPOILERVRIJ: nooit een uitslag, score of videotitel in de HTML, titels,
// descriptions of JSON-LD. De data bevat per definitie geen scores.

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { dayLabel, kickoffTime } from '../src/lib/format.js'
import { slugify, groupLetter } from '../src/lib/slug.js'

const SITE = 'https://www.geenspoilers.nl'
const DIST = new URL('../dist/', import.meta.url)

// ── Data laden ────────────────────────────────────────────────────────────
const fromRow = (r) => ({
  id: r.id,
  teamA: r.team_a,
  teamB: r.team_b ?? '',
  flagA: r.flag_a ?? '',
  flagB: r.flag_b ?? '',
  kickoff: r.kickoff,
  stage: r.stage ?? '',
  youtubeId: r.youtube_id ?? null,
  livestreamId: r.livestream_id ?? null,
  venue: r.venue ?? null,
  city: r.city ?? null,
  capacity: r.capacity ?? null,
  tempC: r.temp_c ?? null,
  windKmh: r.wind_kmh ?? null,
  weatherCode: r.weather_code ?? null,
  lineup: r.lineup ?? null,
})

async function loadMatches() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY
  if (url && key) {
    try {
      const res = await fetch(
        `${url}/rest/v1/matches?select=*&order=kickoff.asc`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } },
      )
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length) {
          console.log(`SEO: ${data.length} wedstrijden uit Supabase.`)
          return data.map(fromRow)
        }
      }
      console.log('SEO: Supabase gaf niets bruikbaars, val terug op lokale lijst.')
    } catch {
      console.log('SEO: Supabase onbereikbaar, val terug op lokale lijst.')
    }
  }
  const { matches } = await import('../src/data/matches.js')
  console.log(`SEO: ${matches.length} wedstrijden uit src/data/matches.js.`)
  return matches
}

// ── Helpers ─────────────────────────────────────────────────────────────
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const nlGetal = (n) => Number(n).toLocaleString('nl-NL')

// Een wedstrijd telt mee zodra beide teams bekend zijn (knock-out begint met
// "Nog te bepalen"); anders geen eigen pagina, dat zou thin/dubbel zijn.
const heeftTeams = (m) =>
  m.teamA && m.teamB && m.teamA !== 'Nog te bepalen' && m.teamB !== 'Nog te bepalen'

const matchPath = (m) => `/wedstrijd/${m.id}/`
const teamPath = (naam) => `/team/${slugify(naam)}/`
const groepPath = (letter) => `/groep/${letter}/`
const rondePath = (stage) => `/ronde/${slugify(stage)}/`

// WMO-weercode naar Nederlandse omschrijving (gelijk aan de speler).
function weatherLabel(code) {
  if (code == null) return null
  if (code === 0) return 'Onbewolkt'
  if (code === 1) return 'Vrijwel onbewolkt'
  if (code === 2) return 'Half bewolkt'
  if (code === 3) return 'Bewolkt'
  if (code === 45 || code === 48) return 'Mist'
  if (code >= 51 && code <= 57) return 'Motregen'
  if (code >= 61 && code <= 67) return 'Regen'
  if (code >= 71 && code <= 77) return 'Sneeuw'
  if (code >= 80 && code <= 82) return 'Buien'
  if (code >= 85 && code <= 86) return 'Sneeuwbuien'
  if (code >= 95) return 'Onweer'
  return null
}

function weerTekst(m) {
  const parts = []
  if (m.tempC != null) parts.push(`${Math.round(m.tempC)}°C`)
  const w = weatherLabel(m.weatherCode)
  if (w) parts.push(w.toLowerCase())
  if (m.windKmh != null) parts.push(`wind ${Math.round(m.windKmh)} km/u`)
  return parts.join(' · ') || null
}

// ── Layout ──────────────────────────────────────────────────────────────
function breadcrumbNav(items) {
  const parts = items.map((it, i) =>
    i === items.length - 1
      ? `<span class="text-moss">${esc(it.name)}</span>`
      : `<a href="${it.path}" class="text-moss-mid underline decoration-line underline-offset-2 hover:text-moss">${esc(it.name)}</a>`,
  )
  return `<nav aria-label="Kruimelpad" class="mt-4 text-[12px] text-moss-mid">${parts.join(' <span class="text-moss-dim">›</span> ')}</nav>`
}

function breadcrumbLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: SITE + it.path,
    })),
  }
}

let CSS_HREF = '/assets/index.css'

function layout({ title, description, path, breadcrumb = [], jsonLd = [], heading, lead, bodyHtml }) {
  const canonical = SITE + path
  const ld = [...(breadcrumb.length ? [breadcrumbLd(breadcrumb)] : []), ...jsonLd]
  const ldJson = ld.length ? JSON.stringify(ld.length === 1 ? ld[0] : ld) : ''
  return `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#0c120e" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="nl_NL" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${SITE}/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${SITE}/og-image.png" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="${CSS_HREF}" />
    ${ldJson ? `<script type="application/ld+json">${ldJson}</script>` : ''}
  </head>
  <body>
    <div class="min-h-dvh bg-night text-cream">
      <div class="mx-auto max-w-md px-[18px] pb-16" style="padding-top:calc(1.25rem + env(safe-area-inset-top))">
        <header class="flex items-center gap-3 border-b border-line/40 pb-3.5">
          <a href="/" class="text-[20px] font-extrabold leading-none tracking-[-0.025em] text-cream">Geen <span class="text-oranje">Spoilers</span></a>
        </header>
        ${breadcrumb.length ? breadcrumbNav(breadcrumb) : ''}
        <main class="pt-5">
          <h1 class="text-[26px] font-extrabold leading-[1.1] tracking-[-0.02em]">${esc(heading)}</h1>
          ${lead ? `<p class="mt-2 text-[14px] font-medium leading-normal text-moss">${esc(lead)}</p>` : ''}
          ${bodyHtml}
        </main>
        <footer class="mt-12 border-t border-line/40 pt-5 text-center">
          <a href="/wedstrijden/" class="text-[13px] font-semibold text-moss underline decoration-line underline-offset-4 hover:text-cream">Alle wedstrijden</a>
          <p class="mt-3 text-[11.5px] leading-normal text-moss-dim">Samenvattingen via NOS Sport. Spoilervrij: geen uitslagen, geen titels.</p>
        </footer>
      </div>
    </div>
  </body>
</html>`
}

// Een rijtje "label / waarde" in een omkaderd blok
function feiten(rows) {
  const items = rows
    .filter(([, v]) => v)
    .map(
      ([k, v], i) =>
        `<div class="flex items-baseline justify-between gap-4 px-4 py-3 ${i > 0 ? 'border-t border-line' : ''}"><span class="flex-none text-[12px] font-bold uppercase tracking-[0.08em] text-moss-mid">${esc(k)}</span><span class="text-right text-[14px] font-semibold text-cream">${esc(v)}</span></div>`,
    )
    .join('')
  return `<dl class="mt-6 overflow-hidden rounded-2xl border border-line bg-pitch">${items}</dl>`
}

// Veelgestelde vragen: één bron voor zowel de zichtbare HTML als de FAQPage-
// JSON-LD, zodat de antwoordteksten exact gelijk zijn (vereiste van Google).
// <details>/<summary> is native en heeft geen JS nodig. items: [{ q, a }].
function faqBlock(items) {
  if (!items.length) return { html: '', ld: null }
  const html =
    `<h2 class="mt-9 text-[15px] font-bold uppercase tracking-[0.14em] text-moss-soft">Veelgestelde vragen</h2>` +
    `<div class="mt-3 flex flex-col gap-2">` +
    items
      .map(
        ({ q, a }) =>
          `<details class="rounded-2xl border border-line bg-pitch px-4 py-3"><summary class="cursor-pointer text-[14px] font-bold text-cream">${esc(q)}</summary><p class="mt-2 text-[13.5px] leading-relaxed text-moss">${esc(a)}</p></details>`,
      )
      .join('') +
    `</div>`
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
  return { html, ld }
}

// Een aanklikbare wedstrijdregel voor lijst-/overzichtspagina's
function matchRegel(m) {
  const titel = heeftTeams(m) ? `${m.teamA} – ${m.teamB}` : `${m.stage}`
  const rechts = m.youtubeId ? 'Samenvatting ✓' : 'Nog niet beschikbaar'
  const sub = `${dayLabel(m.kickoff)} · ${kickoffTime(m.kickoff)}`
  const inhoud = `<div class="flex items-center justify-between gap-3 rounded-2xl border border-line bg-pitch px-4 py-3 transition-colors hover:border-line-strong"><span class="min-w-0"><span class="block truncate text-[14.5px] font-bold text-cream">${esc(titel)}</span><span class="mt-0.5 block text-[12px] font-medium text-moss">${esc(sub)}</span></span><span class="flex-none text-[11.5px] font-semibold ${m.youtubeId ? 'text-oranje' : 'text-moss-dim'}">${esc(rechts)}</span></div>`
  return heeftTeams(m) ? `<a href="${matchPath(m)}">${inhoud}</a>` : inhoud
}

function matchLijst(list) {
  return `<div class="mt-5 flex flex-col gap-2">${list.map(matchRegel).join('')}</div>`
}

// ── Pagina's ────────────────────────────────────────────────────────────
function opstellingKolom(flag, naam, team) {
  if (!team) return ''
  const rijen = (team.start || [])
    .map(
      (p) =>
        `<div class="flex items-center gap-2.5 py-[5px]"><span class="w-[22px] flex-none text-right text-[12px] font-bold tabular-nums text-moss-mid">${esc(p.n ?? '')}</span><span class="text-[13px] font-semibold leading-tight text-cream">${esc(p.name)}</span></div>`,
    )
    .join('')
  const coach = team.coach
    ? `<div class="mt-3 flex items-center gap-2.5 border-t border-line pt-2.5"><span class="text-[10px] font-bold uppercase tracking-[0.12em] text-moss-dim">Coach</span><span class="text-[13px] font-bold text-cream">${esc(team.coach)}</span></div>`
    : ''
  return `<div class="rounded-2xl border border-line bg-pitch px-3 py-3.5"><div class="mb-2.5 flex items-start justify-between gap-2 border-b border-line pb-2.5"><span class="flex items-center gap-2 text-[13px] font-extrabold leading-tight"><span aria-hidden="true">${flag}</span><span>${esc(naam)}</span></span>${team.formation ? `<span class="flex-none text-[11px] font-bold tabular-nums text-oranje">${esc(team.formation)}</span>` : ''}</div>${rijen}${coach}</div>`
}

function matchPage(m, matches) {
  const naam = `${m.teamA} – ${m.teamB}`
  const letter = groupLetter(m.stage)
  const isGroep = Boolean(letter)
  const ouder = isGroep
    ? { name: m.stage, path: groepPath(letter) }
    : { name: m.stage, path: rondePath(m.stage) }
  const breadcrumb = [
    { name: 'Wedstrijden', path: '/wedstrijden/' },
    ouder,
    { name: naam, path: matchPath(m) },
  ]

  const stadion = m.venue
    ? [m.venue, m.city, m.capacity != null && `capaciteit ${nlGetal(m.capacity)}`]
        .filter(Boolean)
        .join(' · ')
    : null

  const body = []
  body.push(
    `<p class="mt-6 text-[14px] leading-relaxed text-moss">Bekijk ${esc(naam)} uit de ${esc(m.stage)} van het WK 2026 rustig terug${m.venue ? `, gespeeld in ${esc(m.venue)}` : ''}, zonder de uitslag al te kennen. Geen Spoilers verbergt scores en verklappende titels, zodat je de samenvatting kunt kijken alsof de wedstrijd nog moet beginnen.</p>`,
  )
  body.push(
    feiten([
      ['Wanneer', `${dayLabel(m.kickoff)} · ${kickoffTime(m.kickoff)}`],
      ['Toernooi', `${m.stage} · WK 2026`],
      ['Stadion', stadion],
      ['Weer bij aftrap', weerTekst(m)],
      ['Samenvatting', m.youtubeId ? 'Beschikbaar' : 'Nog niet beschikbaar'],
      ['Hele wedstrijd', m.livestreamId ? 'Terugkijkbaar' : null],
    ]),
  )

  body.push(
    `<a href="/#wedstrijd/${m.id}" class="mt-6 flex items-center justify-center rounded-full bg-oranje px-5 py-3 text-[15px] font-bold text-night transition-transform duration-150 active:scale-95">Bekijk spoilervrij in de app</a>`,
  )

  if (m.lineup) {
    body.push(
      `<h2 class="mt-9 text-[15px] font-bold uppercase tracking-[0.14em] text-moss-soft">Opstelling bij aftrap</h2>`,
      `<div class="mt-3 grid grid-cols-2 gap-2.5">${opstellingKolom(m.flagA, m.teamA, m.lineup.a)}${opstellingKolom(m.flagB, m.teamB, m.lineup.b)}</div>`,
    )
  }

  // Interne links naar verwante pagina's
  const verwant = [
    `<a href="${ouder.path}" class="text-cream underline decoration-line underline-offset-2 hover:text-oranje">${esc(m.stage)}</a>`,
    `<a href="${teamPath(m.teamA)}" class="text-cream underline decoration-line underline-offset-2 hover:text-oranje">${esc(m.teamA)}</a>`,
    `<a href="${teamPath(m.teamB)}" class="text-cream underline decoration-line underline-offset-2 hover:text-oranje">${esc(m.teamB)}</a>`,
  ]
  body.push(
    `<p class="mt-9 text-[13px] leading-relaxed text-moss">Meer terugkijken: ${verwant.join(' · ')}</p>`,
  )

  const { html: faqHtml, ld: faqLd } = faqBlock([
    {
      q: `Kan ik ${naam} terugkijken zonder de uitslag te zien?`,
      a: `Ja. Je bekijkt de samenvatting van ${naam} spoilervrij — zonder score, eindstand of verklappende titel.`,
    },
    {
      q: `Wanneer werd ${naam} gespeeld?`,
      a: `${dayLabel(m.kickoff)} om ${kickoffTime(m.kickoff)}${m.venue ? `, in ${m.venue}` : ''}, in de ${m.stage} van het WK 2026.`,
    },
    {
      q: `Is de samenvatting van ${naam} al beschikbaar?`,
      a: m.youtubeId
        ? `Ja, de samenvatting staat klaar en is hier spoilervrij terug te kijken.`
        : `Nog niet; zodra NOS Sport de samenvatting plaatst verschijnt die hier vanzelf, spoilervrij.`,
    },
  ])
  body.push(faqHtml)

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: naam,
    sport: 'Voetbal',
    startDate: m.kickoff,
    url: SITE + matchPath(m),
    description: `Samenvatting van ${naam} (${m.stage}, WK 2026) spoilervrij terugkijken.`,
    competitor: [
      { '@type': 'SportsTeam', name: m.teamA },
      { '@type': 'SportsTeam', name: m.teamB },
    ],
  }
  if (m.venue) {
    ld.location = { '@type': 'Place', name: m.venue, address: m.city || undefined }
  }

  return layout({
    title: `${naam} terugkijken · ${m.stage} WK 2026 | Geen Spoilers`,
    description: `Kijk ${naam} (${m.stage}, WK 2026) spoilervrij terug${m.venue ? ` uit ${m.venue}` : ''}. Geen uitslag, geen titel — alleen de samenvatting.`,
    path: matchPath(m),
    breadcrumb,
    jsonLd: faqLd ? [ld, faqLd] : [ld],
    heading: naam,
    lead: `${m.stage} · ${dayLabel(m.kickoff)} · ${kickoffTime(m.kickoff)}`,
    bodyHtml: body.join('\n'),
  })
}

function teamPage(naam, list) {
  const path = teamPath(naam)
  const groepen = [...new Set(list.map((m) => m.stage).filter((s) => groupLetter(s)))]
  return layout({
    title: `${naam} op het WK 2026 terugkijken | Geen Spoilers`,
    description: `Alle wedstrijden van ${naam} op het WK 2026 spoilervrij terugkijken. Bekijk de samenvattingen zonder uitslagen of titels.`,
    path,
    breadcrumb: [
      { name: 'Wedstrijden', path: '/wedstrijden/' },
      { name: naam, path },
    ],
    heading: `${naam} op het WK 2026`,
    lead: `${list.length} ${list.length === 1 ? 'wedstrijd' : 'wedstrijden'}${groepen.length ? ` · ${groepen.join(', ')}` : ''}`,
    bodyHtml:
      `<p class="mt-6 text-[14px] leading-relaxed text-moss">Volg ${esc(naam)} op het WK 2026 en kijk elke wedstrijd spoilervrij terug. Geen Spoilers houdt scores en verklappende titels uit beeld, zodat je de samenvatting kunt kijken zonder de uitslag te kennen.</p>` +
      matchLijst(list),
  })
}

function groepPage(letter, list, teams) {
  const path = groepPath(letter)
  const naam = `Groep ${letter.toUpperCase()}`
  const teamLinks = teams
    .map(
      (t) =>
        `<a href="${teamPath(t)}" class="rounded-full border border-line bg-pitch px-3.5 py-1.5 text-[13px] font-semibold text-cream transition-colors hover:border-line-strong">${esc(t)}</a>`,
    )
    .join('')
  const intro = `<p class="mt-6 text-[14px] leading-relaxed text-moss">Bekijk alle wedstrijden uit ${naam} van het WK 2026 spoilervrij terug. Geen Spoilers verbergt de scores en eindstanden, zodat je de samenvattingen kunt kijken zonder dat de afloop verklapt wordt.</p>`
  const body = `${intro}<div class="mt-6 flex flex-wrap gap-2">${teamLinks}</div>${matchLijst(list)}`
  return layout({
    title: `${naam} WK 2026 terugkijken | Geen Spoilers`,
    description: `${naam} op het WK 2026: ${teams.join(', ')}. Kijk alle wedstrijden spoilervrij terug zonder uitslagen.`,
    path,
    breadcrumb: [
      { name: 'Wedstrijden', path: '/wedstrijden/' },
      { name: naam, path },
    ],
    heading: naam,
    lead: teams.join(' · '),
    bodyHtml: body,
  })
}

function rondePage(stage, list) {
  const path = rondePath(stage)
  const bekend = list.filter(heeftTeams).length
  return layout({
    title: `${stage} WK 2026 terugkijken | Geen Spoilers`,
    description: `${stage} van het WK 2026 spoilervrij terugkijken. Bekijk de samenvattingen zodra ze beschikbaar zijn, zonder uitslagen.`,
    path,
    breadcrumb: [
      { name: 'Wedstrijden', path: '/wedstrijden/' },
      { name: stage, path },
    ],
    heading: `${stage} · WK 2026`,
    lead: bekend
      ? `${bekend} van ${list.length} wedstrijden bekend`
      : 'De deelnemers worden bekend na de voorgaande ronde',
    bodyHtml:
      `<p class="mt-6 text-[14px] leading-relaxed text-moss">Kijk de ${esc(stage)} van het WK 2026 spoilervrij terug. Zodra de samenvattingen beschikbaar zijn, bekijk je ze hier zonder scores, eindstanden of verklappende titels.</p>` +
      matchLijst(list),
  })
}

function indexPage({ groepen, rondes, teams, totaal }) {
  const sectie = (titel, linksHtml) =>
    `<h2 class="mt-9 text-[15px] font-bold uppercase tracking-[0.14em] text-moss-soft">${esc(titel)}</h2><div class="mt-3 flex flex-wrap gap-2">${linksHtml}</div>`
  const pill = (href, label) =>
    `<a href="${href}" class="rounded-full border border-line bg-pitch px-3.5 py-1.5 text-[13px] font-semibold text-cream transition-colors hover:border-line-strong">${esc(label)}</a>`

  const groepLinks = groepen
    .map((g) => pill(groepPath(g.letter), `Groep ${g.letter.toUpperCase()}`))
    .join('')
  const rondeLinks = rondes.map((r) => pill(rondePath(r.stage), r.stage)).join('')
  const teamLinks = teams.map((t) => pill(teamPath(t), t)).join('')

  const intro = `<p class="mt-6 text-[14px] leading-relaxed text-moss">Kijk alle ${totaal} wedstrijden van het WK 2026 terug zonder dat de uitslag je voor is. Kies een groep, knock-outronde of land en bekijk de samenvatting spoilervrij — zonder scores, eindstanden of verklappende videotitels.</p>`

  const { html: faqHtml, ld: faqLd } = faqBlock([
    {
      q: 'Hoe werkt spoilervrij terugkijken?',
      a: 'Je kiest een wedstrijd en bekijkt de samenvatting zonder dat de uitslag ergens in beeld komt. Geen Spoilers verbergt scores, eindstanden en verklappende videotitels.',
    },
    {
      q: 'Zie ik nergens de uitslag of score?',
      a: 'Klopt. Geen Spoilers toont geen scores, geen eindstanden en geen aanbevolen video’s die de afloop kunnen verraden.',
    },
    {
      q: 'Waar komen de samenvattingen vandaan?',
      a: 'De samenvattingen komen van NOS Sport. Wij linken er spoilervrij naartoe.',
    },
    {
      q: 'Wat kost het?',
      a: 'Niets. Geen Spoilers is gratis te gebruiken.',
    },
  ])

  return layout({
    title: 'Alle WK 2026-wedstrijden spoilervrij terugkijken | Geen Spoilers',
    description: `Bekijk alle ${totaal} wedstrijden van het WK 2026 spoilervrij terug — per groep, ronde of land. Geen uitslagen, geen titels, alleen de samenvattingen.`,
    path: '/wedstrijden/',
    breadcrumb: [{ name: 'Wedstrijden', path: '/wedstrijden/' }],
    jsonLd: faqLd ? [faqLd] : [],
    heading: 'Alle WK 2026-wedstrijden',
    lead: `${totaal} wedstrijden · ${groepen.length} groepen · ${teams.length} landen`,
    bodyHtml:
      intro +
      sectie('Groepen', groepLinks) +
      sectie('Knock-out', rondeLinks) +
      sectie('Landen', teamLinks) +
      faqHtml,
  })
}

// ── Schrijven ───────────────────────────────────────────────────────────
async function writePage(path, html) {
  const dir = new URL('.' + path, DIST)
  await mkdir(dir, { recursive: true })
  await writeFile(new URL('index.html', dir), html)
}

async function vindCssHref() {
  try {
    const html = await readFile(new URL('index.html', DIST), 'utf8')
    const m = html.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/)
    if (m) return m[1]
  } catch {
    // valt hieronder terug
  }
  // Vangnet: pak het eerste .css-bestand in dist/assets
  try {
    const files = await readdir(new URL('assets/', DIST))
    const css = files.find((f) => f.endsWith('.css'))
    if (css) return `/assets/${css}`
  } catch {
    // niets gevonden; CSS_HREF blijft de placeholder
  }
  return CSS_HREF
}

async function main() {
  CSS_HREF = await vindCssHref()
  const matches = await loadMatches()

  const echte = matches.filter(heeftTeams)

  // Groepen
  const groepMap = new Map()
  for (const m of matches) {
    const l = groupLetter(m.stage)
    if (!l) continue
    if (!groepMap.has(l)) groepMap.set(l, [])
    groepMap.get(l).push(m)
  }
  const groepen = [...groepMap.keys()].sort()

  // Rondes (knock-out): alles wat geen groep is, op volgorde van eerste aftrap
  const rondeMap = new Map()
  for (const m of matches) {
    if (groupLetter(m.stage)) continue
    if (!m.stage) continue
    if (!rondeMap.has(m.stage)) rondeMap.set(m.stage, [])
    rondeMap.get(m.stage).push(m)
  }
  const rondes = [...rondeMap.keys()].sort(
    (a, b) =>
      new Date(rondeMap.get(a)[0].kickoff) - new Date(rondeMap.get(b)[0].kickoff),
  )

  // Teams (alleen echte teams uit gespeelde/bekende wedstrijden)
  const teamMap = new Map()
  for (const m of echte) {
    for (const t of [m.teamA, m.teamB]) {
      if (!teamMap.has(t)) teamMap.set(t, [])
      teamMap.get(t).push(m)
    }
  }
  const teams = [...teamMap.keys()].sort((a, b) => a.localeCompare(b, 'nl'))

  const urls = []
  const onthoud = (path) => urls.push(SITE + path)

  // Schrijven
  for (const m of echte) {
    await writePage(matchPath(m), matchPage(m, matches))
    onthoud(matchPath(m))
  }
  for (const t of teams) {
    const list = teamMap.get(t).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))
    await writePage(teamPath(t), teamPage(t, list))
    onthoud(teamPath(t))
  }
  for (const l of groepen) {
    const list = groepMap.get(l).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))
    const teamsInGroep = [...new Set(list.flatMap((m) => [m.teamA, m.teamB]))].filter(
      (t) => t && t !== 'Nog te bepalen',
    )
    await writePage(groepPath(l), groepPage(l, list, teamsInGroep))
    onthoud(groepPath(l))
  }
  for (const stage of rondes) {
    const list = rondeMap.get(stage).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))
    await writePage(rondePath(stage), rondePage(stage, list))
    onthoud(rondePath(stage))
  }

  await writePage(
    '/wedstrijden/',
    indexPage({
      groepen: groepen.map((letter) => ({ letter })),
      rondes: rondes.map((stage) => ({ stage })),
      teams,
      totaal: echte.length,
    }),
  )
  onthoud('/wedstrijden/')

  // sitemap.xml (homepage eerst) + robots.txt
  const datum = new Date().toISOString().slice(0, 10)
  const alle = [SITE + '/', ...urls]
  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    alle
      .map((u) => `  <url><loc>${u}</loc><lastmod>${datum}</lastmod></url>`)
      .join('\n') +
    `\n</urlset>\n`
  await writeFile(new URL('sitemap.xml', DIST), sitemap)

  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`
  await writeFile(new URL('robots.txt', DIST), robots)

  console.log(
    `SEO klaar: ${echte.length} wedstrijden, ${teams.length} teams, ${groepen.length} groepen, ${rondes.length} rondes + index, sitemap (${alle.length} urls) en robots.txt.`,
  )
}

main().catch((fout) => {
  console.error(`SEO-build mislukt: ${fout.stack || fout.message}`)
  process.exit(1)
})
