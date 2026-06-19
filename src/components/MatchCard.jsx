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

// Belletje op een wedstrijd zonder samenvatting: tik = volgen. Uit = grijze
// omtrek, aan = oranje gevuld. Vervangt het oude "nog niet beschikbaar"-klokje:
// wachten doe je nu actief, met een seintje zodra de samenvatting klaarstaat.
function BelKnop({ gevolgd, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={gevolgd ? 'Stop met volgen' : 'Volg deze wedstrijd'}
      aria-pressed={gevolgd}
      className={`-my-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-150 active:bg-pitch ${
        gevolgd ? 'text-oranje' : 'text-moss hover:text-cream'
      }`}
    >
      {gevolgd ? (
        <svg viewBox="0 0 24 24" width="20" height="20" className="fill-current" aria-hidden="true">
          <path d="M12 2a6 6 0 0 0-6 6c0 6-3 8-3 8h18s-3-2-3-8a6 6 0 0 0-6-6z" />
          <path d="M10.4 21a1.8 1.8 0 0 0 3.2 0z" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          className="fill-none stroke-current"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      )}
    </button>
  )
}

export default function MatchCard({
  match,
  onOpen,
  gevolgd = false,
  onToggleVolg,
  isEersteWachtende = false,
}) {
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

  // Gespeeld of nog komend, maar zonder samenvatting: rustige rij met belletje
  // om de wedstrijd te volgen. Op de eerstvolgende wachtende tonen we eenmalig
  // een korte uitleg eronder (zolang die nog niet gevolgd wordt).
  if (!available) {
    const rij = (
      <div className="flex items-center gap-3.5 px-3.5 py-2.5">
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
        <BelKnop gevolgd={gevolgd} onClick={() => onToggleVolg?.(match)} />
      </div>
    )

    if (isEersteWachtende && !gevolgd) {
      return (
        <div className="overflow-hidden rounded-2xl border border-line-strong bg-pitch-raised">
          {rij}
          <div className="flex items-center gap-2.5 border-t border-line bg-pitch px-3.5 py-2.5">
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              className="shrink-0 fill-none stroke-oranje"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p className="text-[12.5px] leading-snug text-moss">
              Tik op de bel en krijg een seintje zodra de samenvatting
              klaarstaat
            </p>
          </div>
        </div>
      )
    }

    return rij
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
