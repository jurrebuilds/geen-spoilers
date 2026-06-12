import { lazy, Suspense, useEffect, useState } from 'react'
import { loadMatches } from './lib/matchesData.js'
import MatchList from './components/MatchList.jsx'
import Player from './components/Player.jsx'

// Het admin-scherm (met de Supabase-SDK) wordt apart geladen, alleen op #admin
const Admin = lazy(() => import('./components/Admin.jsx'))

export default function App() {
  const [route, setRoute] = useState(() => window.location.hash)
  const [matches, setMatches] = useState(null)
  const [activeMatch, setActiveMatch] = useState(null)
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

  if (route === '#admin') {
    return (
      <Suspense
        fallback={<div className="min-h-dvh bg-night" aria-hidden="true" />}
      >
        <Admin />
      </Suspense>
    )
  }

  if (activeMatch) {
    return <Player match={activeMatch} onBack={() => setActiveMatch(null)} />
  }

  return (
    <div className="min-h-dvh bg-night text-cream">
      <div className="mx-auto max-w-md px-4 pb-12 pt-7">
        <header className="flex items-center gap-3 pb-6">
          {/* Merkteken: oog met voetbal als pupil, zie ook public/favicon.svg */}
          <svg viewBox="0 0 64 64" className="h-11 w-11 shrink-0" aria-hidden="true">
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
          <div>
            <h1 className="text-2xl font-extrabold leading-none tracking-tight">
              Geen <span className="text-oranje">Spoilers</span>
            </h1>
            <p className="mt-1.5 text-sm font-medium text-moss">
              Kijk alle WK-wedstrijden terug zonder spoilers
            </p>
          </div>
        </header>

        {matches === null ? (
          <p className="pt-8 text-center text-sm text-moss">Wedstrijden laden…</p>
        ) : (
          <MatchList
            matches={matches}
            onOpen={setActiveMatch}
            filters={filters}
            onFiltersChange={setFilters}
          />
        )}
      </div>
    </div>
  )
}
