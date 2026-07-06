import { useEffect, useState } from 'react'
import { STEUN_KAART_VERSIE, TIKKIE_URL } from '../lib/tikkie.js'
import { track } from '../lib/analytics.js'

// Onthoudt welke versie van de kaart is weggeklikt; een nieuwe waarde in
// VITE_STEUN_KAART laat de kaart bij iedereen nog één keer terugkomen
const WEGGEKLIKT_KEY = 'gs-steun-kaart-weggeklikt'

function alWeggeklikt() {
  try {
    return localStorage.getItem(WEGGEKLIKT_KEY) === STEUN_KAART_VERSIE
  } catch {
    return false
  }
}

function onthoudWeggeklikt() {
  try {
    localStorage.setItem(WEGGEKLIKT_KEY, STEUN_KAART_VERSIE)
  } catch {
    // privémodus zonder localStorage: dan zien ze de kaart vaker, geen ramp
  }
}

// Donatiekaart in de wedstrijdlijst, direct onder de nieuwste beschikbare
// samenvatting. Verdwijnt alleen na bewust wegklikken (kruisje); een klik op
// de doneerknop niet, want of de betaling is afgerond weten we niet.
// Zonder Tikkie-link of versienummer (env-vars) verschijnt er niets.
export default function SteunKaart() {
  const [zichtbaar, setZichtbaar] = useState(
    () => Boolean(TIKKIE_URL && STEUN_KAART_VERSIE) && !alWeggeklikt(),
  )

  useEffect(() => {
    if (zichtbaar) {
      track('steun_kaart_getoond', { versie: STEUN_KAART_VERSIE })
    }
    // bewust alleen bij mount: opnieuw zichtbaar worden kan niet
  }, [])

  if (!zichtbaar) return null

  const sluit = () => {
    track('steun_kaart_weggeklikt', { versie: STEUN_KAART_VERSIE })
    onthoudWeggeklikt()
    setZichtbaar(false)
  }

  const doneer = () => {
    track('steun_geopend', { bron: 'home' })
  }

  return (
    <div className="flex items-start gap-[11px] rounded-2xl border border-oranje/40 bg-pitch-raised px-[15px] py-[13px]">
      <span className="mt-px flex flex-none text-oranje">
        <svg viewBox="0 0 24 24" width="20" height="20" className="fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 11h1a3 3 0 0 1 0 6h-1" />
          <path d="M9 12v6M13 12v6" />
          <path d="M5 8h12v9a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" />
          <path d="M5 8a3 3 0 0 1 3-3c.5 0 1 .15 1.4.42A3 3 0 0 1 14 4.5a2.5 2.5 0 0 1 3 2.5" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold leading-snug text-cream">
          Kijk jij hier spoilervrij?
        </p>
        <p className="mt-1 text-[12px] leading-normal text-moss">
          Geenspoilers.nl draait op donaties. Vind je het wat waard? Trakteer
          op een biertje.
        </p>
        <a
          href={TIKKIE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={doneer}
          className="mt-2.5 inline-block rounded-full bg-oranje px-4 py-2 text-[12.5px] font-bold text-night transition-transform duration-150 active:scale-95"
        >
          Doe een biertje via Tikkie
        </a>
      </div>
      <button
        type="button"
        onClick={sluit}
        aria-label="Sluiten"
        className="shrink-0 rounded-full p-1.5 text-moss-mid transition-colors duration-150 hover:text-cream active:text-cream"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="3" x2="13" y2="13" />
            <line x1="13" y1="3" x2="3" y2="13" />
          </g>
        </svg>
      </button>
    </div>
  )
}
