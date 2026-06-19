// Service worker voor Geen Spoilers — bewust alléén voor pushmeldingen.
// Geen offline-cache: de app moet altijd verse, spoilervrije data tonen.
// De inhoud van de melding komt volledig van de server (send-push.mjs); die
// stuurt nooit een uitslag mee, alleen de teamnamen.

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }
  const titel = data.title || 'Nieuwe samenvatting'
  const opties = {
    body: data.body || '',
    icon: '/apple-touch-icon.png',
    badge: '/apple-touch-icon.png',
    // Zelfde wedstrijd vervangt een eerdere melding i.p.v. te stapelen
    tag: data.tag || 'samenvatting',
    data: { url: data.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(titel, opties))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const doel = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((vensters) => {
        // App al open? Naar voren halen. Anders een nieuw venster openen.
        for (const v of vensters) {
          if ('focus' in v) return v.focus()
        }
        return self.clients.openWindow(doel)
      }),
  )
})
