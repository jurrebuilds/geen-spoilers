-- Geen Spoilers: databaseschema en beveiliging.
-- Voer dit één keer uit in de Supabase SQL-editor (project > SQL Editor).
-- Vervang eerst alle drie de keren 'BEHEERDER@VOORBEELD.NL' door het echte
-- beheerders-e-mailadres. Dat staat bewust niet in dit bestand: de repo is
-- openbaar en het adres hoort nergens zichtbaar te zijn.

create table if not exists public.matches (
  id            text primary key,
  team_a        text not null,
  team_b        text not null default '',
  flag_a        text not null default '',
  flag_b        text not null default '',
  kickoff       timestamptz not null,
  stage         text not null default '',
  youtube_id    text,
  updated_at    timestamptz not null default now()
);

-- Snel sorteren op speeldatum
create index if not exists matches_kickoff_idx on public.matches (kickoff);

-- ── Verrijking onder de video (stadion, weer, opstelling) ───────────────
-- Eén keer extra uitvoeren voegt deze kolommen toe aan een bestaande tabel.
-- Geen score of uitslag: alleen aftrap-feiten en de opstelling bij aftrap.
alter table public.matches add column if not exists venue                text;
alter table public.matches add column if not exists city                 text;
alter table public.matches add column if not exists capacity             integer;
alter table public.matches add column if not exists venue_tz             text;   -- IANA-zone van het stadion, voor de lokale tijd
alter table public.matches add column if not exists attendance           integer; -- vrij gelaten: niet in de gratis API, eventueel handmatig
alter table public.matches add column if not exists temp_c               numeric; -- temperatuur bij aftrap (Open-Meteo)
alter table public.matches add column if not exists wind_kmh             numeric;
alter table public.matches add column if not exists weather_code         integer; -- WMO-code; de app vertaalt naar tekst + icoon
alter table public.matches add column if not exists lineup               jsonb;   -- bevroren opstelling bij aftrap (write-once in het script)
alter table public.matches add column if not exists apisports_fixture_id bigint;  -- gevonden fixture, hergebruikt door de vervolgstappen
alter table public.matches add column if not exists photo                text;    -- stadionfoto (Wikimedia Commons)
alter table public.matches add column if not exists photo_credit         text;    -- verplichte bronvermelding bij de foto

-- Markeert dat we voor déze samenvatting al een pushmelding hebben verstuurd,
-- zodat de cron nooit dubbel meldt. Wordt gezet door send-push.mjs.
-- "Te melden" = youtube_id is gevuld én summary_notified_at is nog leeg.
alter table public.matches add column if not exists summary_notified_at  timestamptz;

-- Beveiliging aanzetten: standaard mag niemand iets
alter table public.matches enable row level security;

-- Iedereen mag de wedstrijden lezen (de data bevat nooit een uitslag)
drop policy if exists "Wedstrijden zijn openbaar leesbaar" on public.matches;
create policy "Wedstrijden zijn openbaar leesbaar"
  on public.matches for select
  using (true);

-- Alleen de beheerder mag bewerken vanuit het admin-scherm.
-- Het check-script gebruikt de service-sleutel en omzeilt deze regels.
drop policy if exists "Alleen beheerder mag bewerken" on public.matches;
create policy "Alleen beheerder mag bewerken"
  on public.matches for update
  using ((auth.jwt() ->> 'email') = 'BEHEERDER@VOORBEELD.NL')
  with check ((auth.jwt() ->> 'email') = 'BEHEERDER@VOORBEELD.NL');

drop policy if exists "Alleen beheerder mag toevoegen" on public.matches;
create policy "Alleen beheerder mag toevoegen"
  on public.matches for insert
  with check ((auth.jwt() ->> 'email') = 'BEHEERDER@VOORBEELD.NL');

-- ── Push-abonnementen (webpush) ─────────────────────────────────────────
-- Eén rij per browser/apparaat dat meldingen wil. Bevat geen persoonsgegevens,
-- alleen het door de browser uitgegeven push-endpoint + de versleutelsleutels.
create table if not exists public.push_subscriptions (
  endpoint   text primary key,            -- uniek per abonnement; voorkomt dubbele rijen
  keys       jsonb not null,              -- { p256dh, auth } van de PushSubscription
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

-- Iedereen mag zich anoniem aanmelden (insert). Bestaat het endpoint al, dan
-- werkt de frontend de rij bij via een upsert (resolution=merge-duplicates).
drop policy if exists "Iedereen mag zich aanmelden voor meldingen" on public.push_subscriptions;
create policy "Iedereen mag zich aanmelden voor meldingen"
  on public.push_subscriptions for insert
  with check (true);

-- De upsert vanuit de browser kan een bestaand endpoint bijwerken.
drop policy if exists "Eigen abonnement bijwerken" on public.push_subscriptions;
create policy "Eigen abonnement bijwerken"
  on public.push_subscriptions for update
  using (true) with check (true);

-- "Meldingen uitzetten" verwijdert het eigen endpoint direct. Endpoints zijn
-- opaak en niet opvraagbaar (geen select-policy), dus dit is laag risico.
drop policy if exists "Eigen abonnement verwijderen" on public.push_subscriptions;
create policy "Eigen abonnement verwijderen"
  on public.push_subscriptions for delete
  using (true);

-- BELANGRIJK: geen SELECT-policy. De anon-sleutel kan dus nooit de lijst met
-- abonnees uitlezen. Het verzendscript (send-push.mjs) gebruikt de
-- service-sleutel en omzeilt RLS volledig (lezen + dode endpoints opruimen).

-- ── Gevolgde wedstrijden per apparaat ───────────────────────────────────
-- Koppelt een push-abonnement (endpoint) aan de wedstrijden die het volgt.
-- Eén rij per (apparaat, wedstrijd). send-push.mjs seint bij een nieuwe
-- samenvatting alleen de volgers van díé wedstrijd.
create table if not exists public.match_volgers (
  endpoint   text not null references public.push_subscriptions(endpoint) on delete cascade,
  match_id   text not null,
  created_at timestamptz not null default now(),
  primary key (endpoint, match_id)
);

create index if not exists match_volgers_match_idx on public.match_volgers (match_id);

alter table public.match_volgers enable row level security;

-- Iedereen mag anoniem een wedstrijd gaan volgen (insert) en weer ontvolgen
-- (delete). Net als bij push_subscriptions: geen select, dus de lijst met
-- volgers is nooit uitleesbaar met de anon-sleutel.
drop policy if exists "Iedereen mag een wedstrijd volgen" on public.match_volgers;
create policy "Iedereen mag een wedstrijd volgen"
  on public.match_volgers for insert
  with check (true);

drop policy if exists "Eigen volg verwijderen" on public.match_volgers;
create policy "Eigen volg verwijderen"
  on public.match_volgers for delete
  using (true);
