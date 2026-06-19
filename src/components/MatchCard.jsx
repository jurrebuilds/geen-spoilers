import { kickoffTime } from '../lib/format.js'
import { Flag, FlagPlaceholder } from '../lib/flags.jsx'

function TeamRow({ name, available }) {
  const oranje = name === 'Nederland'
  const kleur = available
    ? oranje
      ? 'text-oranje'
      : 'text-cream'
    : oranje
      ? 'text-oranje-dim'
      : 'text-moss'
  return (
    <div className="flex min-w-0 items-center gap-[9px]">
      <Flag team={name} width={26} height={19} radius={4} />
      <span
        className={`truncate leading-none tracking-[-0.01em] ${kleur} ${
          available ? 'text-[15.5px] font-bold' : 'text-[15px] font-semibold'
        }`}
      >
        {name}
      </span>
    </div>
  )
}

export default function MatchCard({ match, onOpen }) {
  const available = Boolean(match.youtubeId)
  const placeholder = !match.teamB

  // Nog niet ingevulde knock-outwedstrijd: gestippelde vlag, gedempte tekst
  if (placeholder) {
    return (
      <div className="flex items-center gap-3.5 rounded-[14px] px-3.5 py-2.5">
        <p className="w-12 shrink-0 text-base font-semibold leading-none tabular-nums text-moss-soft">
          {kickoffTime(match.kickoff)}
        </p>
        <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
          <p className="truncate text-[10px] font-semibold uppercase leading-none tracking-[0.08em] text-moss-dim">
            {match.stage}
          </p>
          <div className="flex items-center gap-[11px]">
            <FlagPlaceholder />
            <span className="text-[14.5px] font-semibold text-moss-soft">{match.teamA}</span>
          </div>
        </div>
      </div>
    )
  }

  // Gespeeld of nog komend, maar zonder video: rustige rij zonder kaart
  if (!available) {
    return (
      <div className="flex items-center gap-3.5 rounded-[14px] px-3.5 py-2.5">
        <p className="w-12 shrink-0 text-base font-semibold leading-none tabular-nums text-moss-soft">
          {kickoffTime(match.kickoff)}
        </p>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="truncate text-[10px] font-semibold uppercase leading-none tracking-[0.08em] text-moss-dim">
            {match.stage}
          </p>
          <div className="opacity-[0.78]">
            <div className="flex flex-col gap-1.5">
              <TeamRow name={match.teamA} available={false} />
              <TeamRow name={match.teamB} available={false} />
            </div>
          </div>
        </div>
        <div
          className="flex w-[34px] shrink-0 items-center justify-center"
          title="Nog niet beschikbaar"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            className="fill-none stroke-moss-dim"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="sr-only">Nog niet beschikbaar</span>
        </div>
      </div>
    )
  }

  // Terug te kijken: kaart met afspeelknop
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(match)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(match)
        }
      }}
      className="flex cursor-pointer select-none items-center gap-3.5 rounded-2xl border border-line-strong bg-pitch-raised p-[13px_14px] transition-[transform,background-color] duration-150 ease-out active:scale-[0.985] active:bg-[#1f2b22]"
    >
      <p className="w-12 shrink-0 text-[17px] font-bold leading-none tracking-[-0.01em] tabular-nums text-cream">
        {kickoffTime(match.kickoff)}
      </p>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="truncate text-[10px] font-semibold uppercase leading-none tracking-[0.08em] text-moss-mid">
          {match.stage}
        </p>
        <TeamRow name={match.teamA} available />
        <TeamRow name={match.teamB} available />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span
          className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-oranje"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" width="17" height="17" className="ml-0.5 fill-night">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        </span>
      </div>
    </div>
  )
}
