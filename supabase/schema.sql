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
  livestream_id text,
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
