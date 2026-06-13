import { useEffect, useRef, useState } from 'react'
import { loadYouTubeAPI } from '../lib/youtube.js'
import {
  dayMonthLabel,
  kickoffTime,
  dayInZone,
  timeInZone,
} from '../lib/format.js'
import { Flag } from '../lib/flags.jsx'

// Moet exact de app-achtergrond zijn: de balk over de YouTube-titel
// en de afdekpanelen vallen dan weg tegen de rest van het scherm.
const BG = '#0c120e'

// Spoilervrije speler. Spelregels:
// - Nooit de YouTube-titel of -thumbnail tonen: eigen poster en koptekst.
//   De titelbalk wordt weggesneden: de speler is OVERSCAN px hoger dan het
//   zichtbare venster (overflow-hidden), dus YouTube tekent titel en knoppen
//   in de verborgen rand terwijl het beeld zelf — met scorebug en kloktijd —
//   volledig zichtbaar blijft.
// - Nooit het eindscherm met aanbevolen video's tonen: bij ENDED gaat er
//   direct een dekkend paneel overheen.
// - Bij PAUSED dekt een paneel de hele video af, want gepauzeerde embeds
//   kunnen "Meer video's" met andere samenvattingen (en uitslagen) tonen.
// De afdekpanelen liggen binnen het 16:9-videovak, zodat de wedstrijdinfo
// eronder altijd zichtbaar blijft — ook vóór je op play drukt.

