# Geen Spoilers

Kijk WK 2026-samenvattingen terug zonder de uitslag te zien. Geen scores, geen YouTube-titels, geen thumbnails, geen eindscherm met aanbevolen video's.

Merk: wordmark "Geen Spoilers" (Bricolage Grotesque, "Spoilers" in oranje) met als merkteken een oog met een voetbal als pupil (`public/favicon.svg`).

## Starten

```bash
npm install
npm run dev
```

Open daarna http://localhost:5173 op je telefoon of in de browser.

## Wedstrijden bijwerken

Alle 104 WK-wedstrijden staan in één bestand: `src/data/matches.js` (volledig speelschema, Nederlandse tijden). Met Supabase ingesteld is dit bestand de seed en leest de app uit de database (zie "Backend" onderaan); zonder Supabase werkt alles direct op dit bestand.

- **Samenvattingen worden automatisch gevonden**: bij elke `npm run dev` (of los via `npm run check`) zoekt `scripts/check-summaries.mjs` in de YouTube-feeds van NOS Sport naar samenvattingen van gespeelde wedstrijden, checkt of ze afspeelbaar zijn en vult het `youtubeId` in. Het script drukt nooit videotitels af (daar zitten spoilers in).
- **Handmatig kan ook**: plak het YouTube-ID in `youtubeId`. Het ID is het stuk achter `v=` in de URL, bijv. `https://www.youtube.com/watch?v=SD8KSUrx9jA` → `"SD8KSUrx9jA"`. Laat het op `null` staan zolang er geen samenvatting is.
- **Let op**: de feeds tonen alleen de ~15 nieuwste video's van het kanaal. Draai de check dus elke ochtend (de app starten is genoeg); wie dagen wacht, moet oudere samenvattingen handmatig opzoeken.
- **Knock-outwedstrijden**: de teams staan op "Nog te bepalen". Vul `teamA`, `teamB`, `flagA` en `flagB` in zodra de teams bekend zijn. Daarna pakt de automatische check ze ook mee.
- Sla nooit een score of uitslag op.

## Designsysteem "nachtgroen"

- Achtergrond `#0c120e` (donker veldgroen), kaarten `#151d17` / `#1a241c`
- Tekst in crème `#f4f1e6`, gedempt groengrijs `#8fa093`
- Accent oranje `#ff7a1f` voor alles wat beschikbaar of actief is, en voor Nederland
- Lettertype: Bricolage Grotesque (Google Fonts)
- De lijst springt bij openen automatisch naar vandaag; dagkoppen zijn sticky en tonen "Vandaag" en "Gisteren"

## Hoe spoilers worden tegengehouden

- Eigen poster en koptekst: de YouTube-titel en -thumbnail worden nergens gebruikt.
- Een dekkende balk over de bovenste 72px van de video verbergt de titelstrook van YouTube.
- Bij pauze dekt een paneel de hele video af, zodat het "Meer video's"-paneel van YouTube (met mogelijk andere uitslagen) nooit zichtbaar is. Doorspoelen kan tijdens het afspelen.
- Zodra de video is afgelopen, schuift er direct een paneel over het YouTube-eindscherm heen.
- Als een video niet afspeelbaar is, verschijnt een foutmelding. Er wordt nooit teruggevallen op YouTube-beelden.

## Contact

