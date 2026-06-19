import { useState } from 'react'
import {
  currentStatus,
  subscribeToPush,
  unsubscribeFromPush,
} from '../lib/push.js'

// Bel-icoon, in dezelfde getekende stijl als de overige iconen in de app
function BelIcoon({ size = 26 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className="fill-none stroke-oranje"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function CheckIcoon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      className="mt-0.5 shrink-0 fill-none stroke-oranje"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5l4.5 4.5L19 6.5" />
    </svg>
  )
}

// iOS-deelicoon: vierkantje met pijl omhoog, zodat de uitleg matcht met de
// knop die mensen in hun browser moeten zoeken (gelijk aan InstallPrompt.jsx)
function DeelIcoon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="15"
      height="15"
      className="inline-block align-[-2px]"
      aria-hidden="true"
    >
      <g
        className="stroke-oranje"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 8 H5 a1.5 1.5 0 0 0 -1.5 1.5 V16 a1.5 1.5 0 0 0 1.5 1.5 H15 a1.5 1.5 0 0 0 1.5 -1.5 V9.5 A1.5 1.5 0 0 0 15 8 H14" />
        <line x1="10" y1="12" x2="10" y2="2.5" />
        <path d="M7 5.5 L10 2.5 L13 5.5" />
      </g>
    </svg>
  )
}

function Stap({ nummer, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-line-strong text-xs font-bold text-oranje">
        {nummer}
      </span>
      <span className="text-[13.5px] leading-normal text-cream/90">{children}</span>
    </div>
  )
}

export default function Meldingen({ onBack }) {
  const [status, setStatus] = useState(() => currentStatus())
  const [bezig, setBezig] = useState(false)

  const zetAan = async () => {
    setBezig(true)
    try {
      await subscribeToPush()
    } finally {
      setBezig(false)
      setStatus(currentStatus())
    }
  }

  const zetUit = async () => {
    setBezig(true)
    try {
      await unsubscribeFromPush()
    } finally {
      setBezig(false)
      setStatus(currentStatus())
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
          Meldingen
        </h1>
      </header>

      <div className="px-[18px] pb-16 pt-2">
        {status === 'granted' ? (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-oranje/15">
              <BelIcoon />
            </div>
            <p className="mt-4 text-[19px] font-bold leading-snug tracking-[-0.01em]">
              Meldingen staan aan
            </p>
            <p className="mt-2 text-[13.5px] leading-normal text-moss">
              Je krijgt een seintje zodra de samenvatting van een wedstrijd
              klaarstaat. Voor alle wedstrijden.
            </p>
            <button
              type="button"
              onClick={zetUit}
              disabled={bezig}
              className="mt-6 rounded-full border border-line-strong px-5 py-[11px] text-sm font-bold text-moss transition-colors duration-150 hover:text-cream active:text-cream disabled:opacity-60"
            >
              {bezig ? 'Bezig…' : 'Meldingen uitzetten'}
            </button>
          </>
        ) : status === 'unsupported-ios' ? (
          <>
            <p className="text-[19px] font-bold leading-snug tracking-[-0.01em]">
              Nog één stap op je iPhone
            </p>
            <p className="mt-2 text-[13.5px] leading-normal text-moss">
              Op de iPhone werken meldingen alleen vanaf je beginscherm. Zet de
              app er even op:
            </p>
            <div className="mt-5 flex flex-col gap-3.5">
              <Stap nummer={1}>
                Tik op de deelknop van je browser <DeelIcoon />
              </Stap>
              <Stap nummer={2}>
                Kies{' '}
                <span className="font-semibold text-cream">
                  &lsquo;Zet op beginscherm&rsquo;
                </span>
              </Stap>
              <Stap nummer={3}>
                Open Geen Spoilers vanaf je beginscherm en kom hier terug
              </Stap>
            </div>
            <div className="mt-6">
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-full border border-line-strong px-6 py-3 text-sm font-bold text-moss-dim"
              >
                Zet meldingen aan
              </button>
              <p className="mt-2 text-xs text-moss-dim">
                Beschikbaar vanaf het beginscherm
              </p>
            </div>
          </>
        ) : status === 'denied' ? (
          <>
            <p className="text-[19px] font-bold leading-snug tracking-[-0.01em]">
              Meldingen staan geblokkeerd
            </p>
            <p className="mt-2 text-[13.5px] leading-normal text-moss">
              Je browser blokkeert meldingen voor deze site. Zet ze weer aan via
              het slotje of de site-instellingen in je browser, en kom dan hier
              terug.
            </p>
          </>
        ) : status === 'unsupported' ? (
          <>
            <p className="text-[19px] font-bold leading-snug tracking-[-0.01em]">
              Meldingen lukken hier niet
            </p>
            <p className="mt-2 text-[13.5px] leading-normal text-moss">
              Deze browser ondersteunt geen pushmeldingen. Probeer het in een
              recente versie van Chrome, Edge of Safari.
            </p>
          </>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-oranje/15">
              <BelIcoon />
            </div>
            <p className="mt-4 text-[19px] font-bold leading-snug tracking-[-0.01em]">
              Een seintje bij elke samenvatting
            </p>
            <p className="mt-2 text-[13.5px] leading-normal text-moss">
              Zodra de samenvatting van een wedstrijd online staat, krijg je een
              melding. Voor alle wedstrijden.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <CheckIcoon />
                <span className="text-[13.5px] leading-normal text-cream/90">
                  Spoilervrij — alleen de teamnamen, nooit de uitslag
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckIcoon />
                <span className="text-[13.5px] leading-normal text-cream/90">
                  Rechtstreeks uit de NOS-samenvatting
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={zetAan}
              disabled={bezig}
              className="mt-6 rounded-full bg-oranje px-6 py-3 text-sm font-bold text-night shadow-glow-oranje-soft transition-transform duration-150 active:scale-95 disabled:opacity-60"
            >
              {bezig ? 'Aanzetten…' : 'Zet meldingen aan'}
            </button>
            <p className="mt-2.5 text-xs text-moss-mid">
              Je kunt dit altijd weer uitzetten.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
