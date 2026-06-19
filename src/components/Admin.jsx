import { useEffect, useState } from 'react'
import { getSupabase, supabaseConfigured } from '../lib/supabase.js'
import { fromRow } from '../lib/matchesData.js'
import { dayLabel, kickoffTime } from '../lib/format.js'

// Beheerscherm op #admin: inloggen via magic link, daarna wedstrijden
// bewerken (YouTube-ID's plakken, teamnamen van knock-outs invullen).
// Schrijven lukt alleen voor het beheerders-e-mailadres; dat is afgedwongen
// in de database (zie supabase/schema.sql), niet alleen hier.
export default function Admin() {
  const [sb, setSb] = useState(null)
  const [session, setSession] = useState(null)
  const [klaar, setKlaar] = useState(false)
  // Kwam Supabase terug met een fout (bijv. een verlopen inloglink)? Dan
  // tonen we dat boven het loginformulier. Eenmalig bij het openen uitlezen,
  // vóór de SDK de tokens uit de URL haalt.
  const [linkVerlopen] = useState(() =>
    /[#&](?:error|error_code|error_description)=/.test(window.location.hash),
  )

  // Na inloggen via een magic link staan de tokens nog in de URL en is de
  // hash geen "#admin" meer. Opschonen zodat een refresh in beheer blijft en
  // de tokens niet in de adresbalk blijven staan.
  useEffect(() => {
    if (session && window.location.hash !== '#admin') {
      window.history.replaceState(null, '', window.location.pathname + '#admin')
    }
  }, [session])

  useEffect(() => {
    if (!supabaseConfigured) {
      setKlaar(true)
      return
    }
    let actief = true
    let sub
    getSupabase().then((client) => {
      if (!actief) return
      setSb(client)
      client.auth.getSession().then(({ data }) => {
        if (!actief) return
        setSession(data.session)
        setKlaar(true)
      })
      sub = client.auth.onAuthStateChange((_e, s) => setSession(s)).data
        .subscription
    })
    return () => {
      actief = false
      sub?.unsubscribe()
    }
  }, [])

  let inhoud
  if (!supabaseConfigured) {
    inhoud = (
      <Melding>
        Supabase is nog niet ingesteld. Vul <code>VITE_SUPABASE_URL</code> en{' '}
        <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env.local</code> en herstart
        de app.
      </Melding>
    )
  } else if (!klaar || !sb) {
    inhoud = <Melding>Laden…</Melding>
  } else if (!session) {
    inhoud = <Login sb={sb} linkVerlopen={linkVerlopen} />
  } else {
    inhoud = <Beheer sb={sb} session={session} />
  }

  return (
    <div className="min-h-dvh bg-night text-cream">
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-7">
        <header className="flex items-center justify-between pb-6">
          <h1 className="text-2xl font-extrabold tracking-tight">
            Geen <span className="text-oranje">Spoilers</span> · Beheer
          </h1>
          <a href="#" className="text-sm font-medium text-moss underline">
            Naar app
          </a>
        </header>
        {inhoud}
      </div>
    </div>
  )
}

function Melding({ children }) {
  return (
    <p className="rounded-2xl border border-line bg-pitch p-4 text-sm leading-relaxed text-moss">
      {children}
    </p>
  )
}

function Login({ sb, linkVerlopen }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | bezig | verstuurd | fout

  const verstuur = async (e) => {
    e.preventDefault()
    setStatus('bezig')
    const { error } = await sb.auth.signInWithOtp({
      email,
      // Belangrijk: redirect zónder #admin-hash. Supabase plakt de inlog-tokens
      // achter de bestaande hash; met "#admin" wordt dat "#admin#access_token=…"
      // en dan leest de client de tokens niet (sleutel wordt "admin#access_token").
      // Zonder hash landt het op "#access_token=…"; isAdminRoute pikt dat op en
      // het cleanup-effect zet de hash daarna terug naar "#admin".
      options: {
        emailRedirectTo: window.location.origin + window.location.pathname,
      },
    })
    setStatus(error ? 'fout' : 'verstuurd')
  }

  if (status === 'verstuurd') {
    return (
      <Melding>
        Check je mail: er staat een inloglink in. Open hem op dit apparaat om
        verder te gaan.
      </Melding>
    )
  }

  return (
    <form onSubmit={verstuur} className="space-y-3">
      {linkVerlopen && (
        <p className="rounded-2xl border border-oranje/30 bg-oranje/10 p-4 text-sm leading-relaxed text-oranje">
          De vorige inloglink was verlopen of al gebruikt. Vraag hieronder een
          nieuwe aan en open hem meteen.
        </p>
      )}
      <p className="text-sm text-moss">
        Log in met je e-mailadres. Je krijgt een inloglink toegestuurd.
      </p>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="jouw@email.nl"
        className="w-full rounded-xl border border-line bg-pitch px-4 py-3 text-cream placeholder:text-moss/60 focus:border-oranje focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === 'bezig'}
        className="rounded-full bg-oranje px-6 py-3 text-sm font-bold text-night active:bg-oranje/80 disabled:opacity-60"
      >
        {status === 'bezig' ? 'Versturen…' : 'Stuur inloglink'}
      </button>
      {status === 'fout' && (
        <p className="text-sm text-oranje">
          Versturen mislukt. Controleer het e-mailadres en probeer opnieuw.
        </p>
      )}
    </form>
  )
}

function Beheer({ sb, session }) {
  const [matches, setMatches] = useState(null)
  const [zoek, setZoek] = useState('')

  useEffect(() => {
    sb.from('matches')
      .select('*')
      .order('kickoff', { ascending: true })
      .then(({ data }) => setMatches((data || []).map(fromRow)))
  }, [sb])

  const filtered = (matches || []).filter((m) => {
    const q = zoek.trim().toLowerCase()
    if (!q) return true
    return `${m.teamA} ${m.teamB} ${m.stage}`.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-moss">Ingelogd als {session.user.email}</p>
        <button
          type="button"
          onClick={() => sb.auth.signOut()}
          className="text-sm font-medium text-moss underline"
        >
          Uitloggen
        </button>
      </div>

      <input
        value={zoek}
        onChange={(e) => setZoek(e.target.value)}
        placeholder="Zoek op team of fase…"
        className="w-full rounded-xl border border-line bg-pitch px-4 py-3 text-cream placeholder:text-moss/60 focus:border-oranje focus:outline-none"
      />

      {matches === null ? (
        <Melding>Wedstrijden laden…</Melding>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <Rij key={m.id} sb={sb} match={m} />
          ))}
        </div>
      )}
    </div>
  )
}

