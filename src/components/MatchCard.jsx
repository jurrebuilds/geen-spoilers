import { kickoffTime } from '../lib/format.js'

function TeamRow({ flag, name, available }) {
  const oranje = name === 'Nederland'
  return (
    <p className="flex min-w-0 items-center gap-2.5">
      <span className="w-6 shrink-0 text-center text-xl leading-none" aria-hidden="true">
        {flag}
      </span>
      <span
        className={`truncate text-[15px] font-semibold leading-6 ${
          oranje ? 'text-oranje' : available ? 'text-cream' : 'text-cream/75'
        }`}
      >
        {name}
      </span>
    </p>
  )
}

export default function MatchCard({ match, onOpen }) {
  const available = Boolean(match.youtubeId || match.livestreamId)
  const placeholder = !match.teamB

  return (
    <div
      role={available ? 'button' : undefined}
      tabIndex={available ? 0 : undefined}
      onClick={available ? () => onOpen(match) : undefined}
      onKeyDown={
        available
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onOpen(match)
              }
            }
          : undefined
      }
      className={`group rounded-2xl border p-4 ${
        available
          ? 'cursor-pointer border-line-strong/70 bg-pitch-raised transition-[transform,background-color,border-color] duration-200 ease-out select-none active:scale-[0.98] active:bg-line/50'
          : 'border-line/40 bg-pitch'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Aftraptijd: verticaal gecentreerd tussen de twee teamregels,
            zoals in een klassieke wedstrijdlijst */}
        <p
          className={`w-12 shrink-0 text-base font-bold tabular-nums tracking-tight ${
            available ? 'text-cream' : 'text-moss-dim'
          }`}
        >
          {kickoffTime(match.kickoff)}
        </p>

        <div className="min-w-0 flex-1">
          {placeholder ? (
            <p className="text-[15px] font-semibold leading-6 text-moss">{match.teamA}</p>
          ) : (
            <div className="space-y-1">
              <TeamRow flag={match.flagA} name={match.teamA} available={available} />
              <TeamRow flag={match.flagB} name={match.teamB} available={available} />
            </div>
          )}
        </div>

        {available && (
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-oranje text-night shadow-glow-oranje transition-transform duration-200 ease-out group-active:scale-90"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4 fill-current">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </span>
        )}
      </div>

      {/* Metaregel onder de volle breedte, uitgelijnd met de teamnamen */}
      <p className="mt-2 ml-15 flex items-center gap-1.5 text-xs leading-5">
        {available ? (
          <>
            <span className="shrink-0 font-bold text-oranje">
              {match.youtubeId ? 'Samenvatting' : 'Hele wedstrijd'}
            </span>
            <span className="text-moss-dim" aria-hidden="true">
              ·
            </span>
            <span className="truncate font-semibold uppercase tracking-[0.1em] text-moss">
              {match.stage}
            </span>
          </>
        ) : (
          <>
            <span className="truncate font-semibold uppercase tracking-[0.1em] text-moss-dim">
              {match.stage}
            </span>
            <span className="text-moss-dim/70" aria-hidden="true">
              ·
            </span>
            <span className="shrink-0 font-medium text-moss-dim">Nog niet beschikbaar</span>
          </>
        )}
      </p>
    </div>
  )
}
