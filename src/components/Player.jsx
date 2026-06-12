import { useEffect, useRef, useState } from 'react'
import { loadYouTubeAPI } from '../lib/youtube.js'
import { dayLabel, kickoffTime } from '../lib/format.js'

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

// Genoeg om de YouTube-titelstrook (~64px) ruim buiten beeld te houden
const OVERSCAN = 96

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds))
  const u = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return u > 0 ? `${u}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

function FlagWell({ flag }) {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-pitch-raised text-2xl leading-none">
      {flag}
    </span>
  )
}

// Spoelknop in de stijl van een podcast-app: cirkelpijl met de
// seconden erin, richting van de pijl = richting van het spoelen
function SkipButton({ seconds, onClick }) {
  const terug = seconds < 0
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        terug ? `${-seconds} seconden terug` : `${seconds} seconden vooruit`
      }
      className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-pitch text-cream transition-[transform,background-color] duration-150 ease-out active:scale-90 active:bg-line"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {terug ? (
          <>
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </>
        ) : (
          <>
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </>
        )}
        <text
          x="12"
          y="15"
          textAnchor="middle"
          fontSize="7"
          fontWeight="800"
          fill="currentColor"
          stroke="none"
        >
          {Math.abs(seconds)}
        </text>
      </svg>
    </button>
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

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch {
          // speler was al opgeruimd
        }
        playerRef.current = null
      }
    }
  }, [])

  const start = async () => {
    setPhase('loading')
    let YT
    try {
      YT = await loadYouTubeAPI()
    } catch {
      setPhase('error')
      return
    }
    if (!mountRef.current) return

    playerRef.current = new YT.Player(mountRef.current, {
      host: 'https://www.youtube-nocookie.com',
      videoId: source === 'samenvatting' ? match.youtubeId : match.livestreamId,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 1,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        iv_load_policy: 3,
        fs: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: (e) => {
          e.target.playVideo()
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
            // niet terugschakelen vanuit het eindscherm
            if (phaseRef.current !== 'ended') setPhase('playing')
          }
        },
        onError: () => {
          setPhase('error')
        },
      },
    })
  }

  const resume = () => {
    if (playerRef.current) {
      playerRef.current.playVideo()
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

  // Wisselen tussen samenvatting en hele wedstrijd: speler opnieuw opbouwen
  const wisselBron = (nieuw) => {
    if (nieuw === source) return
    if (playerRef.current) {
      try {
        playerRef.current.destroy()
      } catch {
        // speler was al opgeruimd
      }
      playerRef.current = null
    }
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
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col text-cream">
      {/* Eigen koptekst — nooit de YouTube-titel */}
      <header className="flex items-center gap-1 px-2 pb-2 pt-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Terug naar wedstrijden"
          className="shrink-0 rounded-full p-2.5 transition-colors duration-150 active:bg-line"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-none stroke-cream"
            strokeWidth="2.25"
            aria-hidden="true"
          >
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-bold leading-tight">
            {match.teamA}
            {match.teamB ? ` – ${match.teamB}` : ''}
          </h1>
          <p className="mt-0.5 truncate text-xs font-medium text-moss">
            {bronLabel} · {match.stage}
          </p>
        </div>
      </header>

      {/* Bronkeuze, alleen als beide bestaan; samenvatting is standaard */}
      {match.youtubeId && match.livestreamId && (
        <div className="mx-4 mb-3 mt-1 flex rounded-full border border-line bg-pitch p-1">
          {[
            { key: 'samenvatting', label: 'Samenvatting' },
            { key: 'live', label: 'Hele wedstrijd' },
          ].map((optie) => (
            <button
              key={optie.key}
              type="button"
              onClick={() => wisselBron(optie.key)}
              aria-pressed={source === optie.key}
              className={`flex-1 rounded-full py-2 text-[13px] font-bold transition-colors duration-200 ${
                source === optie.key
                  ? 'bg-oranje text-night'
                  : 'text-moss active:text-cream'
              }`}
            >
              {optie.label}
            </button>
          ))}
        </div>
      )}

      <div
        className="relative aspect-video w-full overflow-hidden"
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

        {/* Eigen poster — nooit de YouTube-thumbnail */}
        {(phase === 'poster' || phase === 'loading') && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3.5"
            style={{ backgroundColor: BG }}
          >
            <div className="flex items-center gap-3" aria-hidden="true">
              <FlagWell flag={match.flagA} />
              {match.teamB && (
                <>
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-moss-dim">
                    vs
                  </span>
                  <FlagWell flag={match.flagB} />
                </>
              )}
            </div>
            <p className="max-w-full truncate px-4 text-base font-bold">
              {match.teamA}
              {match.teamB ? ` – ${match.teamB}` : ''}
            </p>
            <span className="relative inline-flex">
              {phase === 'poster' && (
                <span
                  className="absolute inset-0 animate-pulse-ring rounded-full bg-oranje/35"
                  aria-hidden="true"
                />
              )}
              <button
                type="button"
                onClick={start}
                disabled={phase === 'loading'}
                className="relative flex items-center gap-2 rounded-full bg-oranje px-6 py-3 text-[15px] font-bold text-night shadow-glow-oranje transition-transform duration-150 ease-out active:scale-95 disabled:opacity-70"
              >
                {phase === 'loading' ? (
                  <>
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-night/30 border-t-night"
                      aria-hidden="true"
                    />
                    Laden…
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 fill-current"
                      aria-hidden="true"
                    >
                      <path d="M8 5.5v13l11-6.5z" />
                    </svg>
                    Kijk spoilervrij
                  </>
                )}
              </button>
            </span>
          </div>
        )}

        {/* Pauzepaneel: dekt alles af zodat "Meer video's" nooit zichtbaar is */}
        {phase === 'paused' && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4"
            style={{ backgroundColor: BG }}
          >
            <button
              type="button"
              onClick={resume}
              aria-label="Verder kijken"
              className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-oranje shadow-glow-oranje transition-transform duration-150 ease-out active:scale-90"
            >
              <svg viewBox="0 0 24 24" className="ml-1 h-8 w-8 fill-night" aria-hidden="true">
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
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-6"
            style={{ backgroundColor: BG }}
          >
            <p className="text-base font-bold">
              {source === 'samenvatting'
                ? 'Samenvatting afgelopen'
                : 'Wedstrijd afgelopen'}
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={herstart}
                className="rounded-full border border-line bg-pitch px-5 py-2.5 text-sm font-bold text-cream transition-[transform,background-color] duration-150 active:scale-95 active:bg-line"
              >
                Opnieuw kijken
              </button>
              <button
                type="button"
                onClick={onBack}
                className="rounded-full bg-oranje px-5 py-2.5 text-sm font-bold text-night shadow-glow-oranje transition-transform duration-150 active:scale-95"
              >
                Naar wedstrijden
              </button>
            </div>
          </div>
        )}

        {/* Foutpaneel: nooit terugvallen op YouTube-titel of -thumbnail */}
        {phase === 'error' && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-6"
            style={{ backgroundColor: BG }}
          >
            <p className="text-center text-sm leading-relaxed text-cream/90">
              Deze samenvatting kan hier niet worden afgespeeld.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="rounded-full bg-oranje px-6 py-3 text-sm font-bold text-night transition-transform duration-150 active:scale-95"
            >
              Terug naar wedstrijden
            </button>
          </div>
        )}
      </div>

      {/* Eigen bediening: geen YouTube-knoppen nodig */}
      {showVideo && phase !== 'ended' && (
        <div className="px-4 pt-2.5">
          {/* Tik of sleep om te scrubben; ruime tikzone rond de balk */}
          <div
            className="relative cursor-pointer py-3.5"
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
            {/* Tijdwolkje boven de duim tijdens het slepen */}
            {dragFrac != null && (
              <span
                className="pointer-events-none absolute bottom-full mb-1 -translate-x-1/2 rounded-lg border border-line bg-pitch-raised px-2.5 py-1 text-xs font-bold tabular-nums text-cream shadow-float"
                style={{
                  left: `clamp(28px, ${scrubPct}%, calc(100% - 28px))`,
                }}
              >
                {formatTime(dragFrac * progress.duration)}
              </span>
            )}
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
                  className={`block h-3.5 w-3.5 rounded-full bg-cream shadow-[0_1px_6px_rgba(0,0,0,0.55)] transition-transform duration-200 ease-out ${
                    dragFrac != null ? 'scale-150' : ''
                  }`}
                />
              </span>
            </div>
          </div>

          <div className="mt-1 flex items-center justify-center gap-7">
            <SkipButton seconds={-10} onClick={() => skip(-10)} />
            <p className="min-w-24 text-center text-sm font-bold tabular-nums">
              {formatTime(
                dragFrac != null ? dragFrac * progress.duration : progress.time,
              )}
              <span className="font-medium text-moss-dim"> / </span>
              <span className="font-medium text-moss">
                {formatTime(progress.duration)}
              </span>
            </p>
            <SkipButton seconds={30} onClick={() => skip(30)} />
          </div>
        </div>
      )}

      <div
        className="px-4 pt-6"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-moss">
          {match.stage} · {dayLabel(match.kickoff)}, {kickoffTime(match.kickoff)}
        </p>
        <p className="mt-2.5 text-xs leading-relaxed text-moss-dim">
          Video: NOS Sport, via YouTube. Titel, eindscherm en aanbevelingen
          verbergen we bewust.
        </p>
        {actieveVideoId && (
          <p className="mt-1.5 text-xs leading-relaxed text-moss-dim">
            <a
              href={`https://www.youtube.com/watch?v=${actieveVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-moss underline underline-offset-2 transition-colors active:text-cream"
            >
              Originele video op YouTube
            </a>{' '}
            (let op: daar zie je titels en aanbevolen video's die de uitslag
            kunnen verraden)
          </p>
        )}
      </div>
    </div>
  )
}