function Rij({ sb, match }) {
  const [waarden, setWaarden] = useState({
    teamA: match.teamA,
    teamB: match.teamB,
    flagA: match.flagA,
    flagB: match.flagB,
    youtubeId: match.youtubeId || '',
  })
  const [status, setStatus] = useState('idle') // idle | bezig | klaar | fout

  const veld = (naam) => ({
    value: waarden[naam],
    onChange: (e) => {
      setWaarden((w) => ({ ...w, [naam]: e.target.value }))
      setStatus('idle')
    },
  })

  const opslaan = async () => {
    setStatus('bezig')
    const { error } = await sb
      .from('matches')
      .update({
        team_a: waarden.teamA,
        team_b: waarden.teamB,
        flag_a: waarden.flagA,
        flag_b: waarden.flagB,
        youtube_id: waarden.youtubeId.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', match.id)
    setStatus(error ? 'fout' : 'klaar')
  }

  const klein =
    'rounded-lg border border-line bg-night px-3 py-2 text-sm text-cream placeholder:text-moss/50 focus:border-oranje focus:outline-none'

  return (
    <div className="rounded-2xl border border-line bg-pitch p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-moss">
        {match.stage} · {dayLabel(match.kickoff)}, {kickoffTime(match.kickoff)}
      </p>

      <div className="mt-2 grid grid-cols-[2.5rem_1fr] gap-2">
        <input {...veld('flagA')} placeholder="🇳🇱" className={klein} />
        <input {...veld('teamA')} placeholder="Team A" className={klein} />
        <input {...veld('flagB')} placeholder="🇺🇿" className={klein} />
        <input {...veld('teamB')} placeholder="Team B" className={klein} />
      </div>

      <div className="mt-2">
        <label className="block">
          <span className="text-xs text-moss">YouTube-ID samenvatting</span>
          <input
            {...veld('youtubeId')}
            placeholder="bijv. SD8KSUrx9jA"
            className={`${klein} mt-1 w-full`}
          />
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={opslaan}
          disabled={status === 'bezig'}
          className="rounded-full bg-oranje px-5 py-2 text-sm font-bold text-night active:bg-oranje/80 disabled:opacity-60"
        >
          {status === 'bezig' ? 'Opslaan…' : 'Opslaan'}
        </button>
        {status === 'klaar' && <span className="text-sm text-oranje">Opgeslagen</span>}
        {status === 'fout' && (
          <span className="text-sm text-oranje">
            Opslaan mislukt (geen rechten?)
          </span>
        )}
      </div>
    </div>
  )
}
