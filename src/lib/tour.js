// Hulpjes voor Tour de France-etappes, gedeeld door kaart, speler en SEO.
// Puur en SSR-veilig: ook bruikbaar vanuit scripts/build-seo.mjs.

const ETAPPE_TYPE_LABEL = {
  vlak: 'Vlakke etappe',
  heuvelachtig: 'Heuveletappe',
  bergen: 'Bergetappe',
  tijdrit: 'Tijdrit',
  ploegentijdrit: 'Ploegentijdrit',
}

export function etappeTypeLabel(type) {
  return ETAPPE_TYPE_LABEL[type] || 'Etappe'
}

// Afstand in Nederlandse notatie, bijv. "158,3 km"
export function afstandLabel(km) {
  if (km == null) return null
  return `${Number(km).toLocaleString('nl-NL')} km`
}
