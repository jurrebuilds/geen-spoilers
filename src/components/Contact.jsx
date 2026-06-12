import { useState } from 'react'

// Contactscherm, bereikbaar via de kleine link in de titelbalk. Het
// formulier post naar /api/contact (Vercel-functie), die het bericht als
// e-mail doorstuurt. Het e-mailadres van de beheerder leeft alleen dáár,
// als omgevingsvariabele — nooit in deze bundel.
export default function Contact({ onBack }) {
  const [bericht, setBericht] = useState('')
  const [email, setEmail] = useState('')
  // honingpot: mensen zien dit veld nooit, spambots vullen het wel in
  const [valstrik, setValstrik] = useState('')
  const [status, setStatus] = useState('idle') // idle | bezig | klaar | fout

  const verstuur = async (e) => {
    e.preventDefault()
    setStatus('bezig')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: bericht.trim(),
          email: email.trim(),
          website: valstrik,
        }),
      })
      setStatus(res.ok ? 'klaar' : 'fout')
    } catch {
      setStatus('fout')
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col text-cream">
      <header className="flex flex-none items-center gap-1.5 px-2 py-1.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Terug naar wedstrijden"
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full transition-colors duration-150 active:bg-pitch-raised"
        >
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            className="fill-none stroke-cream"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-base font-bold leading-tight tracking-[-0.01em]">
          Contact
        </h1>
      </header>

      {status === 'klaar' ? (
        <div className="flex animate-fade-up flex-col items-center gap-4 px-[30px] pt-[60px] text-center">
          <p className="text-[19px] font-bold tracking-[-0.01em] text-cream">
            Bericht verstuurd
          </p>
          <p className="mx-auto max-w-64 text-[13.5px] leading-normal text-moss">
            Dank je wel! Antwoord komt alleen als je een e-mailadres hebt
            achtergelaten.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-0.5 rounded-full bg-oranje px-5 py-[11px] text-sm font-bold text-night transition-transform duration-150 active:scale-95"
          >
            Terug naar wedstrijden
          </button>
        </div>
      ) : (
        <div className="px-[18px] pb-16 pt-2">
          <p className="text-[13.5px] leading-normal text-moss">
            Een foutje gezien, een samenvatting die ontbreekt of toch ergens een
            spoiler tegengekomen? Laat het weten.
          </p>

          <form onSubmit={verstuur} className="relative mt-5 space-y-3.5">
            <label className="block">
              <span className="text-xs font-medium text-moss">Bericht</span>
              <textarea
                required
                rows={5}
                maxLength={2000}
                value={bericht}
                onChange={(e) => {
                  setBericht(e.target.value)
                  setStatus('idle')
                }}
                placeholder="Wat wil je kwijt?"
                className="mt-1.5 w-full resize-y rounded-xl border border-line bg-pitch px-4 py-3 text-[15px] text-cream placeholder:text-moss/60 focus:border-oranje focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-moss">
                E-mailadres (optioneel, alleen als je antwoord wilt)
              </span>
              <input
                type="email"
                maxLength={200}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jouw@email.nl"
                className="mt-1.5 w-full rounded-xl border border-line bg-pitch px-4 py-3 text-[15px] text-cream placeholder:text-moss/60 focus:border-oranje focus:outline-none"
              />
            </label>

            <input
              type="text"
              name="website"
              value={valstrik}
              onChange={(e) => setValstrik(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] top-0"
            />

            <button
              type="submit"
              disabled={status === 'bezig'}
              className="rounded-full bg-oranje px-6 py-3 text-sm font-bold text-night transition-transform duration-150 active:scale-95 disabled:opacity-60"
            >
              {status === 'bezig' ? 'Versturen…' : 'Versturen'}
            </button>

            {status === 'fout' && (
              <p className="text-sm leading-normal text-oranje">
                Versturen is niet gelukt. Probeer het later nog eens.
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  )
}
