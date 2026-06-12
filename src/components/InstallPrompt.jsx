import { useEffect, useRef, useState } from 'react'

// Hoe lang we de banner wegmoffelen nadat iemand 'm wegklikt
const WEGGEKLIKT_KEY = 'gs-install-weggeklikt'
const WEGGEKLIKT_DAGEN = 45
// Even ademruimte na het laden: eerst de wedstrijden, dan pas dit
const TOON_NA_MS = 4000

function alGeinstalleerd() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function recentWeggeklikt() {
  const ts = Number(localStorage.getItem(WEGGEKLIKT_KEY))
  if (!ts) return false
  return Date.now() - ts < WEGGEKLIKT_DAGEN * 24 * 60 * 60 * 1000
}

function isIos() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPads doen zich tegenwoordig voor als Mac, maar hebben wél touch
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

// iOS-deelicoon: vierkantje met pijl omhoog, zodat de uitleg
// visueel matcht met de knop die mensen moeten zoeken
function DeelIcoon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="15"
      height="15"
      className="inline-block align-[-2px]"
      aria-hidden="true"
    >
      <g className="stroke-oranje" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8 H5 a1.5 1.5 0 0 0 -1.5 1.5 V16 a1.5 1.5 0 0 0 1.5 1.5 H15 a1.5 1.5 0 0 0 1.5 -1.5 V9.5 A1.5 1.5 0 0 0 15 8 H14" />
        <line x1="10" y1="12" x2="10" y2="2.5" />
        <path d="M7 5.5 L10 2.5 L13 5.5" />
      </g>
    </svg>
  )
}

export default function InstallPrompt() {
  // null (verborgen) | 'android' (echte installatieknop) | 'ios' (uitleg)
  const [variant, setVariant] = useState(null)
  // Het uitgestelde beforeinstallprompt-event, nodig om de echte
  // installatiedialoog van de browser te kunnen openen
  const promptEvent = useRef(null)

  useEffect(() => {
    if (alGeinstalleerd() || recentWeggeklikt()) return
    // Alleen op aanraakschermen: op desktop slaat "startscherm" nergens op
    if (!window.matchMedia('(pointer: coarse)').matches) return

    let timer

    if (isIos()) {
      // Apple kent geen installatie-event; we kunnen alleen uitleggen hoe het moet
      timer = setTimeout(() => setVariant('ios'), TOON_NA_MS)
    } else {
      // Chrome/Android meldt zich pas als de site installeerbaar is
      const onPrompt = (e) => {
        e.preventDefault()
        promptEvent.current = e
        timer = setTimeout(() => setVariant('android'), TOON_NA_MS)
      }
      window.addEventListener('beforeinstallprompt', onPrompt)
      return () => {
        window.removeEventListener('beforeinstallprompt', onPrompt)
        clearTimeout(timer)
      }
    }

    return () => clearTimeout(timer)
  }, [])

  const sluit = () => {
    localStorage.setItem(WEGGEKLIKT_KEY, String(Date.now()))
    setVariant(null)
  }

  const installeer = async () => {
    const e = promptEvent.current
    if (!e) return
    e.prompt()
    const { outcome } = await e.userChoice
    // Zowel bij installeren als weigeren zijn we klaar; bij weigeren
    // vragen we het pas over een tijdje opnieuw
    if (outcome !== 'accepted') {
      localStorage.setItem(WEGGEKLIKT_KEY, String(Date.now()))
    }
    setVariant(null)
  }

  if (variant === null) return null

  return (
    <div
      className="fixed inset-x-0 z-40 mx-auto max-w-md px-3.5"
      style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <div className="animate-fade-up flex items-start gap-3 rounded-2xl border border-line bg-pitch-raised p-[14px_16px] shadow-float">
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-bold leading-snug">
            Zet &lsquo;m op je startscherm
          </p>
          {variant === 'ios' ? (
            <p className="mt-1 text-[13px] leading-normal text-moss">
              Tik op <DeelIcoon /> en kies daarna{' '}
              <span className="font-semibold text-cream">
                &lsquo;Zet op beginscherm&rsquo;
              </span>
              . Dan opent Geen Spoilers als een app.
            </p>
          ) : (
            <>
              <p className="mt-1 text-[13px] leading-normal text-moss">
                Dan opent Geen Spoilers als een app, klaar voor elke wedstrijd.
              </p>
              <button
                type="button"
                onClick={installeer}
                className="mt-2.5 rounded-full bg-oranje px-4 py-2 text-[13px] font-bold text-night shadow-glow-oranje-soft transition-transform duration-150 active:scale-95"
              >
                Toevoegen
              </button>
            </>
          )}
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
    </div>
  )
}
