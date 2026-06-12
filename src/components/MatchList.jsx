import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  dayKey,
  dayMonthLabel,
  todayKey,
  weekdayLabel,
  yesterdayKey,
} from '../lib/format.js'
import MatchCard from './MatchCard.jsx'

function FilterChip({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-2 text-[13.5px] font-bold transition-[background-color,border-color,color] duration-150 ${
        active
          ? 'border-oranje bg-oranje text-night'
          : 'border-line bg-transparent text-moss'
      }`}
    >
      {label}
    </button>
  )
}

function DayHeading({ group, today, yesterday }) {
  const eyebrow =
    group.key === today
      ? 'Vandaag'
      : group.key === yesterday
        ? 'Gisteren'
        : group.weekday
  const n = group.matches.length
  return (
    <div className="sticky top-[79px] z-10 flex items-end justify-between gap-3 bg-night/[0.92] px-[18px] pb-[9px] pt-[13px] backdrop-blur-[10px]">
      <div className="flex items-baseline gap-2.5">
        <span
          className={`text-[11px] font-bold uppercase tracking-[0.14em] ${
            group.key === today ? 'text-oranje' : 'text-moss'
          }`}
        >
          {eyebrow}
        </span>
        <h2 className="text-[21px] font-bold leading-none tracking-[-0.02em] text-cream">
          {group.title}
        </h2>
      </div>
      <span className="whitespace-nowrap text-[11px] font-medium tabular-nums text-moss-mid">
        {n} {n === 1 ? 'wedstrijd' : 'wedstrijden'}
      </span>
    </div>
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
    visible = visible.filter((m) => m.youtubeId || m.livestreamId)
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
      groups.push({
        key,
        weekday: weekdayLabel(match.kickoff),
        title: dayMonthLabel(match.kickoff),
        matches: [match],
      })
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
      if (r.top > window.innerHeight + 80) {
        setToonVandaag(true)
        setRichting('omlaag')
      } else if (r.bottom < -80) {
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
    todayRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  return (
    <div>
      <div className="flex gap-2 px-[18px] pb-3 pt-3.5">
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
        <div className="flex animate-fade-up flex-col items-center gap-4 px-[30px] pt-[70px] pb-[70px] text-center">
          {/* Gesloten oog: hier valt niets te zien */}
          <svg viewBox="0 0 64 64" width="62" height="62" aria-hidden="true">
            <rect width="64" height="64" rx="16" className="fill-pitch-raised" />
            <path
              d="M14 34 Q32 24 50 34"
              fill="none"
              stroke="#ff7a1f"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <g stroke="#8fa093" strokeWidth="2" strokeLinecap="round">
              <line x1="20" y1="37" x2="18" y2="41" />
              <line x1="32" y1="39.5" x2="32" y2="44" />
              <line x1="44" y1="37" x2="46" y2="41" />
            </g>
          </svg>
          <div>
            <p className="text-[19px] font-bold tracking-[-0.01em] text-cream">
              Niets te zien hier
            </p>
            <p className="mx-auto mt-[7px] max-w-60 text-[13.5px] leading-normal text-moss">
              Geen wedstrijden met deze filters. Pas ze aan of bekijk weer alles.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onFiltersChange({ onlyAvailable: false, oranje: false })}
            className="mt-0.5 rounded-full bg-oranje px-5 py-[11px] text-sm font-bold text-night transition-transform duration-150 active:scale-95"
          >
            Filters wissen
          </button>
        </div>
      )}

      <div>
        {groups.map((group) => (
          <section
            key={group.key}
            ref={group.key === scrollKey ? todayRef : null}
            className="scroll-mt-[79px]"
          >
            <DayHeading group={group} today={today} yesterday={yesterday} />
            <div className="flex flex-col gap-2 px-3.5 pb-3 pt-2">
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
          className={`fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-oranje py-[11px] pl-[15px] pr-[17px] text-[13.5px] font-bold text-night shadow-float transition-[opacity,translate] duration-200 ease-out ${
            toonVandaag
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-3 opacity-0'
          }`}
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            className={`fill-none stroke-night transition-transform duration-200 ${
              richting === 'omlaag' ? 'rotate-180' : ''
            }`}
            strokeWidth="2.4"
            aria-hidden="true"
          >
            <path d="M12 19V6M6 11l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Nieuwste samenvatting
        </button>,
        document.body,
      )}
    </div>
  )
}
