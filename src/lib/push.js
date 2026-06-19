// Alle browserkant van de pushmeldingen op één plek. Net als matchesData.js
// praat dit via een simpele fetch met de Supabase REST-API — geen SDK in de
// hoofd-bundle. De anon-sleutel mag alleen schrijven naar push_subscriptions
// (insert/update/delete), nooit lezen; dat is in het schema afgedwongen.

import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigured } from './supabase.js'

const env = import.meta.env || {}
const VAPID_PUBLIC = env.VITE_VAPID_PUBLIC_KEY || ''

const SUBS_URL = `${SUPABASE_URL}/rest/v1/push_subscriptions`
const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
}

// Heeft deze browser überhaupt de bouwstenen voor webpush?
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
// Zelfde logica als InstallPrompt.jsx.
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

// Welke toestand moet de Meldingen-pagina tonen?
// - unsupported-ios: iPhone in een gewoon tabblad → eerst op het beginscherm
//   zetten, want WebKit kent push alleen in de geïnstalleerde app
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

// Vraagt toestemming, abonneert via PushManager en stuurt het abonnement naar
// Supabase (upsert op endpoint). Geeft true terug bij succes.
export async function subscribeToPush() {
  const reg =
    (await navigator.serviceWorker.getRegistration()) ||
    (await registerServiceWorker())
  await navigator.serviceWorker.ready

  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return false

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
    headers: {
      ...headers,
      // upsert op de endpoint-PK: opnieuw aanmelden is onschadelijk
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  })
  return res.ok
}

// Zet meldingen uit: stop het abonnement in de browser én verwijder de rij
// in Supabase, zodat we er niet meer naartoe sturen.
export async function unsubscribeFromPush() {
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = reg && (await reg.pushManager.getSubscription())
  if (!sub) return true
  const { endpoint } = sub.toJSON()
  await sub.unsubscribe()
  await fetch(`${SUBS_URL}?endpoint=eq.${encodeURIComponent(endpoint)}`, {
    method: 'DELETE',
    headers,
  })
  return true
}
