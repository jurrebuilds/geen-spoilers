// De Tikkie-betaallink voor vrijwillige donaties ("Steun geenspoilers.nl met een
// biertje"). Staat in een env-var, niet hardcoded: een privé-Tikkie verloopt na
// een paar weken, dus zo plak je een nieuwe link in Vercel zonder code-deploy.
// Ontbreekt de var, dan blijft de doneerregel onzichtbaar (zie SteunRegel.jsx).

const env = import.meta.env || {}

export const TIKKIE_URL = (env.VITE_TIKKIE_URL || '').trim()

// Versienummer van de steunkaart op de homepage (zie SteunKaart.jsx). Leeg =
// kaart uit. Wie de kaart wegklikt ziet hem niet meer, tot je hier een nieuwe
// waarde instelt (bijv. "1" -> "2" rond de finale): dan verschijnt hij bij
// iedereen nog één keer. Wijzigen in Vercel vereist een redeploy (build-time).
export const STEUN_KAART_VERSIE = (env.VITE_STEUN_KAART || '').trim()
