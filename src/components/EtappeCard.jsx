import { kickoffTime } from '../lib/format.js'
import { etappeTypeLabel, afstandLabel } from '../lib/tour.js'
import { BelKnop } from './MatchCard.jsx'

// Kaart voor één Tour-etappe. Zelfde ritme als MatchCard, maar zonder vlaggen:
// links het etappenummer, in het midden de route, rechts afspelen of de bel.
// SPOILERVRIJ: alleen vooraf bekende feiten (route, type, afstand, starttijd) —
// nooit een winnaar of klassement. Twee staten volstaan: elke etappe is vooraf
// bekend, dus de "nog te bepalen"-placeholder van MatchCard bestaat hier niet.

// Klein icoon bij het etappetype
function TypeIcoon({ type }) {
  const d =
    type === 'bergen'
      ? 'M3 18L9 8l3.5 5L16 7l5 11z'
      : type === 'heuvelachtig'
        ? 'M3 17q3.5-6 7-1t7-3l4 4'
        : type === 'tijdrit' || type === 'ploegentijdrit'
          ? 'M12 8v4l2.5 2.5M12 5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zM10 3h4'
          : 'M3 16h18M6 12h12'
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      className="flex-none fill-none stroke-current"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}

// Route als "start → finish", met een pijl die niet meebreekt
function Route({ etappe, available }) {
  return (
    <p
      className={`truncate leading-tight tracking-[-0.01em] ${
        available ? 'text-[15px] font-bold text-cream' : 'text-[14.5px] font-semibold text-moss'
      }`}
    >
      {etappe.startPlaats}
      <span className={`px-1 ${available ? 'text-moss-mid' : 'text-moss-dim'}`} aria-hidden="true">
        →
      </span>
      {etappe.finishPlaats}
    </p>
  )
}

function NummerBadge({ nr, available }) {
  return (
    <span
      className={`flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] border text-[15px] font-extrabold tabular-nums ${
        available
          ? 'border-line-strong bg-pitch text-cream'
          : 'border-line bg-night text-moss'
      }`}
      aria-hidden="true"
    >
      {nr}
    </span>
  )
}

export default function EtappeCard({
  match: etappe,
  onOpen,
  gevolgd = false,
  onToggleVolg,
  isEersteWachtende = false,
}) {
  const available = Boolean(etappe.youtubeId)
  const meta = [
    etappeTypeLabel(etappe.etappeType),
    afstandLabel(etappe.afstandKm),
    kickoffTime(etappe.kickoff),
  ]
    .filter(Boolean)
    .join(' · ')

  // Nog geen samenvatting: rustige rij met belletje, zoals bij MatchCard.
  if (!available) {
    const rij = (
      <div className="flex items-center gap-3.5 px-3.5 py-2.5">
        <NummerBadge nr={etappe.etappeNr} available={false} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 opacity-[0.85]">
          <p className="flex items-center gap-1.5 truncate text-[10px] font-semibold uppercase leading-none tracking-[0.08em] text-moss-dim">
            <TypeIcoon type={etappe.etappeType} />
            <span className="truncate">{meta}</span>
          </p>
          <Route etappe={etappe} available={false} />
        </div>
        <BelKnop gevolgd={gevolgd} onClick={() => onToggleVolg?.(etappe)} />
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
      onClick={() => onOpen(etappe)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(etappe)
        }
      }}
      className="flex cursor-pointer select-none items-center gap-3.5 rounded-2xl border border-line-strong bg-pitch-raised p-[13px_14px] transition-[transform,background-color] duration-150 ease-out active:scale-[0.985] active:bg-[#1f2b22]"
    >
      <NummerBadge nr={etappe.etappeNr} available />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="flex items-center gap-1.5 truncate text-[10px] font-semibold uppercase leading-none tracking-[0.08em] text-moss-mid">
          <TypeIcoon type={etappe.etappeType} />
          <span className="truncate">{meta}</span>
        </p>
        <Route etappe={etappe} available />
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
