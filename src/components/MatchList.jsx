import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { dayKey, dayLabel, todayKey, yesterdayKey } from '../lib/format.js'
import MatchCard from './MatchCard.jsx'

function FilterChip({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-[13px] font-bold transition-[background-color,border-color,color,transform] duration-200 ease-out active:scale-95 ${
        active
          ? 'border-oranje bg-oranje text-night shadow-glow-oranje'
          : 'border-line bg-pitch text-moss'
      }`}
    >
      {label}
    </button>
  )
}

function DayHeading({ group, today, yesterday }) {
  return (
    <h2 className="sticky top-0 z-10 -mx-4 flex items-center gap-2 bg-night/85 px-4 pb-2.5 pt-3.5 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur-lg">
      {group.key === today ? (
        <>
          {/* Ademend stipje: vandaag leeft */}
          <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
            <span className="absolute h-full w-full animate-pulse-ring rounded-full bg-oranje" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-oranje" />
          </span>
          <span className="text-oranje">Vandaag</span>
          <span className="text-moss-dim" aria-hidden="true">
            ·
          </span>
          <span className="text-moss">{group.label}</span>
        </>
      ) : group.key === yesterday ? (
        <>
          <span className="text-cream">Gisteren</span>
          <span className="text-moss-dim" aria-hidden="true">
            ·
          </span>
          <span className="text-moss">{group.label}</span>
        </>
      ) : (
        <span className="text-moss">{group.label}</span>
      )}
    </h2>
  )
}

export default function MatchList({ matches, onOpen, filters, onFiltersChange }) {
  const todayRef = useRef(null)
  const didScroll = useRef(false)
  // toon de zwevende knop zodra de sectie van vandaag uit beeld is
  const [toonVandaag, setToonVandaag] = useState(false)
  // wijst de pijl op de knop omhoog of omlaag?
  const [richting, setRichting] = useState('omhoog')

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
      if (r.top > window.innerHeight + 100) {
        setToonVandaag(true)
        setRichting('omlaag')
      } else if (r.bottom < -100) {
        setToonVandaag(true)
        setRichting('omhoog')
      } else {
        setToonVandaag(false)
      }
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

  const filtersActief = filters.onlyAvailable || filters.oranje

  return (
    <div>
      <div className="flex gap-2 pb-4">
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
        <div className="flex animate-fade-up flex-col items-center gap-4 px-6 pt-16 text-center">
          <svg
            viewBox="0 0 64 64"
            className="h-12 w-12 opacity-80"
            aria-hidden="true"
          >
            <path
              d="M11 32 Q32 15 53 32 Q32 49 11 32 Z"
              className="fill-none stroke-line-strong"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <circle cx="32" cy="32" r="6" className="fill-line-strong" />
          </svg>
          <p className="text-sm font-medium leading-relaxed text-moss">
            Geen wedstrijden gevonden met deze filters.
          </p>
          {filtersActief && (
            <button
              type="button"
              onClick={() => onFiltersChange({ onlyAvailable: false, oranje: false })}
              className="rounded-full border border-line bg-pitch px-4 py-2 text-[13px] font-bold text-cream transition-colors active:bg-line"
            >
              Filters wissen
            </button>
          )}
        </div>
      )}

      <div>
        {groups.map((group) => (
          <section
            key={group.key}
            ref={group.key === scrollKey ? todayRef : null}
            className="scroll-mt-2"
          >
            <DayHeading group={group} today={today} yesterday={yesterday} />
            <div className="space-y-2.5 pb-5 pt-0.5">
              {group.matches.map((match) => (
                <MatchCard key={match.id} match={match} onOpen={onOpen} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Zwevende knop om terug te springen naar de nieuwste samenvatting.
          Blijft gemount zodat hij vloeiend in en uit beeld kan glijden.
          Via een portal op <body>: een voorouder met transform (de
          entree-animatie) zou position:fixed anders kapotmaken. */}
      {createPortal(
        <button
          type="button"
          onClick={naarVandaag}
          tabIndex={toonVandaag ? 0 : -1}
          aria-hidden={!toonVandaag}
          className={`fixed bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-oranje py-3 pl-4 pr-5 text-sm font-bold text-night shadow-float transition-[opacity,translate] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            toonVandaag
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-20 opacity-0'
          }`}
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 fill-none stroke-current transition-transform duration-300 ${
              richting === 'omlaag' ? 'rotate-180' : ''
            }`}
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path d="M5 14l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Nieuwste samenvatting
        </button>,
        document.body,
      )}
    </div>
  )
}