// Genoeg om de YouTube-titelstrook (~64px) ruim buiten beeld te houden
const OVERSCAN = 96

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds))
  const u = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return u > 0 ? `${u}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

function TeamNaam({ name }) {
  return (
    <span className={name === 'Nederland' ? 'text-oranje' : 'text-cream'}>{name}</span>
  )
}

// Spoelknop: cirkelpijl met de seconden erin, pijlrichting = spoelrichting
function SkipButton({ seconds, onClick }) {
  const terug = seconds < 0
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        terug ? `${-seconds} seconden terug` : `${seconds} seconden vooruit`
      }
      className="flex h-11 w-11 items-center justify-center rounded-full text-cream transition-[transform,background-color] duration-150 ease-out active:scale-90 active:bg-pitch-raised"
    >
      <svg viewBox="0 0 24 24" width="27" height="27" fill="none" aria-hidden="true">
        {/* Boog rond middelpunt (12,13), straal 7: start bovenin het midden,
            300° rond, opening aan de kant waar de pijlpunt heen wijst */}
        <path
          d={terug ? 'M12 6 A7 7 0 1 1 5.94 9.5' : 'M12 6 A7 7 0 1 0 18.06 9.5'}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={terug ? 'M12.2 2.8 L8.7 6 L12.2 9.2' : 'M11.8 2.8 L15.3 6 L11.8 9.2'}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="12"
          y="15.8"
          textAnchor="middle"
          fontSize="7.5"
          fontWeight="800"
          fill="currentColor"
          stroke="none"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {Math.abs(seconds)}
        </text>
      </svg>
    </button>
  )
}

// WMO-weercode naar Nederlandse omschrijving
function weatherLabel(code) {
  if (code == null) return null
  if (code === 0) return 'Onbewolkt'
  if (code === 1) return 'Vrijwel onbewolkt'
  if (code === 2) return 'Half bewolkt'
  if (code === 3) return 'Bewolkt'
  if (code === 45 || code === 48) return 'Mist'
  if (code >= 51 && code <= 57) return 'Motregen'
  if (code >= 61 && code <= 67) return 'Regen'
  if (code >= 71 && code <= 77) return 'Sneeuw'
  if (code >= 80 && code <= 82) return 'Buien'
  if (code >= 85 && code <= 86) return 'Sneeuwbuien'
  if (code >= 95) return 'Onweer'
  return null
}

const nlGetal = (n) => Number(n).toLocaleString('nl-NL')

// ── Verrijking onder de video ───────────────────────────────────────────
function SectieLabel({ children }) {
  return (
    <p className="mx-1 mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-moss-soft">
      {children}
    </p>
  )
}

function Chip({ icon, k, v, sub }) {
  return (
    <div className="rounded-2xl border border-line bg-pitch px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-moss-mid">
        {icon}
        <span className="truncate">{k}</span>
      </div>
      <div className="mt-1.5 text-[17px] font-bold tabular-nums text-cream">{v}</div>
      {sub && <div className="text-[11.5px] font-semibold text-moss">{sub}</div>}
    </div>
  )
}

function chipIcon(d, opts = {}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      className="flex-none stroke-moss-mid"
      fill="none"
      strokeWidth="1.8"
      aria-hidden="true"
      {...opts}
    >
      {d}
    </svg>
  )
}

function TeamOpstelling({ flag, naam, team }) {
  const Rij = ({ n, name, sub }) => (
    <div className="flex items-center gap-2.5 py-[5px]">
      <span
        className={`w-[22px] flex-none text-right text-[12px] font-bold tabular-nums ${
          sub ? 'text-moss-dim' : 'text-moss-mid'
        }`}
      >
        {n}
      </span>
      <span
        className={
          sub
            ? 'text-[12.5px] font-medium leading-tight text-moss'
            : 'text-[13.5px] font-semibold leading-tight text-cream'
        }
      >
        {name}
      </span>
    </div>
  )
  return (
    <div className="rounded-2xl border border-line bg-pitch px-3 py-3.5">
      <div className="mb-2.5 flex items-start justify-between gap-2 border-b border-line pb-2.5">
        <span className="flex items-center gap-2 text-[13px] font-extrabold leading-tight">
          <span aria-hidden="true">{flag}</span>
          <span>{naam}</span>
        </span>
        {team.formation && (
          <span className="flex-none text-[11px] font-bold tabular-nums text-oranje">
            {team.formation}
          </span>
        )}
      </div>
      {team.start.map((p, i) => (
        <Rij key={`s${i}`} n={p.n} name={p.name} />
      ))}
      {team.subs?.length > 0 && (
        <>
          <p className="mb-1 mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-moss-dim">
            Wisselspelers
          </p>
          {team.subs.map((p, i) => (
            <Rij key={`b${i}`} n={p.n} name={p.name} sub />
          ))}
        </>
      )}
      {team.coach && (
        <div className="mt-3 flex items-center gap-2.5 border-t border-line pt-2.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-moss-dim">
            Coach
          </span>
          <span className="text-[13px] font-bold text-cream">{team.coach}</span>
        </div>
      )}
    </div>
  )
}

function Verrijking({ match, actieveVideoId }) {
  const {
    venue,
    city,
    capacity,
    venueTz,
    tempC,
    windKmh,
    weatherCode,
    lineup,
    photo,
    photoCredit,
  } = match

  const toonAftrap = Boolean(venueTz)
  const weer = weatherLabel(weatherCode)
  const weerTekst = [weer, windKmh != null && `wind ${Math.round(windKmh)} km/u`]
    .filter(Boolean)
    .join(' · ')

  const kaartUrl =
    venue &&
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${venue} ${city || ''}`,
    )}`

  return (
    <div className="px-3 pt-2">
      {/* Bron & let-op, herstyled, direct onder de video */}
      <div className="rounded-2xl border border-line bg-pitch px-4 py-3.5">
        <div className="flex items-start gap-[11px]">
          <span className="flex h-[18px] flex-none items-center">
            <svg viewBox="0 0 24 24" width="15" height="15" className="stroke-moss-mid" fill="none" strokeWidth="1.8" aria-hidden="true">
              <rect x="3" y="6" width="13" height="12" rx="2" />
              <path d="M16 10.5l5-2.5v8l-5-2.5z" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="text-[12px] leading-[1.5] text-moss">
            Video: NOS Sport, via{' '}
            {actieveVideoId ? (
              <a
                href={`https://www.youtube.com/watch?v=${actieveVideoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cream underline underline-offset-2 transition-colors active:text-oranje"
              >
                YouTube
              </a>
            ) : (
              'YouTube'
            )}
            . Let op: daar zie je titels, comments en aanbevolen video's die de
            uitslag kunnen verraden.
          </p>
        </div>
        <div className="mt-4 flex items-start gap-[11px]">
          <span className="flex h-[18px] flex-none items-center">
            <svg viewBox="0 0 24 24" width="15" height="15" className="stroke-moss-mid" fill="none" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4.5M12 16h.01" strokeLinecap="round" />
            </svg>
          </span>
          <p className="text-[12px] leading-[1.5] text-moss">
            De video werkt mogelijk niet vanuit het buitenland of met&nbsp;een&nbsp;vpn.
          </p>
        </div>
      </div>

      {/* Opstelling bij aftrap (direct onder de bron) */}
      {lineup && (
        <div className="mt-5">
          <SectieLabel>Opstelling</SectieLabel>
          <div className="mx-1 mb-3 flex items-center gap-1.5 text-[11.5px] text-moss-mid">
            <svg viewBox="0 0 24 24" width="13" height="13" className="flex-none stroke-oranje" fill="none" strokeWidth="1.8" aria-hidden="true">
              <path d="M12 9v4M12 17h.01M10.3 3.9 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>
              Opstelling bij aftrap. Wissels tijdens de wedstrijd verbergen we —
              dat zijn spoilers.
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <TeamOpstelling flag={match.flagA} naam={match.teamA} team={lineup.a} />
            <TeamOpstelling flag={match.flagB} naam={match.teamB} team={lineup.b} />
          </div>
        </div>
      )}

      {/* Aftrap: lokale tijd (links) + temperatuur (rechts) */}
      {toonAftrap && (
        <div className="mt-5">
          <SectieLabel>Aftrap</SectieLabel>
          <div className="grid grid-cols-2 gap-2">
            <Chip
              icon={chipIcon(
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
                </>,
              )}
              k="Lokale tijd"
              v={timeInZone(match.kickoff, venueTz)}
              sub={dayInZone(match.kickoff, venueTz)}
            />
            {tempC != null && (
              <Chip
                icon={chipIcon(
                  <path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0z" strokeLinejoin="round" />,
                )}
                k="Temperatuur"
                v={`${Math.round(tempC)}°C`}
                sub={weerTekst || null}
              />
            )}
          </div>
        </div>
      )}

      {/* Stadion (onderaan) — foto met weer-label bij aftrap */}
      {venue && (
        <div className="mt-5">
          <SectieLabel>Stadion</SectieLabel>
          <div className="overflow-hidden rounded-2xl border border-line bg-pitch">
            {photo ? (
              <img
                src={photo}
                alt={venue}
                referrerPolicy="no-referrer"
                className="block h-[180px] w-full object-cover"
              />
            ) : (
              <div className="h-[132px] bg-pitch-raised">
                <svg viewBox="0 0 400 132" preserveAspectRatio="none" className="h-full w-full">
                  <rect x="0" y="0" width="400" height="132" fill="#19231b" />
                  <g stroke="#2c3a30" strokeWidth="1.5" fill="none" opacity="0.85">
                    <rect x="14" y="12" width="372" height="108" rx="2" />
                    <line x1="200" y1="12" x2="200" y2="120" />
                    <circle cx="200" cy="66" r="26" />
                    <circle cx="200" cy="66" r="1.6" fill="#2c3a30" />
                    <rect x="14" y="36" width="46" height="60" />
                    <rect x="14" y="52" width="20" height="28" />
                    <rect x="340" y="36" width="46" height="60" />
                    <rect x="366" y="52" width="20" height="28" />
                  </g>
                </svg>
              </div>
            )}
            <div className="flex items-end justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <div className="truncate text-[19px] font-extrabold tracking-tight">
                  {venue}
                </div>
                <div className="mt-0.5 text-[12.5px] font-semibold text-moss">
                  {[city, capacity != null && `capaciteit ${nlGetal(capacity)}`]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </div>
              {kaartUrl && (
                <a
                  href={kaartUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-none rounded-full border border-line-strong px-3 py-1.5 text-[12px] font-bold text-oranje transition-colors active:bg-pitch-raised"
                >
                  Op de kaart ↗
                </a>
              )}
            </div>
          </div>
          {photo && photoCredit && (
            <p className="mx-1 mt-1.5 text-[10.5px] text-moss-dim">Foto: {photoCredit}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function Player({ match, onBack }) {
  // 'poster' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'
  const [phase, setPhase] = useState('poster')
  const [progress, setProgress] = useState({ time: 0, duration: 0 })
  // 'samenvatting' (standaard) of 'live' (hele wedstrijd terugkijken)
  const [source, setSource] = useState(match.youtubeId ? 'samenvatting' : 'live')
  // tijdens slepen: positie 0..1 op de balk, anders null
  const [dragFrac, setDragFrac] = useState(null)
  const mountRef = useRef(null)
  const playerRef = useRef(null)
  const barRef = useRef(null)
  const draggingRef = useRef(false)
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const readyRef = useRef(false)
  const pendingPlayRef = useRef(false)
  const apiFailedRef = useRef(false)
  const watchdogRef = useRef(null)

  // De speler wordt alvast opgebouwd zodra de bron bekend is, onzichtbaar
  // achter de poster. Mobiel (iOS/Android) staat afspelen met geluid alleen
  // toe als playVideo() synchroon binnen de tik wordt aangeroepen; een speler
  // die pas ná de tik wordt opgebouwd blijft daar eindeloos op "Laden" staan.
  useEffect(() => {
    let cancelled = false
    readyRef.current = false
    ;(async () => {
      let YT
      try {
        YT = await loadYouTubeAPI()
      } catch {
        apiFailedRef.current = true
        if (!cancelled && pendingPlayRef.current) setPhase('error')
        return
      }
      if (cancelled || !mountRef.current) return

      playerRef.current = new YT.Player(mountRef.current, {
        host: 'https://www.youtube-nocookie.com',
        videoId: source === 'samenvatting' ? match.youtubeId : match.livestreamId,
        width: '100%',
        height: '100%',
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          iv_load_policy: 3,
          fs: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            readyRef.current = true
            // tik kwam binnen voordat de speler klaar was: alsnog starten
            if (pendingPlayRef.current) {
              pendingPlayRef.current = false
              e.target.playVideo()
            }
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.ENDED) {
              setPhase('ended')
            } else if (e.data === YT.PlayerState.PAUSED) {
              setPhase('paused')
            } else if (
              e.data === YT.PlayerState.PLAYING ||
              e.data === YT.PlayerState.BUFFERING
            ) {
              clearTimeout(watchdogRef.current)
              // niet terugschakelen vanuit het eindscherm
              if (phaseRef.current !== 'ended') setPhase('playing')
            }
          },
          onError: () => {
            setPhase('error')
          },
        },
      })
    })()
    return () => {
      cancelled = true
      clearTimeout(watchdogRef.current)
      pendingPlayRef.current = false
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch {
          // speler was al opgeruimd
        }
        playerRef.current = null
      }
    }
  }, [source, match.youtubeId, match.livestreamId])

  const start = () => {
    if (apiFailedRef.current) {
      setPhase('error')
      return
    }
    setPhase('loading')
    if (readyRef.current && playerRef.current) {
      // synchroon binnen de tik: alleen zo staat mobiel geluid toe
      try {
        playerRef.current.playVideo()
      } catch {
        // speler nog niet klaar
      }
    } else {
      pendingPlayRef.current = true
    }
    // Vangnet: start het afspelen toch niet (bijv. omdat de speler nog niet
    // klaar was en de start buiten de tik werd geblokkeerd), val dan terug op
    // het pauzepaneel — die tik roept playVideo() wél direct aan.
    clearTimeout(watchdogRef.current)
    watchdogRef.current = setTimeout(() => {
      if (phaseRef.current === 'loading') setPhase('paused')
    }, 4000)
  }

  const resume = () => {
    if (playerRef.current) {
      playerRef.current.playVideo()
    }
  }

  const pauzeer = () => {
    try {
      playerRef.current?.pauseVideo()
    } catch {
      // speler nog niet klaar
    }
  }

  // Vanuit het eindscherm opnieuw vanaf het begin kijken
  const herstart = () => {
    const p = playerRef.current
    if (!p) return
    try {
      setPhase('playing')
      p.seekTo(0, true)
      p.playVideo()
    } catch {
      // speler nog niet klaar
    }
  }

  // Wisselen tussen samenvatting en hele wedstrijd: het effect hierboven
  // ruimt de oude speler op en bouwt er een op voor de nieuwe bron
  const wisselBron = (nieuw) => {
    if (nieuw === source) return
    draggingRef.current = false
    setDragFrac(null)
    setProgress({ time: 0, duration: 0 })
    setPhase('poster')
    setSource(nieuw)
  }

  const showVideo = phase === 'playing' || phase === 'paused' || phase === 'ended'

  // De video die nu gekozen is; ook gebruikt voor de bronvermelding
  const actieveVideoId =
    source === 'samenvatting' ? match.youtubeId : match.livestreamId

  const bronLabel = source === 'samenvatting' ? 'Samenvatting' : 'Hele wedstrijd'

  // Positie van de voortgangsbalk in procenten (tijdens slepen: sleeppositie)
  const scrubPct = progress.duration
    ? Math.min(
        100,
        dragFrac != null
          ? dragFrac * 100
          : (progress.time / progress.duration) * 100,
      )
    : 0

  // Voortgang bijhouden voor de eigen balk en tijdsaanduiding
  useEffect(() => {
    if (!showVideo) return
    const id = setInterval(() => {
      const p = playerRef.current
      if (!p || typeof p.getCurrentTime !== 'function') return
      if (draggingRef.current) return
      try {
        setProgress({
          time: p.getCurrentTime() || 0,
          duration: p.getDuration() || 0,
        })
      } catch {
        // speler nog niet klaar
      }
    }, 500)
    return () => clearInterval(id)
  }, [showVideo])

  // Spoelen via eigen knoppen; speelt altijd door vanaf het nieuwe punt,
  // ook als de video gepauzeerd was.
  const skip = (seconds) => {
    const p = playerRef.current
    if (!p) return
    try {
      const t = p.getCurrentTime() || 0
      p.seekTo(Math.max(0, t + seconds), true)
      p.playVideo()
    } catch {
      // speler nog niet klaar
    }
  }

  // Scrubben op de eigen voortgangsbalk: tikken of slepen
  const fracVanEvent = (e) => {
    const rect = barRef.current.getBoundingClientRect()
    return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  }

  const scrubStart = (e) => {
    if (!progress.duration) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // synthetische events kennen geen pointer capture
    }
    draggingRef.current = true
    const f = fracVanEvent(e)
    setDragFrac(f)
    playerRef.current?.seekTo(f * progress.duration, false)
  }

  const scrubMove = (e) => {
    if (!draggingRef.current) return
    const f = fracVanEvent(e)
    setDragFrac(f)
    playerRef.current?.seekTo(f * progress.duration, false)
  }

  const scrubEnd = (e) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    const f = fracVanEvent(e)
    setDragFrac(null)
    setProgress((prev) => ({ ...prev, time: f * prev.duration }))
    try {
      playerRef.current?.seekTo(f * progress.duration, true)
      playerRef.current?.playVideo()
    } catch {
      // speler nog niet klaar
    }
  }

  // Soepel meelopende balk tijdens afspelen; tijdens slepen direct volgen
  const vloeiend = dragFrac == null

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col text-cream md:max-w-4xl">
      {/* Eigen koptekst — nooit de YouTube-titel. */}
      <header className="relative z-30 flex flex-none items-center gap-1.5 px-2 py-1.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Terug naar wedstrijden"
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full transition-colors duration-150 active:bg-pitch-raised"
        >
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            className="fill-none stroke-cream"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase leading-none tracking-[0.1em] text-oranje">
            {bronLabel}
          </p>
          <h1 className="mt-[3px] truncate text-base font-bold leading-tight tracking-[-0.01em]">
            {match.teamA}
            {match.teamB ? ` – ${match.teamB}` : ''}
          </h1>
          <p className="mt-[3px] truncate text-[11.5px] font-semibold tabular-nums text-moss">
            {[match.stage, dayMonthLabel(match.kickoff), kickoffTime(match.kickoff)]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </header>

      {/* Bronkeuze, alleen als beide bestaan; samenvatting is standaard */}
      {match.youtubeId && match.livestreamId && (
        <div className="relative z-30 mx-3 mb-2 flex flex-none gap-1 rounded-full bg-pitch p-[3px]">
          {[
            { key: 'samenvatting', label: 'Samenvatting' },
            { key: 'live', label: 'Hele wedstrijd' },
          ].map((optie) => (
            <button
              key={optie.key}
              type="button"
              onClick={() => wisselBron(optie.key)}
              aria-pressed={source === optie.key}
              className={`flex-1 rounded-full px-2.5 py-2 text-[13px] font-bold transition-colors duration-150 ${
                source === optie.key ? 'bg-oranje text-night' : 'text-moss'
              }`}
            >
              {optie.label}
            </button>
          ))}
        </div>
      )}

      {/* Videovak: vast 16:9, met de YouTube-speler en alle afdekpanelen
          erbinnen. Zo blijft de wedstrijdinfo eronder altijd zichtbaar. */}
      <div
        className="relative mx-3 aspect-video flex-none overflow-hidden rounded-2xl border border-line"
        style={{ backgroundColor: BG }}
      >
        {/* De YouTube-speler vervangt de binnenste div. De wrapper steekt
            boven en onder OVERSCAN px buiten het venster, zodat YouTube's
            titelbalk en onderbalk buiten beeld vallen. */}
        <div
          className="absolute inset-x-0"
          style={{ top: -OVERSCAN, height: `calc(100% + ${OVERSCAN * 2}px)` }}
        >
          <div ref={mountRef} className="h-full w-full" />
        </div>

        {/* Eigen poster — nooit de YouTube-thumbnail. */}
        {(phase === 'poster' || phase === 'loading') && (
          <div
            className="absolute inset-0 z-20 flex animate-poster-in flex-col items-center justify-center px-4 text-center"
            style={{ backgroundColor: BG }}
          >
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-moss">
              {match.stage}
            </p>
            <div className="mt-2.5 flex items-center gap-3">
              <Flag team={match.teamA} width={50} height={37} radius={6} />
              {match.teamB && (
                <Flag team={match.teamB} width={50} height={37} radius={6} />
              )}
            </div>
            <h2 className="mt-2.5 max-w-[300px] text-[19px] font-extrabold leading-[1.08] tracking-[-0.02em]">
              <TeamNaam name={match.teamA} />
              {match.teamB && (
                <>
                  <span className="font-semibold text-moss-dim"> — </span>
                  <TeamNaam name={match.teamB} />
                </>
              )}
            </h2>

            {phase === 'poster' ? (
              <button
                type="button"
                onClick={start}
                className="mt-3.5 flex flex-col items-center gap-2 transition-transform duration-150 ease-out active:scale-95"
              >
                <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-oranje shadow-glow-oranje">
                  <svg
                    viewBox="0 0 24 24"
                    width="26"
                    height="26"
                    className="ml-[3px] fill-night"
                    aria-hidden="true"
                  >
                    <path d="M8 5.5v13l11-6.5z" />
                  </svg>
                </span>
                <span className="text-[12.5px] font-semibold text-moss">
                  Geen titel, geen uitslag. Alleen de wedstrijd.
                </span>
              </button>
            ) : (
              <div className="mt-4 flex flex-col items-center gap-2.5">
                <svg
                  viewBox="0 0 44 44"
                  width="38"
                  height="38"
                  className="animate-[spin_.8s_linear_infinite]"
                  aria-hidden="true"
                >
                  <circle cx="22" cy="22" r="18" fill="none" stroke="#27332a" strokeWidth="4" />
                  <path
                    d="M22 4a18 18 0 0 1 18 18"
                    fill="none"
                    stroke="#ff7a1f"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-sm font-semibold text-moss">Laden…</span>
              </div>
            )}
          </div>
        )}

        {/* Pauzepaneel: dekt de video af zodat "Meer video's" nooit zichtbaar is */}
        {phase === 'paused' && (
          <div
            className="absolute inset-0 z-20 flex animate-panel-in flex-col items-center justify-center gap-3"
            style={{ backgroundColor: BG }}
          >
            <button
              type="button"
              onClick={resume}
              aria-label="Verder kijken"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-oranje shadow-glow-oranje transition-transform duration-150 ease-out active:scale-90"
            >
              <svg
                viewBox="0 0 24 24"
                width="30"
                height="30"
                className="ml-[3px] fill-night"
                aria-hidden="true"
              >
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
            </button>
            <p className="text-[13px] font-medium text-moss">
              Gepauzeerd · tik om verder te kijken
            </p>
          </div>
        )}

        {/* Eindpaneel: dekt het YouTube-eindscherm met aanbevolen video's af */}
        {phase === 'ended' && (
          <div
            className="absolute inset-0 z-20 flex animate-panel-in flex-col items-center justify-center gap-3 px-6"
            style={{ backgroundColor: BG }}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-pitch-raised">
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                className="fill-none stroke-oranje"
                strokeWidth="2.4"
                aria-hidden="true"
              >
                <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-base font-bold text-cream">
              {source === 'samenvatting' ? 'Samenvatting afgelopen' : 'Wedstrijd afgelopen'}
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={herstart}
                className="rounded-full border border-line-strong bg-transparent px-4 py-2 text-[13px] font-bold text-cream transition-[transform,background-color] duration-150 active:scale-95 active:bg-pitch-raised"
              >
                Opnieuw
              </button>
              <button
                type="button"
                onClick={onBack}
                className="rounded-full bg-oranje px-4 py-2 text-[13px] font-bold text-night transition-transform duration-150 active:scale-95"
              >
                Naar wedstrijden
              </button>
            </div>
          </div>
        )}

        {/* Foutpaneel: nooit terugvallen op YouTube-titel of -thumbnail */}
        {phase === 'error' && (
          <div
            className="absolute inset-0 z-20 flex animate-panel-in flex-col items-center justify-center gap-2.5 px-6 text-center"
            style={{ backgroundColor: BG }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-line-strong bg-pitch-raised">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                className="fill-none stroke-oranje"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7.6v5.2" strokeLinecap="round" />
                <circle cx="12" cy="16.3" r="0.5" className="fill-oranje" stroke="none" />
              </svg>
            </div>
            <p className="max-w-[280px] text-[13.5px] leading-snug text-cream">
              Deze samenvatting kan hier niet worden afgespeeld. Kijk je vanuit
              het buitenland of met een vpn? Dan is de video mogelijk niet
              beschikbaar.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="mt-1 rounded-full bg-oranje px-[18px] py-2 text-[13px] font-bold text-night transition-transform duration-150 active:scale-95"
            >
              Terug naar wedstrijden
            </button>
          </div>
        )}
      </div>

      {/* Eigen bediening: geen YouTube-knoppen nodig. */}
      {(phase === 'playing' || phase === 'paused') && (
        <div className="flex-none px-[18px] pt-3.5">
          {/* Tik of sleep om te scrubben; ruime tikzone rond de balk */}
          <div
            className="cursor-pointer py-3"
            style={{ touchAction: 'none' }}
            role="slider"
            aria-label="Voortgang"
            aria-valuemin={0}
            aria-valuemax={Math.round(progress.duration)}
            aria-valuenow={Math.round(
              dragFrac != null ? dragFrac * progress.duration : progress.time,
            )}
            aria-valuetext={formatTime(
              dragFrac != null ? dragFrac * progress.duration : progress.time,
            )}
            tabIndex={0}
            onPointerDown={scrubStart}
            onPointerMove={scrubMove}
            onPointerUp={scrubEnd}
            onPointerCancel={scrubEnd}
          >
            <div ref={barRef} className="relative h-1.5 rounded-full bg-line">
              <div
                className={`absolute inset-y-0 left-0 rounded-full bg-oranje ${
                  vloeiend ? 'transition-[width] duration-500 ease-linear' : ''
                }`}
                style={{ width: `${scrubPct}%` }}
              />
              <span
                className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 ${
                  vloeiend ? 'transition-[left] duration-500 ease-linear' : ''
                }`}
                style={{ left: `${scrubPct}%` }}
              >
                <span
                  className="block rounded-full bg-oranje transition-[width,height,box-shadow] duration-150 ease-out"
                  style={{
                    width: dragFrac != null ? 18 : 14,
                    height: dragFrac != null ? 18 : 14,
                    boxShadow:
                      dragFrac != null ? '0 0 0 6px rgba(255,122,31,0.22)' : 'none',
                  }}
                />
              </span>
            </div>
          </div>

          <div className="mt-1 flex items-center justify-between gap-2.5">
            <span className="min-w-[52px] text-[12.5px] font-semibold tabular-nums text-moss">
              {formatTime(
                dragFrac != null ? dragFrac * progress.duration : progress.time,
              )}
            </span>
            <div className="flex items-center gap-5">
              <SkipButton seconds={-10} onClick={() => skip(-10)} />
              <button
                type="button"
                onClick={pauzeer}
                aria-label="Pauzeren"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-oranje shadow-glow-oranje-soft transition-transform duration-150 ease-out active:scale-95"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" className="fill-night" aria-hidden="true">
                  <rect x="6.5" y="5" width="4" height="14" rx="1.3" />
                  <rect x="13.5" y="5" width="4" height="14" rx="1.3" />
                </svg>
              </button>
              <SkipButton seconds={30} onClick={() => skip(30)} />
            </div>
            <span className="min-w-[52px] text-right text-[12.5px] font-semibold tabular-nums text-moss">
              {formatTime(progress.duration)}
            </span>
          </div>
        </div>
      )}

      {/* Wedstrijdinfo onder de video — al zichtbaar vóór play */}
      <Verrijking match={match} actieveVideoId={actieveVideoId} />

      {/* Ondermarge incl. veilige zone (de stage/datum/tijd staat nu in de kop) */}
      <div
        className="flex-none"
        style={{ paddingBottom: 'calc(1.75rem + env(safe-area-inset-bottom))' }}
      />
    </div>
  )
}
