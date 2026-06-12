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

  return (
    <div className="flex min-h-dvh flex-col bg-night text-cream">
      {/* Eigen koptekst — nooit de YouTube-titel */}
      <header className="flex items-center gap-2 px-2 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Terug naar wedstrijden"
          className="shrink-0 rounded-full p-2 active:bg-line"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-cream" strokeWidth="2">
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="truncate text-base font-bold">
          {source === 'samenvatting' ? 'Samenvatting' : 'Hele wedstrijd'} ·{' '}
          {match.teamA}{match.teamB ? ` – ${match.teamB}` : ''}
        </h1>
      </header>

      {/* Bronkeuze, alleen als beide bestaan; samenvatting is standaard */}
      {match.youtubeId && match.livestreamId && (
        <div className="flex gap-2 px-4 pb-3">
          {[
            { key: 'samenvatting', label: 'Samenvatting' },
            { key: 'live', label: 'Hele wedstrijd' },
          ].map((optie) => (
            <button
              key={optie.key}
              type="button"
              onClick={() => wisselBron(optie.key)}
              aria-pressed={source === optie.key}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                source === optie.key
                  ? 'border-oranje bg-oranje text-night'
                  : 'border-line bg-pitch text-moss'
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
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4"
            style={{ backgroundColor: BG }}
          >
            <p className="text-5xl">
              {match.flagA} {match.flagB}
            </p>
            <p className="px-4 text-center text-lg font-bold">
              {match.teamA}{match.teamB ? ` – ${match.teamB}` : ''}
            </p>
            <button
              type="button"
              onClick={start}
              disabled={phase === 'loading'}
              className="rounded-full bg-oranje px-8 py-3.5 text-base font-bold text-night active:bg-oranje/80 disabled:opacity-60"
            >
              {phase === 'loading' ? 'Laden…' : 'Tik om te bekijken'}
            </button>
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
              className="flex h-20 w-20 items-center justify-center rounded-full bg-oranje active:bg-oranje/80"
            >
              <svg viewBox="0 0 24 24" className="ml-1 h-9 w-9 fill-night">
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
            </button>
            <p className="text-sm font-medium text-moss">
              Gepauzeerd · tik om verder te kijken
            </p>
          </div>
        )}

        {/* Eindpaneel: dekt het YouTube-eindscherm met aanbevolen video's af */}
        {phase === 'ended' && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 px-6"
            style={{ backgroundColor: BG }}
          >
            <p className="text-lg font-bold">Samenvatting afgelopen</p>
            <button
              type="button"
              onClick={onBack}
              className="rounded-full bg-oranje px-8 py-3.5 text-base font-bold text-night active:bg-oranje/80"
            >
              Terug naar wedstrijden
            </button>
          </div>
        )}

        {/* Foutpaneel: nooit terugvallen op YouTube-titel of -thumbnail */}
        {phase === 'error' && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 px-6"
            style={{ backgroundColor: BG }}
          >
            <p className="text-center text-base text-cream/90">
              Deze samenvatting kan hier niet worden afgespeeld.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="rounded-full bg-oranje px-8 py-3.5 text-base font-bold text-night active:bg-oranje/80"
            >
              Terug naar wedstrijden
            </button>
          </div>
        )}
      </div>

      {/* Eigen bediening: geen YouTube-knoppen nodig */}
      {showVideo && phase !== 'ended' && (
        <div className="px-4 pt-3">
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
                className="absolute inset-y-0 left-0 rounded-full bg-oranje"
                style={{ width: `${scrubPct}%` }}
              />
              <div
                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-oranje"
                style={{ left: `${scrubPct}%` }}
              />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => skip(-10)}
              className="flex-1 rounded-full border border-line bg-pitch py-3.5 text-base font-bold text-cream active:bg-line"
            >
              ↺ 10 sec
            </button>
            <p className="shrink-0 text-sm font-semibold tabular-nums text-moss">
              {formatTime(
                dragFrac != null ? dragFrac * progress.duration : progress.time,
              )}{' '}
              / {formatTime(progress.duration)}
            </p>
            <button
              type="button"
              onClick={() => skip(30)}
              className="flex-1 rounded-full border border-line bg-pitch py-3.5 text-base font-bold text-cream active:bg-line"
            >
              30 sec ↻
            </button>
          </div>
        </div>
      )}

      <div
        className="px-4 pt-4"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-moss">
          {match.stage} · {dayLabel(match.kickoff)}, {kickoffTime(match.kickoff)}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-moss/70">
          Video: NOS Sport, via YouTube. Titel, eindscherm en aanbevelingen
          verbergen we bewust.
        </p>
        {actieveVideoId && (
          <p className="mt-1.5 text-xs leading-relaxed text-moss/70">
            <a
              href={`https://www.youtube.com/watch?v=${actieveVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-moss underline underline-offset-2"
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
