import { kickoffTime } from '../lib/format.js'

function TeamRow({ flag, name }) {
  const oranje = name === 'Nederland'
  return (
    <p className="flex items-center gap-2 leading-snug">
      {flag && <span className="text-lg leading-none">{flag}</span>}
      <span className={`font-semibold ${oranje ? 'text-oranje' : ''}`}>{name}</span>
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
              if (e.key === 'Enter' || e.key === ' ') onOpen(match)
            }
          : undefined
      }
      className={`flex gap-4 rounded-2xl border p-4 ${
        available
          ? 'cursor-pointer border-oranje/30 bg-pitch-raised transition-colors active:bg-line'
          : 'border-line/60 bg-pitch'
      }`}
    >
      <div className="w-12 shrink-0 pt-0.5">
        <p className={`text-lg font-bold tabular-nums ${available ? 'text-cream' : 'text-moss'}`}>
          {kickoffTime(match.kickoff)}
        </p>
      </div>

      <div className="min-w-0 flex-1">
        {placeholder ? (
          <p className="font-semibold text-moss">{match.teamA}</p>
        ) : (
          <div className="space-y-1">
            <TeamRow flag={match.flagA} name={match.teamA} />
            <TeamRow flag={match.flagB} name={match.teamB} />
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {available ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-oranje/15 px-2.5 py-1 text-xs font-semibold text-oranje">
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-oranje">
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
              {match.youtubeId ? 'Samenvatting beschikbaar' : 'Hele wedstrijd beschikbaar'}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-line/50 px-2.5 py-1 text-xs font-medium text-moss">
              Nog niet beschikbaar
            </span>
          )}
          <span className="text-xs font-medium uppercase tracking-wide text-moss/80">
            {match.stage}
          </span>
        </div>
      </div>

      {available && (
        <div className="flex items-center">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-oranje" strokeWidth="2">
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  )
}
