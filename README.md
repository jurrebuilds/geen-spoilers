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
- **Livestreams (hele wedstrijd terugkijken)**: het script vindt ook de terugkijkbare NOS-livestream en vult `livestreamId` in, maar pas vanaf 4 uur na de aftrap. Een nog lopende stream wordt nooit toegevoegd, want die zou op het live-moment beginnen en de stand verraden. In de speler kies je via "Samenvatting" / "Hele wedstrijd"; samenvatting is de standaard.
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

## Backend (Supabase) + automatische check in de cloud

Zonder Supabase werkt de app gewoon op `src/data/matches.js`. Met Supabase verhuizen de wedstrijden naar een database, draait de check automatisch in de cloud en kun je via een admin-scherm wedstrijden bewerken zonder code aan te raken.

**Eenmalige setup:**

1. Maak een gratis project op [supabase.com](https://supabase.com).
2. Open de SQL Editor en voer `supabase/schema.sql` uit (pas eerst het beheerders-e-mailadres aan als dat afwijkt).
3. Kopieer uit Project Settings > API de Project URL, de `anon`-sleutel en de `service_role`-sleutel.
4. Lokaal: kopieer `.env.example` naar `.env.local` en vul de waarden in. Vul ook `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` in en draai `npm run seed` om de wedstrijden in de database te zetten.
5. Herstart `npm run dev`. De app leest nu uit Supabase.

**Automatische check in de cloud (GitHub Actions):**

1. Zet het project in een GitHub-repo (maak hem openbaar voor onbeperkte Actions-minuten).
2. Voeg onder Settings > Secrets and variables > Actions twee secrets toe: `SUPABASE_URL` en `SUPABASE_SERVICE_KEY`.
3. Klaar. `.github/workflows/check-summaries.yml` draait elke 15 minuten en vult nieuwe samenvattingen automatisch. Vlak na een wedstrijd staat de samenvatting daardoor meestal binnen een kwartier in de app.

**Admin-scherm:** open de app met `#admin` erachter (bijv. `http://localhost:5173/#admin`). Log in via een magic link op het beheerders-e-mailadres. Daarna kun je YouTube-ID's plakken en teamnamen van knock-outs invullen. De database staat alleen schrijven toe voor dat ene e-mailadres.

## V2 (later)

Automatische import van knock-outteams (let op: weten wie doorgaat is zelf een spoiler) en PWA met pushmelding "samenvatting staat klaar".
