// Alle browserkant van de pushmeldingen op één plek. Net als matchesData.js
// praat dit via een simpele fetch met de Supabase REST-API — geen SDK in de
// hoofd-bundle. De anon-sleutel mag alleen schrijven (insert/update/delete) naar
// push_subscriptions en match_volgers, nooit lezen; dat is in het schema
// afgedwongen. Welke wedstrijden dit apparaat volgt onthouden we daarom lokaal
// (localStorage) als bron voor de aan/uit-stand van de bel.

import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigured } from './supabase.js'

const env = import.meta.env || {}
const VAPID_PUBLIC = env.VITE_VAPID_PUBLIC_KEY || ''

const SUBS_URL = `${SUPABASE_URL}/rest/v1/push_subscriptions`
const VOLGERS_URL = `${SUPABASE_URL}/rest/v1/match_volgers`
const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
}

// localStorage-sleutel met de id's van gevolgde wedstrijden (UI-bron)
const FOLLOW_KEY = 'gs-gevolgde-wedstrijden'

// Heeft deze browser de bouwstenen voor webpush?
export function pushSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

// Is de feature aan onze kant geconfigureerd (VAPID-sleutel + Supabase)?
export function pushConfigured() {
  return Boolean(VAPID_PUBLIC) && supabaseConfigured
}

export function permissionState() {
  return pushSupported() ? Notification.permission : 'unsupported'
}

// iPhone/iPad herkennen (iPads doen zich voor als Mac, maar hebben touch).
function isIos() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

// Welke toestand moet de Meldingen-pagina / een beltik tonen?
// - unsupported-ios: iPhone in een gewoon tabblad → eerst op het beginscherm
// - unsupported: andere browser zonder push (zeldzaam)
// - denied: gebruiker heeft het in de browser geblokkeerd
// - granted: meldingen staan aan
// - default: kan aangezet worden
export function currentStatus() {
  if (!pushSupported()) {
    if (isIos() && !isStandalone()) return 'unsupported-ios'
    return 'unsupported'
  }
  const p = Notification.permission
  if (p === 'denied') return 'denied'
  if (p === 'granted') return 'granted'
  return 'default'
}

// ── Gevolgde wedstrijden (lokaal) ───────────────────────────────────────
export function gevolgdeMatches() {
  try {
    return JSON.parse(localStorage.getItem(FOLLOW_KEY)) || []
  } catch {
    return []
  }
}
function bewaarGevolgd(ids) {
  localStorage.setItem(FOLLOW_KEY, JSON.stringify([...new Set(ids)]))
}
export function volgtMatch(matchId) {
  return gevolgdeMatches().includes(matchId)
}

// VAPID-publieke sleutel (base64url) → Uint8Array, zoals PushManager verwacht
function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  return navigator.serviceWorker.register('/sw.js')
}

// Zorgt dat er een push-abonnement is: vraagt toestemming, abonneert via
// PushManager en upsert het abonnement in Supabase. Geeft de PushSubscription
// terug bij succes, of null (geen toestemming / mislukt).
async function zorgVoorAbonnement() {
  const reg =
    (await navigator.serviceWorker.getRegistration()) ||
    (await registerServiceWorker())
  await navigator.serviceWorker.ready

  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return null

  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    })
  }

  const json = sub.toJSON() // { endpoint, keys: { p256dh, auth } }
  const res = await fetch(SUBS_URL, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  })
  return res.ok ? sub : null
}

// Volg een wedstrijd. Returns:
// 'ios-uitleg' → laat de Meldingen-pagina met installatiestappen zien
// 'geweigerd'  → permissie geweigerd/geblokkeerd
// 'gevolgd'    → gelukt
// 'fout'       → tijdelijke hapering
export async function volgMatch(matchId) {
  const st = currentStatus()
  if (st === 'unsupported-ios' || st === 'unsupported') return 'ios-uitleg'
  if (st === 'denied') return 'geweigerd'

  let sub
  try {
    sub = await zorgVoorAbonnement()
  } catch {
    return 'fout'
  }
  if (!sub) return 'geweigerd'

  const { endpoint } = sub.toJSON()
  const res = await fetch(VOLGERS_URL, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ endpoint, match_id: matchId }),
  })
  if (!res.ok) return 'fout'
  bewaarGevolgd([...gevolgdeMatches(), matchId])
  return 'gevolgd'
}

// Ontvolg een wedstrijd: verwijder de koppelrij en de lokale markering.
export async function ontvolgMatch(matchId) {
  bewaarGevolgd(gevolgdeMatches().filter((id) => id !== matchId))
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = reg && (await reg.pushManager.getSubscription())
  if (!sub) return true
  const { endpoint } = sub.toJSON()
  await fetch(
    `${VOLGERS_URL}?endpoint=eq.${encodeURIComponent(endpoint)}&match_id=eq.${encodeURIComponent(matchId)}`,
    { method: 'DELETE', headers },
  )
  return true
}

// Zet álle meldingen uit: stop het abonnement in de browser, verwijder de rij
// in push_subscriptions én alle gevolgde wedstrijden van dit apparaat.
export async function unsubscribeFromPush() {
  bewaarGevolgd([])
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = reg && (await reg.pushManager.getSubscription())
  if (!sub) return true
  const { endpoint } = sub.toJSON()
  await sub.unsubscribe()
  const enc = encodeURIComponent(endpoint)
  await Promise.all([
    fetch(`${VOLGERS_URL}?endpoint=eq.${enc}`, { method: 'DELETE', headers }),
    fetch(`${SUBS_URL}?endpoint=eq.${enc}`, { method: 'DELETE', headers }),
  ])
  return true
}
