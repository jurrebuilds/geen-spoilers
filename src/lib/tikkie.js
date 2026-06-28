// De Tikkie-betaallink voor vrijwillige donaties ("Steun geenspoilers.nl met een
// biertje"). Staat in een env-var, niet hardcoded: een privé-Tikkie verloopt na
// een paar weken, dus zo plak je een nieuwe link in Vercel zonder code-deploy.
// Ontbreekt de var, dan blijft de doneerregel onzichtbaar (zie SteunRegel.jsx).

const env = import.meta.env || {}

export const TIKKIE_URL = (env.VITE_TIKKIE_URL || '').trim()
