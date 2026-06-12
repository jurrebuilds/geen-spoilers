import { useEffect, useRef, useState } from 'react'
import { dayKey, dayLabel, todayKey, yesterdayKey } from '../lib/format.js'
import MatchCard from './MatchCard.jsx'

function FilterChip({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        active
          ? 'border-oranje bg-oranje text-night'
          : 'border-line bg-pitch text-moss'
      }`}
    >
      {label}
    </button>
  )
}

export default function MatchList({ matches, onOpen, filters, onFiltersChange }) {
  const todayRef = useRef(null)
  const didScroll = useRef(false)
  // toon de zwevende knop zodra de sectie van vandaag uit beeld is
  const [toonVandaag, setToonVandaag] = useState(false)

  let visible = [...matches].sort(
    (a, b) => new Date(a.kickoff) - new Date(b.kickoff),
  )
  if (filters.onlyAvailable) {
    visible = visible.filter((m) => m.youtubeId)
  }
  if (filters.oranje) {
    visible = visible.filter(
      (m) => m.teamA === 'Nederland' || m.teamB === 'Nederland',
    )
  }

  const groups = []
  for (const match of visible) {
    const key = dayKey(match.kickoff)
    const last = groups[groups.length - 1]
    if (last && last.key === key) {
      last.matches.push(match)
    } else {
      groups.push({ key, label: dayLabel(match.kickoff), matches: [match] })
    }
  }

  // Spring bij openen naar de dag van de nieuwste beschikbare samenvatting:
  // dat is waar je 's ochtends de wedstrijd van vannacht zoekt.
  // Geen enkele samenvatting? Dan naar vandaag (of de dag ervoor).
  const today = todayKey()
  const yesterday = yesterdayKey()
  let scrollKey = null
  for (const match of visible) {
    if (match.youtubeId || match.livestreamId) scrollKey = dayKey(match.kickoff)
  }
  if (!scrollKey) {
    for (const group of groups) {
      if (group.key <= today) scrollKey = group.key
    }
  }

  useEffect(() => {
    // anders zet de browser na een refresh de oude scrollpositie terug
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    if (!didScroll.current && todayRef.current) {
      didScroll.current = true
      requestAnimationFrame(() => {
        todayRef.current?.scrollIntoView({ block: 'start' })
      })
    }
  }, [])

  useEffect(() => {
    const check = () => {
      const el = todayRef.current
      if (!el) {
        setToonVandaag(false)
        return
      }
      const r = el.getBoundingClientRect()
      // knop tonen zodra de sectie van vandaag ruim uit beeld is
      setToonVandaag(r.top > window.innerHeight + 100 || r.bottom < -100)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [filters.onlyAvailable, filters.oranje])

  const naarVandaag = () => {
    todayRef.current?.scrollIntoView({ block: 'start' })
  }

  return (
    <div>
      <div className="flex gap-2 pb-5">
        <FilterChip
          active={filters.onlyAvailable}
          label="Alleen beschikbaar"
          onClick={() =>
            onFiltersChange({ ...filters, onlyAvailable: !filters.onlyAvailable })
          }
        />
        <FilterChip
          active={filters.oranje}
          label="Oranje"
          onClick={() => onFiltersChange({ ...filters, oranje: !filters.oranje })}
        />
      </div>

      {groups.length === 0 && (
        <p className="pt-8 text-center text-sm text-moss">
          Geen wedstrijden gevonden met deze filters.
        </p>
      )}

      <div className="space-y-2">
        {groups.map((group) => (
          <section
            key={group.key}
            ref={group.key === scrollKey ? todayRef : null}
            className="scroll-mt-2"
          >
            <h2 className="sticky top-0 z-10 -mx-4 bg-night/95 px-4 py-3 text-sm font-bold uppercase tracking-widest backdrop-blur">
              {group.key === today ? (
                <span className="text-oranje">Vandaag · {group.label}</span>
              ) : group.key === yesterday ? (
                <span className="text-cream">Gisteren · {group.label}</span>
              ) : (
                <span className="text-moss">{group.label}</span>
              )}
            </h2>
            <div className="space-y-2.5 pb-4">
              {group.matches.map((match) => (
                <MatchCard key={match.id} match={match} onOpen={onOpen} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Zwevende knop om terug te springen naar de nieuwste samenvatting */}
      {toonVandaag && (
        <button
          type="button"
          onClick={naarVandaag}
          className="fixed bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-oranje px-5 py-2.5 text-sm font-bold text-night shadow-lg shadow-black/40 active:bg-oranje/80"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          Nieuwste samenvatting
        </button>
      )}
    </div>
  )
}
