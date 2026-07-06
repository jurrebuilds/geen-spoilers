import { TIKKIE_URL } from '../lib/tikkie.js'
import { track } from '../lib/analytics.js'

// Doneerregel direct onder de video: "Steun geenspoilers.nl met een biertje",
// opent een Tikkie-betaalverzoek. Bewust de blikvanger tussen de kaarten:
// oranje rand met zachte gloed en "via Tikkie" als echte knop. Zonder
// Tikkie-link (env-var leeg) verschijnt er niets.
export default function SteunRegel({ match }) {
  if (!TIKKIE_URL) return null

  return (
    <a
      href={TIKKIE_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        track('steun_geopend', {
          bron: 'video',
          match_id: match.id,
          teams: `${match.teamA} - ${match.teamB}`,
          stage: match.stage || null,
        })
      }
      className="mb-2 flex items-center gap-2.5 rounded-[14px] border border-oranje/35 bg-pitch-raised px-[13px] py-[11px] shadow-glow-oranje-soft transition-colors duration-150 active:bg-pitch"
    >
      <span className="flex flex-none text-oranje">
        <svg viewBox="0 0 24 24" width="18" height="18" className="fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 11h1a3 3 0 0 1 0 6h-1" />
          <path d="M9 12v6M13 12v6" />
          <path d="M5 8h12v9a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" />
          <path d="M5 8a3 3 0 0 1 3-3c.5 0 1 .15 1.4.42A3 3 0 0 1 14 4.5a2.5 2.5 0 0 1 3 2.5" />
        </svg>
      </span>
      <span className="flex-1 text-[12px] font-semibold leading-[1.3] text-cream">
        Steun geenspoilers.nl met een biertje
      </span>
      <span className="flex flex-none items-center rounded-full bg-oranje px-3.5 py-[7px] text-[12px] font-bold text-night">
        via Tikkie
      </span>
    </a>
  )
}
