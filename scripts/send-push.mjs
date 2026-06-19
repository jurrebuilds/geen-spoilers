#!/usr/bin/env node
// Stuurt spoilervrije pushmeldingen voor net-gevonden samenvattingen.
// "Te melden" = youtube_id gevuld én summary_notified_at nog leeg. Na het sturen
// markeren we de wedstrijd, zodat de 5-minutencron nooit dubbel meldt. Omdat we
// op de DB-kolom afgaan (niet op een moment in check-summaries.mjs) is dit
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

  // 2. Alle abonnementen (de service-sleutel omzeilt RLS)
  const subsRes = await fetch(`${base}/rest/v1/push_subscriptions?select=*`, {
    headers,
  })
  const subs = subsRes.ok ? await subsRes.json() : []

  for (const m of teMelden) {
    const naam = `${m.team_a} – ${m.team_b}`
    const payload = JSON.stringify({
      title: 'Nieuwe samenvatting',
      body: `De samenvatting van ${naam} staat klaar 👀`,
      url: '/',
      tag: `samenvatting-${m.id}`,
    })

    await Promise.allSettled(
      subs.map((s) =>
        webpush
          .sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload)
          .catch(async (err) => {
            // Verlopen/onbekend abonnement → opruimen
            if (err.statusCode === 410 || err.statusCode === 404) {
              await fetch(
                `${base}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(s.endpoint)}`,
                { method: 'DELETE', headers },
              )
            }
          }),
      ),
    )

    // 3. Markeer als gemeld (ook bij 0 abonnees, anders blijft hij "nieuw")
    await fetch(`${base}/rest/v1/matches?id=eq.${m.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ summary_notified_at: new Date().toISOString() }),
    })
    console.log(`✓ Pushmelding verstuurd: ${naam} (${subs.length} abonnees)`)
  }
}

try {
  await main()
} catch (fout) {
  // nooit de cron laten falen op een tijdelijke hapering
  console.log(`Push overgeslagen (${fout.message})`)
}
