// Product-analytics via PostHog, naast Vercel Analytics. Vercel telt
// pageviews en Web Vitals; PostHog vangt de échte acties (wedstrijd geopend,
// gevolgd, meldingen aangezet) zodat we zien welke features gebruikt worden.
//
// Privacy-bewust en spoilervrij van insteek: EU-hosting, geen session-
// recording, geen autocapture van toetsaanslagen, en we sturen nooit meer mee
// dan een wedstrijd-id en de teamnamen. Ontbreekt de sleutel (lokaal of in een
// preview), dan doet alles hieronder stil niets.

const env = import.meta.env || {}
const KEY = env.VITE_POSTHOG_KEY || ''
const HOST = env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com'

// posthog-js is zwaar (~55kB gzip); we laden het pas dynamisch wanneer er een
// key is. Zonder key wordt het dus nooit gebundeld in het kritieke pad.
let ph = null

export function initAnalytics() {
  if (ph || !KEY || typeof window === 'undefined') return
  import('posthog-js').then(({ default: posthog }) => {
    posthog.init(KEY, {
      api_host: HOST,
      // Alleen een profiel als we iemand bewust identificeren (doen we niet);
      // houdt het anoniem en licht.
      person_profiles: 'identified_only',
      // Geen sessieopnames of heatmaps: scheelt kosten en is privacyvriendelijker.
      disable_session_recording: true,
      autocapture: false,
      capture_pageview: true,
      capture_pageleave: true,
    })
    ph = posthog
    // Events die vóór het laden binnenkwamen alsnog versturen.
    wachtrij.forEach(([event, props]) => ph.capture(event, props))
    wachtrij.length = 0
  })
}

// Acties kunnen al gebeuren voordat posthog klaar met laden is; die bufferen we.
const wachtrij = []

// Draait de app als geïnstalleerde app (op het beginscherm) of in de browser?
// Op iOS is dit onze enige proxy voor "heeft toegevoegd aan beginscherm",
// want Apple geeft geen installatie-event.
function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    false
  )
}

// Eén keer per app-start: legt vast of iemand als app of in de browser binnenkomt.
export function trackAppOpen() {
  track('app_geopend', { standalone: isStandalone() })
}

// Veilige event-helper: no-op zonder key, buffert tot posthog geladen is.
export function track(event, props) {
  if (!KEY) return
  if (!ph) {
    wachtrij.push([event, props])
    return
  }
  try {
    ph.capture(event, props)
  } catch {
    // analytics mag nooit de app breken
  }
}
