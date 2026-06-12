import { useEffect, useRef, useState } from 'react'
import { loadYouTubeAPI } from '../lib/youtube.js'
import { dayMonthLabel, kickoffTime } from '../lib/format.js'
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
        {terug ? (
          <>
            <path
              d="M11.2 5.4 A7 7 0 1 0 18 11"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M11.6 2 L8 5.4 L11.6 8.2"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : (
          <>
            <path
              d="M12.8 5.4 A7 7 0 1 1 6 11"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12.4 2 L16 5.4 L12.4 8.2"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
        <text
          x="12"
          y="16.6"
          textAnchor="middle"
          fontSize="8"
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
  const dagTijd = `${dayMonthLabel(match.kickoff)}, ${kickoffTime(match.kickoff)}`

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
      {/* Eigen koptekst — nooit de YouTube-titel. Boven de afdekpanelen. */}
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

      {/* Videovenster: 16:9 tijdens het afspelen, anders vult het de
          ruimte (de afdekpanelen bedekken dan toch alles). */}
      <div
        className={`relative w-full overflow-hidden ${
          phase === 'playing' ? 'aspect-video flex-none' : 'min-h-0 flex-1'
        }`}
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
      </div>

      {/* Eigen poster — nooit de YouTube-thumbnail. Dekt het hele scherm
          onder de koptekst af. */}
      {(phase === 'poster' || phase === 'loading') && (
        <div
          className="absolute inset-0 z-20 flex animate-poster-in flex-col items-center justify-center p-[18px]"
          style={{ backgroundColor: BG }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-moss">
            {match.stage}
          </p>
          <div className="mt-4 flex items-center gap-3.5">
            <Flag team={match.teamA} width={62} height={46} radius={8} />
            {match.teamB && <Flag team={match.teamB} width={62} height={46} radius={8} />}
          </div>
          <h2 className="mt-[15px] max-w-[300px] text-center text-[25px] font-extrabold leading-[1.08] tracking-[-0.025em]">
            <TeamNaam name={match.teamA} />
            {match.teamB && (
              <>
                <span className="font-semibold text-moss-dim"> — </span>
                <TeamNaam name={match.teamB} />
              </>
            )}
          </h2>
          <p className="mt-[9px] text-[12.5px] font-medium tabular-nums text-moss">
            {dagTijd}
          </p>

          {phase === 'poster' ? (
            <>
              <button
                type="button"
                onClick={start}
                className="mt-6 flex flex-col items-center gap-[11px] transition-transform duration-150 ease-out active:scale-95"
              >
                <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-oranje shadow-glow-oranje">
                  <svg
                    viewBox="0 0 24 24"
                    width="30"
                    height="30"
                    className="ml-[3px] fill-night"
                    aria-hidden="true"
                  >
                    <path d="M8 5.5v13l11-6.5z" />
                  </svg>
                </span>
                <span className="text-[15px] font-bold text-cream">Tik om te bekijken</span>
              </button>
              <p className="mt-[13px] max-w-[230px] text-center text-xs leading-normal text-moss">
                Geen titel, geen uitslag. Alleen de wedstrijd.
              </p>
            </>
          ) : (
            <div className="mt-6 flex flex-col items-center gap-[13px]">
              <svg
                viewBox="0 0 44 44"
                width="42"
                height="42"
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

      {/* Pauzepaneel: dekt alles af zodat "Meer video's" nooit zichtbaar is */}
      {phase === 'paused' && (
        <div
          className="absolute inset-0 z-20 flex animate-panel-in flex-col items-center justify-center gap-4"
          style={{ backgroundColor: BG }}
        >
          <button
            type="button"
            onClick={resume}
            aria-label="Verder kijken"
            className="flex h-20 w-20 items-center justify-center rounded-full bg-oranje shadow-glow-oranje transition-transform duration-150 ease-out active:scale-90"
          >
            <svg
              viewBox="0 0 24 24"
              width="34"
              height="34"
              className="ml-[3px] fill-night"
              aria-hidden="true"
            >
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </button>
          <p className="text-[13.5px] font-medium text-moss">
            Gepauzeerd · tik om verder te kijken
          </p>
        </div>
      )}

      {/* Eindpaneel: dekt het YouTube-eindscherm met aanbevolen video's af */}
      {phase === 'ended' && (
        <div
          className="absolute inset-0 z-20 flex animate-panel-in flex-col items-center justify-center gap-[18px] p-7"
          style={{ backgroundColor: BG }}
        >
          <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full border border-line-strong bg-pitch-raised">
            <svg
              viewBox="0 0 24 24"
              width="26"
              height="26"
              className="fill-none stroke-oranje"
              strokeWidth="2.4"
              aria-hidden="true"
            >
              <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-lg font-bold text-cream">
            {source === 'samenvatting' ? 'Samenvatting afgelopen' : 'Wedstrijd afgelopen'}
          </p>
          <div className="flex w-full max-w-60 flex-col gap-2.5">
            <button
              type="button"
              onClick={herstart}
              className="rounded-full border border-line-strong bg-transparent p-3 text-sm font-bold text-cream transition-[transform,background-color] duration-150 active:scale-95 active:bg-pitch-raised"
            >
              Opnieuw kijken
            </button>
            <button
              type="button"
              onClick={onBack}
              className="rounded-full bg-oranje p-3 text-sm font-bold text-night transition-transform duration-150 active:scale-95"
            >
              Terug naar wedstrijden
            </button>
          </div>
        </div>
      )}

      {/* Foutpaneel: nooit terugvallen op YouTube-titel of -thumbnail */}
      {phase === 'error' && (
        <div
          className="absolute inset-0 z-20 flex animate-panel-in flex-col items-center justify-center gap-[18px] p-[30px]"
          style={{ backgroundColor: BG }}
        >
          <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full border border-line-strong bg-pitch-raised">
            <svg
              viewBox="0 0 24 24"
              width="28"
              height="28"
              className="fill-none stroke-oranje"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7.6v5.2" strokeLinecap="round" />
              <circle cx="12" cy="16.3" r="0.5" className="fill-oranje" stroke="none" />
            </svg>
          </div>
          <p className="max-w-[250px] text-center text-[15px] leading-normal text-cream">
            Deze samenvatting kan hier niet worden afgespeeld.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="rounded-full bg-oranje px-[22px] py-3 text-sm font-bold text-night transition-transform duration-150 active:scale-95"
          >
            Terug naar wedstrijden
          </button>
        </div>
      )}

      {/* Eigen bediening: geen YouTube-knoppen nodig */}
      {phase === 'playing' && (
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

      <div
        className="mt-auto flex-none px-[18px] pt-[18px]"
        style={{ paddingBottom: 'calc(1.75rem + env(safe-area-inset-bottom))' }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] tabular-nums text-moss">
          {match.stage} · {dagTijd}
        </p>
        <p className="mt-2 text-[11.5px] leading-normal text-moss-mid">
          Video: NOS Sport, via YouTube. Titel, eindscherm en aanbevelingen
          verbergen we bewust.
        </p>
        {actieveVideoId && (
          <p className="mt-1.5 text-[11.5px] leading-normal text-moss-mid">
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
