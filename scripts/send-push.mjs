#!/usr/bin/env node
// Stuurt spoilervrije pushmeldingen voor net-gevonden samenvattingen, maar
// alleen aan de mensen die díé wedstrijd volgen (tabel match_volgers).
// "Te melden" = youtube_id gevuld én summary_notified_at nog leeg. Na het sturen
// markeren we de wedstrijd, zodat de cron nooit dubbel meldt. Omdat we op de
// DB-kolom afgaan (niet op een moment in check-summaries.mjs) is dit
// self-healing: een mislukte run wordt de volgende keer alsnog opgepakt.
//
// SPOILERVEILIG: de melding bevat alleen de teamnamen, nooit een uitslag of
// de video-id. Draait als losse stap na check-summaries.mjs in de cron.
//
// Gebruik: npm run push  (vereist SUPABASE_URL, SUPABASE_SERVICE_KEY en de
// VAPID-sleutels; zonder die env-waarden stopt het script netjes.)

import webpush from 'web-push'

const base = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY
const STIL = process.argv.includes('--stil')

function over(reden) {
  if (!STIL) console.log(`Push overgeslagen (${reden}).`)
  process.exit(0)
}

if (!base || !key) over('geen Supabase-config')
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  over('geen VAPID-sleutels')
}

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:jurrederuiter@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
)

const headers = { apikey: key, Authorization: `Bearer ${key}` }

async function main() {
  // 1. Wedstrijden met een samenvatting die nog niet gemeld is
  const res = await fetch(
    `${base}/rest/v1/matches?select=id,team_a,team_b&youtube_id=not.is.null&summary_notified_at=is.null`,
    { headers },
  )
  if (!res.ok) throw new Error(`matches gaf ${res.status}`)
  const teMelden = await res.json()
  if (teMelden.length === 0) {
    if (!STIL) console.log('Niets te melden.')
    return
  }

  // 2. Alle abonnementen + volgers ophalen (service-sleutel omzeilt RLS) en in
  //    het geheugen koppelen. Klein genoeg voor een zijproject; geen joins nodig.
  const [subsRes, volgersRes] = await Promise.all([
    fetch(`${base}/rest/v1/push_subscriptions?select=endpoint,keys`, { headers }),
    fetch(`${base}/rest/v1/match_volgers?select=endpoint,match_id`, { headers }),
  ])
  const subs = subsRes.ok ? await subsRes.json() : []
  const volgers = volgersRes.ok ? await volgersRes.json() : []
  const keysVan = new Map(subs.map((s) => [s.endpoint, s.keys]))

  async function ruimOp(endpoint) {
    // Verlopen/onbekend endpoint → verwijderen (cascade ruimt match_volgers op)
    await fetch(
      `${base}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
      { method: 'DELETE', headers },
    )
    keysVan.delete(endpoint)
  }

  for (const m of teMelden) {
    const naam = `${m.team_a} – ${m.team_b}`
    const payload = JSON.stringify({
      title: 'Nieuwe samenvatting',
      body: `De samenvatting van ${naam} staat klaar 👀`,
      url: '/',
      tag: `samenvatting-${m.id}`,
    })

    // Endpoints die juist déze wedstrijd volgen (en een geldig abonnement hebben)
    const ontvangers = volgers
      .filter((v) => v.match_id === m.id)
      .map((v) => v.endpoint)
      .filter((e) => keysVan.has(e))

    await Promise.allSettled(
      ontvangers.map((endpoint) =>
        webpush
          .sendNotification({ endpoint, keys: keysVan.get(endpoint) }, payload)
          .catch(async (err) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await ruimOp(endpoint)
            }
          }),
      ),
    )

    // 3. Markeer als gemeld (ook bij 0 volgers, anders blijft hij "nieuw")
    await fetch(`${base}/rest/v1/matches?id=eq.${m.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ summary_notified_at: new Date().toISOString() }),
    })
    console.log(`✓ Pushmelding verstuurd: ${naam} (${ontvangers.length} volgers)`)
  }
}

try {
  await main()
} catch (fout) {
  // nooit de cron laten falen op een tijdelijke hapering
  console.log(`Push overgeslagen (${fout.message})`)
}