Helemaal onderaan de wedstrijdlijst staat een onopvallende "Stuur een bericht"-link met een berichtformulier erachter. Het formulier post rechtstreeks naar [Formspree](https://formspree.io) (zie `FORMSPREE_URL` in `src/components/Contact.jsx`), dat het bericht doormailt naar de beheerder. De form-ID in de code is publiek by design; het e-mailadres erachter blijft verborgen in het Formspree-account. Vult de afzender een e-mailadres in, dan wordt dat de reply-to van de mail. Een verborgen honingpotveld vangt spambots af; berichten beheren of het doeladres wijzigen doe je in het Formspree-dashboard.

Eerder liep dit via formsubmit.co achter een Vercel-functie, maar de botbescherming van formsubmit blokkeert verzoeken vanaf servers (403). Vanuit de browser posten naar Formspree heeft dat probleem niet.

## Backend (Supabase) + automatische check in de cloud

Zonder Supabase werkt de app gewoon op `src/data/matches.js`. Met Supabase verhuizen de wedstrijden naar een database, draait de check automatisch in de cloud en kun je via een admin-scherm wedstrijden bewerken zonder code aan te raken.

**Eenmalige setup:**

1. Maak een gratis project op [supabase.com](https://supabase.com).
2. Open de SQL Editor en voer `supabase/schema.sql` uit. Vul eerst op de drie plekken met `BEHEERDER@VOORBEELD.NL` het echte beheerders-e-mailadres in; dat staat bewust niet in git.
3. Kopieer uit Project Settings > API de Project URL, de `anon`-sleutel en de `service_role`-sleutel.
4. Lokaal: kopieer `.env.example` naar `.env.local` en vul de waarden in. Vul ook `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` in en draai `npm run seed` om de wedstrijden in de database te zetten.
5. Herstart `npm run dev`. De app leest nu uit Supabase.

**Automatische check in de cloud (GitHub Actions):**

1. Zet het project in een GitHub-repo (maak hem openbaar voor onbeperkte Actions-minuten).
2. Voeg onder Settings > Secrets and variables > Actions twee secrets toe: `SUPABASE_URL` en `SUPABASE_SERVICE_KEY`.
3. De workflow `.github/workflows/check-summaries.yml` heeft alleen een `workflow_dispatch`-trigger en wordt elke 10 minuten extern aangeroepen via een pinger op [cron-job.org](https://cron-job.org), die de GitHub-dispatch-API aanspreekt. GitHub's eigen scheduler bleek te onbetrouwbaar voor deze cadans. De workflow vult nieuwe samenvattingen aan en stuurt daarna voor elke nieuwe samenvatting een spoilervrije pushmelding. Vlak na een wedstrijd staat de samenvatting daardoor meestal binnen een kwartier in de app.

**Admin-scherm:** open de app met `#admin` erachter (bijv. `http://localhost:5173/#admin`). Log in via een magic link op het beheerders-e-mailadres. Daarna kun je YouTube-ID's plakken en teamnamen van knock-outs invullen. De database staat alleen schrijven toe voor dat ene e-mailadres.

## Automatische verrijking (stadion, weer, opstelling)

`scripts/enrich-matches.mjs` (los: `npm run enrich`) haalt voor net gespeelde wedstrijden het stadion, het weer bij aftrap en de opstelling op bij [api-sports.io](https://api-sports.io) en schrijft die in de database. Het werkt write-once: een veld dat al gevuld is wordt nooit overschreven, dus de gratis API-limiet (100 requests/dag) raakt niet op. Spoilervrij: alleen de endpoints `/fixtures` en `/fixtures/lineups` worden gebruikt, nooit een uitslag-endpoint.

In de cloud draait dit via `.github/workflows/enrich-matches.yml` op een eigen cron (`*/15 * * * *`, elke 15 minuten). Vereist de secrets `APISPORTS_KEY`, `SUPABASE_URL` en `SUPABASE_SERVICE_KEY`.

## Pushmeldingen

De app kan een spoilervrije webpush-melding sturen zodra de samenvatting van een gevolgde wedstrijd klaarstaat. De gebruiker volgt wedstrijden via het belletje in de lijst en beheert toestemming in het meldingen-paneel (`src/components/Meldingen.jsx`). De clientlogica zit in `src/lib/push.js` en de service worker in `public/sw.js`; verzenden gebeurt server-side via `scripts/send-push.mjs` (los: `npm run push`), die meelift op de check-workflow. De melding bevat alleen teamnamen en een link, nooit een score. Op iOS werkt webpush alleen als de app eerst via Safari aan het beginscherm is toegevoegd.

Genereer de VAPID-sleutels eenmalig met `npx web-push generate-vapid-keys` en zet `VITE_VAPID_PUBLIC_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` en `VAPID_SUBJECT` in `.env.local` en als GitHub-secrets (zie `.env.example`).

## SEO-landingspagina's

`npm run build` draait `vite build` en daarna `scripts/build-seo.mjs`, dat statische landingspagina's genereert per wedstrijd, team, groep en ronde, plus `sitemap.xml` en `robots.txt`. Alles is spoilervrij: er staan geen scores in de HTML of de JSON-LD.

## Analytics

Naast Vercel Analytics (`<Analytics />` in `src/main.jsx`) draait optioneel PostHog (`src/lib/analytics.js`), standaard EU-gehost. De wrapper is een no-op zolang `VITE_POSTHOG_KEY` leeg is en is privacybewust: geen session recording, geen autocapture, en events bevatten alleen spoilervrije eigenschappen (wedstrijd-ID, teamnamen). Zie `.env.example` voor de sleutels.

## Onderhoud

Operationele feiten die niet uit de code blijken:

- **Repository**: `jurrebuilds/geen-spoilers` (publiek, zodat GitHub Actions onbeperkte minuten heeft).
- **Supabase-project**: `dqaqdldnsbtxjryjapor` (URL `https://dqaqdldnsbtxjryjapor.supabase.co`). De `anon`-sleutel is publiek; de `service_role`-sleutel staat alleen in `.env.local` (niet in git) en als GitHub-secret `SUPABASE_SERVICE_KEY`.
- **Sleutels op een nieuwe laptop**: `.env.local` staat niet in git. Kopieer `.env.example` en vul de waarden opnieuw in (de Supabase-sleutels uit Project Settings > API; PostHog, VAPID en api-sports.io alleen als je die features gebruikt). Zonder `.env.local` valt de app netjes terug op de lokale wedstrijdenlijst.
- **Check handmatig draaien**: lokaal `npm run check`; in de cloud via GitHub > Actions > "Check samenvattingen" > "Run workflow". Verrijking los draaien kan met `npm run enrich`, een pushmelding sturen met `npm run push`.
- **Cron-trigger**: de check-workflow heeft geen eigen schema; een pinger op cron-job.org roept elke 10 minuten de GitHub-dispatch-API aan. De verrijk-workflow draait wél op een eigen GitHub-cron (`*/15`). Stopt de check ineens, controleer dan eerst de pinger op cron-job.org.
- **Waarom REST en niet de Supabase-SDK in het check-script**: de SDK eist een WebSocket, die op oudere Node-versies (zoals Node 20 op de GitHub-runner) ontbreekt. Het script praat daarom rechtstreeks met de REST-API. Herintroduceer de SDK daar niet.
- **Service-sleutel roteren** (bij twijfel over lekken): Supabase > Project Settings > API > service_role "roll", daarna de nieuwe waarde in `.env.local` én in de GitHub-secret `SUPABASE_SERVICE_KEY` zetten.

## V2 (later)

Automatische import van knock-outteams (let op: weten wie doorgaat is zelf een spoiler). De PWA met pushmelding "samenvatting staat klaar" is inmiddels gebouwd (zie "Pushmeldingen").
