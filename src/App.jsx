import { lazy, Suspense, useEffect, useState } from 'react'
import { loadMatches } from './lib/matchesData.js'
import MatchList from './components/MatchList.jsx'
import Player from './components/Player.jsx'

// Het admin-scherm (met de Supabase-SDK) wordt apart geladen, alleen op #admin
const Admin = lazy(() => import('./components/Admin.jsx'))

function Logo() {
  // Merkteken: oog met voetbal als pupil, zie ook public/favicon.svg
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10 shrink-0" aria-hidden="true">
      <rect width="64" height="64" rx="14" className="fill-pitch-raised" />
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

// Skelet in de vorm van de echte lijst: de app voelt direct aanwezig
function ListSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      {[3, 2].map((aantal, g) => (
        <div key={g}>
          <div className="mt-3.5 mb-3 h-3 w-36 rounded-full bg-pitch-raised" />
          <div className="space-y-2.5 pb-5">
            {Array.from({ length: aantal }, (_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-line/40 bg-pitch p-4"
              >
                <div className="h-4 w-12 shrink-0 rounded bg-pitch-raised" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-3.5 w-3/5 rounded bg-pitch-raised" />
                  <div className="h-3.5 w-2/5 rounded bg-pitch-raised" />
                  <div className="h-2.5 w-1/3 rounded bg-pitch-raised/60" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
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
        className="mx-auto max-w-md px-4 pb-28 pt-7"
      >
        <header className="flex animate-fade-up items-center gap-3 pb-5">
          <Logo />
          <div className="min-w-0">
            <h1 className="text-[22px] font-extrabold leading-none tracking-tight">
              Geen <span className="text-oranje">Spoilers</span>
            </h1>
            <p className="mt-1.5 truncate text-[13px] font-medium text-moss">
              Kijk het WK terug zonder uitslagen
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
