import { lazy, Suspense, useEffect, useState } from 'react'
import { loadMatches } from './lib/matchesData.js'
import MatchList from './components/MatchList.jsx'
import Player from './components/Player.jsx'

// Het admin-scherm (met de Supabase-SDK) wordt apart geladen, alleen op #admin
const Admin = lazy(() => import('./components/Admin.jsx'))

function Logo() {
  // Merkteken: oog met voetbal als pupil, zie ook public/favicon.svg
  return (
    <svg viewBox="0 0 64 64" width="44" height="44" className="shrink-0" aria-hidden="true">
      <rect width="64" height="64" rx="16" className="fill-pitch-raised" />
      {/* de bal: witte cirkel met rand; de naden beginnen ín het
          pentagoon zodat ze er naadloos uit voortvloeien */}
      <circle cx="32" cy="32" r="9" className="fill-cream" />
      <path
        d="M32 27.5 L36.28 30.61 L34.65 35.64 L29.35 35.64 L27.72 30.61 Z"
        className="fill-night"
      />
      <g className="stroke-night" strokeWidth="2">
        <line x1="32" y1="29.5" x2="32" y2="23" />
        <line x1="34.38" y1="31.23" x2="40.56" y2="29.22" />
        <line x1="33.47" y1="34.02" x2="37.29" y2="39.28" />
        <line x1="30.53" y1="34.02" x2="26.71" y2="39.28" />
        <line x1="29.62" y1="31.23" x2="23.44" y2="29.22" />
      </g>
      <circle cx="32" cy="32" r="9" className="fill-none stroke-night" strokeWidth="2" />
      {/* het ooglid valt over de bal heen, zoals bij een echte pupil */}
      <path
        d="M11 32 Q32 15 53 32 Q32 49 11 32 Z"
        className="fill-none stroke-oranje"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Skeletblokje dat zachtjes ademt
function Blok({ w, h, r = 4 }) {
  return (
    <div
      className="animate-pulse-soft bg-line"
      style={{ width: w, height: h, borderRadius: r }}
    />
  )
}

// Skelet in de vorm van de echte lijst: de app voelt direct aanwezig
function ListSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="px-[18px] pb-[9px] pt-[13px]">
        <Blok w={118} h={21} r={6} />
      </div>
      <div className="flex flex-col gap-2 px-3.5 pt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3.5 rounded-2xl bg-pitch p-[13px_14px]"
          >
            <div className="w-[50px] shrink-0">
              <Blok w={38} h={16} />
              <div className="mt-1.5">
                <Blok w={42} h={9} r={3} />
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-[9px]">
              <div className="flex items-center gap-[9px]">
                <Blok w={26} h={19} />
                <Blok w={120} h={13} />
              </div>
              <div className="flex items-center gap-[9px]">
                <Blok w={26} h={19} />
                <Blok w={92} h={13} />
              </div>
            </div>
            <div className="shrink-0">
              <Blok w={38} h={38} r={999} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [route, setRoute] = useState(() => window.location.hash)
  const [matches, setMatches] = useState(null)
  const [activeMatch, setActiveMatch] = useState(null)
  // 'open' → speler glijdt erin, 'sluiten' → glijdt eruit en wordt daarna opgeruimd
  const [playerFase, setPlayerFase] = useState('open')
  const [filters, setFilters] = useState({ onlyAvailable: false, oranje: false })

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    let actief = true
    loadMatches().then((m) => {
      if (actief) setMatches(m)
    })
    return () => {
      actief = false
    }
  }, [])

  const openMatch = (match) => {
    setPlayerFase('open')
    setActiveMatch(match)
  }

  const sluitPlayer = () => setPlayerFase('sluiten')

  // De lijst blijft gemount onder de speler: scrollpositie blijft bewaard.
  // Zolang de speler open is, scrolt alleen de speler.
  useEffect(() => {
    if (!activeMatch) return
    const vorige = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = vorige
    }
  }, [activeMatch])

  useEffect(() => {
    if (!activeMatch) return
    const onKey = (e) => {
      if (e.key === 'Escape') sluitPlayer()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeMatch])

  if (route === '#admin') {
    return (
      <Suspense
        fallback={<div className="min-h-dvh bg-night" aria-hidden="true" />}
      >
        <Admin />
      </Suspense>
    )
  }

  return (
    <div className="min-h-dvh bg-night text-cream">
      <div
        aria-hidden={activeMatch ? true : undefined}
        className="mx-auto max-w-md pb-[92px] pt-5"
      >
        <header className="flex animate-fade-up items-center gap-3 px-[18px] pb-4 pt-2.5">
          <Logo />
          <div className="min-w-0">
            <h1 className="text-[23px] font-extrabold leading-none tracking-[-0.025em]">
              Geen <span className="text-oranje">Spoilers</span>
            </h1>
            <p className="mt-[5px] truncate text-[12.5px] font-medium leading-tight text-moss">
              Kijk alle WK-wedstrijden terug zonder spoilers
            </p>
          </div>
        </header>

        {matches === null ? (
          <ListSkeleton />
        ) : (
          <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
            <MatchList
              matches={matches}
              onOpen={openMatch}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
        )}
      </div>

      {activeMatch && (
        <div
          className={`fixed inset-0 z-50 overflow-y-auto bg-night ${
            playerFase === 'sluiten' ? 'animate-sheet-out' : 'animate-sheet-in'
          }`}
          onAnimationEnd={(e) => {
            // alleen de eigen sheet-animatie, niet die van kinderen
            if (e.target === e.currentTarget && playerFase === 'sluiten') {
              setActiveMatch(null)
            }
          }}
        >
          <Player match={activeMatch} onBack={sluitPlayer} />
        </div>
      )}
    </div>
  )
}
