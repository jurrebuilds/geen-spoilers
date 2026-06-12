// Vercel-functie achter het contactformulier: stuurt het bericht als
// e-mail door naar de beheerder. Het e-mailadres staat alleen in de
// omgevingsvariabele CONTACT_EMAIL (Vercel > Settings > Environment
// Variables) en komt zo nooit in de frontend-bundel of in git terecht.
// Het mailen zelf loopt via formsubmit.co: gratis, geen account nodig,
// alleen eenmalig het adres activeren (zie README).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false })
    return
  }

  const to = process.env.CONTACT_EMAIL
  if (!to) {
    res.status(500).json({ ok: false })
    return
  }

  const { message = '', email = '', website = '' } = req.body || {}

  // honingpot: mensen zien dat veld nooit, spambots vullen het wel in.
  // Doe alsof het gelukt is, zodat de bot niets te leren valt.
  if (String(website).trim()) {
    res.status(200).json({ ok: true })
    return
  }

  const bericht = String(message).trim()
  const afzender = String(email).trim()
  if (!bericht || bericht.length > 2000 || afzender.length > 200) {
    res.status(400).json({ ok: false })
    return
  }

  try {
    const r = await fetch(`https://formsubmit.co/ajax/${to}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        _subject: 'Nieuw bericht via Geen Spoilers',
        _template: 'box',
        ...(afzender ? { _replyto: afzender, afzender } : {}),
        bericht,
      }),
    })
    const data = await r.json().catch(() => ({}))
    // formsubmit antwoordt met success: "false" zolang het adres nog niet
    // geactiveerd is; geef dat als fout door zodat het opvalt
    const ok = r.ok && String(data.success) !== 'false'
    res.status(ok ? 200 : 502).json({ ok })
  } catch {
    res.status(502).json({ ok: false })
  }
}
