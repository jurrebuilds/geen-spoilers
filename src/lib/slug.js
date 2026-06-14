// Pure, SSR-veilige slug voor URL-paden: lowercase, diacrieten weg,
// niet-alfanumeriek naar '-'. Zelfde normalisatie als norm() in
// scripts/wk-data.mjs, maar met '-' als scheidingsteken zodat het in een pad
// past, bijv. "Bosnië en Herzegovina" -> "bosnie-en-herzegovina".
export function slugify(tekst) {
  return (tekst || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Groepsletter uit een stage-label, bijv. "Groep F" -> "f" (anders null).
export function groupLetter(stage) {
  const m = /^groep\s+([a-z])$/i.exec(stage || '')
  return m ? m[1].toLowerCase() : null
}
