// Eigen vlaggen als SVG, overgenomen uit het Claude Design-ontwerp.
// Emoji-vlaggen renderen per platform anders (en op Windows helemaal niet);
// deze tekeningen zien er overal hetzelfde uit en passen bij de stijl.

// Landnaam (zoals in de wedstrijddata) -> vlagcode
const CODE = {
  'Nederland': 'nl', 'Oezbekistan': 'uz', 'Mexico': 'mx', 'Zuid-Afrika': 'za',
  'Zuid-Korea': 'kr', 'Tsjechië': 'cz', 'Canada': 'ca',
  'Bosnië en Herzegovina': 'ba', 'Qatar': 'qa', 'Zwitserland': 'ch',
  'Brazilië': 'br', 'Marokko': 'ma', 'Haïti': 'ht', 'Schotland': 'sct',
  'Verenigde Staten': 'us', 'Paraguay': 'py', 'Australië': 'au',
  'Turkije': 'tr', 'Duitsland': 'de', 'Curaçao': 'cw', 'Ivoorkust': 'ci',
  'Ecuador': 'ec', 'Japan': 'jp', 'Zweden': 'se', 'Tunesië': 'tn',
  'België': 'be', 'Egypte': 'eg', 'Iran': 'ir', 'Nieuw-Zeeland': 'nz',
  'Spanje': 'es', 'Kaapverdië': 'cv', 'Saoedi-Arabië': 'sa', 'Uruguay': 'uy',
  'Frankrijk': 'fr', 'Senegal': 'sn', 'Irak': 'iq', 'Noorwegen': 'no',
  'Argentinië': 'ar', 'Algerije': 'dz', 'Oostenrijk': 'at', 'Jordanië': 'jo',
  'Portugal': 'pt', 'DR Congo': 'cd', 'Colombia': 'co', 'Engeland': 'eng',
  'Kroatië': 'hr', 'Ghana': 'gh', 'Panama': 'pa',
}

// Vijfpuntige ster als pad
function star(cx, cy, r, fill, rot = 0) {
  let p = ''
  for (let i = 0; i < 5; i++) {
    const ao = ((-90 + i * 72 + rot) * Math.PI) / 180
    const ai = ((-90 + i * 72 + 36 + rot) * Math.PI) / 180
    p += (i ? 'L' : 'M') + (cx + r * Math.cos(ao)).toFixed(2) + ',' + (cy + r * Math.sin(ao)).toFixed(2)
    p += 'L' + (cx + r * 0.382 * Math.cos(ai)).toFixed(2) + ',' + (cy + r * 0.382 * Math.sin(ai)).toFixed(2)
  }
  return `<path d="${p}Z" fill="${fill}"/>`
}

// Drie verticale / horizontale banen
const v3 = (a, b, c) =>
  `<rect width="24" height="18" fill="${b}"/><rect width="8" height="18" fill="${a}"/><rect x="16" width="8" height="18" fill="${c}"/>`
const h3 = (a, b, c) =>
  `<rect width="24" height="18" fill="${b}"/><rect width="24" height="6" fill="${a}"/><rect y="12" width="24" height="6" fill="${c}"/>`
const union = () =>
  `<rect width="10" height="7" fill="#00247D"/><path d="M0 0L10 7M10 0L0 7" stroke="#fff" stroke-width="1.5"/><path d="M0 0L10 7M10 0L0 7" stroke="#CF142B" stroke-width="0.7"/><path d="M5 0V7M0 3.5H10" stroke="#fff" stroke-width="2"/><path d="M5 0V7M0 3.5H10" stroke="#CF142B" stroke-width="1"/>`

function buildUS() {
  let us = '<rect width="24" height="18" fill="#fff"/>'
  for (let i = 0; i < 13; i += 2)
    us += `<rect y="${((i * 18) / 13).toFixed(2)}" width="24" height="${(18 / 13).toFixed(2)}" fill="#B22234"/>`
  us += '<rect width="10" height="9.69" fill="#3C3B6E"/>'
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 5; c++)
      us += `<circle cx="${(1.1 + c * 1.95).toFixed(2)}" cy="${(1.3 + r * 2.3).toFixed(2)}" r="0.42" fill="#fff"/>`
  return us
}

const FLAGS = {
  nl: h3('#AE1C28', '#fff', '#21468B'),
  fr: v3('#0055A4', '#fff', '#EF4135'),
  be: v3('#000', '#FFD90C', '#F31830'),
  ci: v3('#FF8200', '#fff', '#009A44'),
  de: h3('#000', '#DD0000', '#FFCE00'),
  at: h3('#ED2939', '#fff', '#ED2939'),
  es: `<rect width="24" height="18" fill="#AA151B"/><rect y="4.5" width="24" height="9" fill="#F1BF00"/><rect x="3.2" y="7" width="2.8" height="4" rx="0.4" fill="#AD1519"/>`,
  co: `<rect width="24" height="18" fill="#003893"/><rect width="24" height="9" fill="#FCD116"/><rect y="13.5" width="24" height="4.5" fill="#CE1126"/>`,
  ec: `<rect width="24" height="18" fill="#0072CE"/><rect width="24" height="9" fill="#FFD100"/><rect y="13.5" width="24" height="4.5" fill="#EF3340"/>` + star(12, 9, 1.5, '#7a4a1e'),
  ar: `<rect width="24" height="18" fill="#fff"/><rect width="24" height="6" fill="#74ACDF"/><rect y="12" width="24" height="6" fill="#74ACDF"/><circle cx="12" cy="9" r="1.4" fill="#F6B40E"/>`,
  py: h3('#D52B1E', '#fff', '#0038A8') + `<circle cx="12" cy="9" r="1.2" fill="#1a7a1a"/>`,
  uy: `<rect width="24" height="18" fill="#fff"/><g fill="#0038A8"><rect y="2" width="24" height="2"/><rect y="6" width="24" height="2"/><rect y="10" width="24" height="2"/><rect y="14" width="24" height="2"/></g><rect width="9.5" height="8" fill="#fff"/>` + star(4.7, 4, 1.6, '#FCD116'),
  br: `<rect width="24" height="18" fill="#009C3B"/><path d="M12 2L22 9L12 16L2 9Z" fill="#FFDF00"/><circle cx="12" cy="9" r="3.1" fill="#002776"/><path d="M9.2 8.4Q12 7.4 14.8 8.4" stroke="#fff" stroke-width="0.5" fill="none"/>`,
  mx: `<rect width="24" height="18" fill="#fff"/><rect width="8" height="18" fill="#006847"/><rect x="16" width="8" height="18" fill="#CE1126"/><circle cx="12" cy="9" r="1.5" fill="#5c3a21"/>`,
  us: buildUS(),
  ca: `<rect width="24" height="18" fill="#fff"/><rect width="6" height="18" fill="#D80621"/><rect x="18" width="6" height="18" fill="#D80621"/><path d="M12 4.2l0.7 2.1 2-0.5-1 1.8 1.7 1.2-2 0.4 0.2 2-1.6-1.3-1.6 1.3 0.2-2-2-0.4 1.7-1.2-1-1.8 2 0.5z" fill="#D80621"/>`,
  jp: `<rect width="24" height="18" fill="#fff"/><circle cx="12" cy="9" r="4" fill="#BC002D"/>`,
  kr: `<rect width="24" height="18" fill="#fff"/><circle cx="12" cy="9" r="3.3" fill="#CD2E3A"/><path d="M12 5.7A3.3 3.3 0 0 1 12 12.3A1.65 1.65 0 0 1 12 9A1.65 1.65 0 0 0 12 5.7Z" fill="#0047A0"/><g stroke="#000" stroke-width="0.5"><path d="M2.6 4h2.4M2.6 5h2.4M2.6 6h2.4M19 4h2.4M19 5h2.4M19 6h2.4M2.6 12h2.4M2.6 13h2.4M2.6 14h2.4M19 12h2.4M19 13h2.4M19 14h2.4"/></g>`,
  au: `<rect width="24" height="18" fill="#012169"/>` + union() + star(5, 12.5, 1.4, '#fff') + star(19, 4, 0.8, '#fff') + star(21, 9, 1.1, '#fff') + star(17.5, 11, 0.7, '#fff') + star(21, 13.5, 0.7, '#fff') + star(18.5, 15.5, 0.6, '#fff'),
  nz: `<rect width="24" height="18" fill="#012169"/>` + union() + star(19, 5, 0.9, '#CC142B') + star(21.2, 9, 1.1, '#CC142B') + star(17.8, 10.5, 0.8, '#CC142B') + star(20, 14, 0.95, '#CC142B'),
  ch: `<rect width="24" height="18" fill="#D52B1E"/><rect x="10.2" y="4" width="3.6" height="10" fill="#fff"/><rect x="7" y="7.2" width="10" height="3.6" fill="#fff"/>`,
  za: `<rect width="24" height="9" fill="#E03C31"/><rect y="9" width="24" height="9" fill="#002395"/><rect y="6.4" width="24" height="5.2" fill="#fff"/><rect y="7.5" width="24" height="3" fill="#007A4D"/><path d="M0 0L11 9L0 18Z" fill="#FFB81C"/><path d="M0 1.7L8.6 9L0 16.3Z" fill="#000"/>`,
  ma: `<rect width="24" height="18" fill="#C1272D"/>` + star(12, 9, 3, '#006233'),
  ht: `<rect width="24" height="9" fill="#00209F"/><rect y="9" width="24" height="9" fill="#D21034"/><rect x="9.3" y="6.4" width="5.4" height="5.2" fill="#fff"/><rect x="11.4" y="8" width="1.2" height="2" fill="#1a6a2a"/>`,
  sct: `<rect width="24" height="18" fill="#0065BF"/><path d="M0 0L24 18M24 0L0 18" stroke="#fff" stroke-width="2.6"/>`,
  eng: `<rect width="24" height="18" fill="#fff"/><rect x="10" width="4" height="18" fill="#CE1124"/><rect y="7" width="24" height="4" fill="#CE1124"/>`,
  hr: h3('#FF0000', '#fff', '#171796') + `<rect x="9.4" y="6.2" width="5.2" height="4.4" fill="#fff"/><g fill="#FF0000"><rect x="9.4" y="6.2" width="1.3" height="1.1"/><rect x="12" y="6.2" width="1.3" height="1.1"/><rect x="10.7" y="7.3" width="1.3" height="1.1"/><rect x="13.3" y="7.3" width="1.3" height="1.1"/><rect x="9.4" y="8.4" width="1.3" height="1.1"/><rect x="12" y="8.4" width="1.3" height="1.1"/><rect x="10.7" y="9.5" width="1.3" height="1.1"/><rect x="13.3" y="9.5" width="1.3" height="1.1"/></g>`,
  gh: h3('#CE1126', '#FCD116', '#006B3F') + star(12, 9, 1.7, '#000'),
  sn: v3('#00853F', '#FDEF42', '#E31B23') + star(12, 9, 1.6, '#00853F'),
  dz: `<rect width="24" height="18" fill="#fff"/><rect width="12" height="18" fill="#006233"/><circle cx="13" cy="9" r="3" fill="#D21034"/><circle cx="14" cy="9" r="2.4" fill="#fff"/>` + star(15.4, 9, 1, '#D21034'),
  tn: `<rect width="24" height="18" fill="#E70013"/><circle cx="12" cy="9" r="4" fill="#fff"/><circle cx="12.8" cy="9" r="3" fill="#E70013"/><circle cx="13.7" cy="9" r="2.4" fill="#fff"/>` + star(14.3, 9, 1, '#E70013'),
  tr: `<rect width="24" height="18" fill="#E30A17"/><circle cx="9.5" cy="9" r="3.4" fill="#fff"/><circle cx="10.6" cy="9" r="2.7" fill="#E30A17"/>` + star(13.4, 9, 1.1, '#fff'),
  ir: h3('#239F40', '#fff', '#DA0000') + `<circle cx="12" cy="9" r="1.1" fill="#DA0000"/>`,
  iq: h3('#CE1126', '#fff', '#000') + `<g fill="#007A3D"><circle cx="9.5" cy="9" r="0.55"/><circle cx="12" cy="9" r="0.55"/><circle cx="14.5" cy="9" r="0.55"/></g>`,
  eg: h3('#CE1126', '#fff', '#000') + `<circle cx="12" cy="9" r="1.3" fill="#C09300"/>`,
  jo: h3('#000', '#fff', '#007A3B') + `<path d="M0 0L9 9L0 18Z" fill="#CE1126"/>` + star(3.2, 9, 0.85, '#fff'),
  sa: `<rect width="24" height="18" fill="#006C35"/><rect x="5" y="11" width="14" height="0.8" rx="0.4" fill="#fff"/><rect x="6" y="7.4" width="12" height="1.5" rx="0.4" fill="#fff" opacity="0.92"/>`,
  qa: `<rect width="24" height="18" fill="#8D1B3D"/><path d="M0 0H9L11.5 1.8L9 3.6L11.5 5.4L9 7.2L11.5 9L9 10.8L11.5 12.6L9 14.4L11.5 16.2L9 18H0Z" fill="#fff"/>`,
  cw: `<rect width="24" height="18" fill="#002B7F"/><rect y="12.4" width="24" height="3" fill="#F9E814"/>` + star(4, 4.6, 1.1, '#fff') + star(6.6, 7, 0.8, '#fff'),
  cv: `<rect width="24" height="18" fill="#003893"/><rect y="9.3" width="24" height="2.1" fill="#fff"/><rect y="11.4" width="24" height="1.1" fill="#CF2027"/><rect y="12.5" width="24" height="2.1" fill="#fff"/>` + star(9, 9, 0.7, '#FCD116') + star(7, 7, 0.7, '#FCD116') + star(11, 7, 0.7, '#FCD116') + star(7, 11, 0.7, '#FCD116') + star(11, 11, 0.7, '#FCD116'),
  cd: `<rect width="24" height="18" fill="#007FFF"/><path d="M0 13L19 0H24V5L5 18H0Z" fill="#F7D618"/><path d="M1.5 13.2L19.7 0.6H22.8L3.6 18H1.5Z" fill="#CE1021"/>` + star(4.2, 4.2, 1.4, '#F7D618'),
  pt: `<rect width="24" height="18" fill="#FF0000"/><rect width="9.6" height="18" fill="#006600"/><circle cx="9.6" cy="9" r="2" fill="#FFD700"/><circle cx="9.6" cy="9" r="1.3" fill="#fff"/><rect x="8.9" y="8" width="1.4" height="2" fill="#003399"/>`,
  pa: `<rect width="24" height="18" fill="#fff"/><rect x="12" width="12" height="9" fill="#DA121A"/><rect y="9" width="12" height="9" fill="#072357"/>` + star(6, 4.5, 1.4, '#072357') + star(18, 13.5, 1.4, '#DA121A'),
  ba: `<rect width="24" height="18" fill="#002395"/><path d="M7 0H19L7 18Z" fill="#FECB00"/>` + star(8.5, 3, 0.7, '#fff') + star(10.5, 6, 0.7, '#fff') + star(8.5, 9, 0.7, '#fff') + star(6.5, 12, 0.7, '#fff') + star(4.5, 15, 0.7, '#fff'),
  uz: `<rect width="24" height="6" fill="#0099B5"/><rect y="6" width="24" height="6" fill="#fff"/><rect y="12" width="24" height="6" fill="#1EB53A"/><rect y="5.5" width="24" height="0.5" fill="#CE1126"/><rect y="12" width="24" height="0.5" fill="#CE1126"/><circle cx="4" cy="3" r="1.6" fill="#fff"/><circle cx="4.8" cy="3" r="1.3" fill="#0099B5"/>` + star(7, 2, 0.4, '#fff') + star(8.4, 3, 0.4, '#fff'),
  se: `<rect width="24" height="18" fill="#006AA7"/><rect x="7" width="3" height="18" fill="#FECC00"/><rect y="7.5" width="24" height="3" fill="#FECC00"/>`,
  no: `<rect width="24" height="18" fill="#BA0C2F"/><rect x="6.5" width="4" height="18" fill="#fff"/><rect y="7" width="24" height="4" fill="#fff"/><rect x="7.5" width="2" height="18" fill="#00205B"/><rect y="8" width="24" height="2" fill="#00205B"/>`,
  cz: `<rect width="24" height="9" fill="#fff"/><rect y="9" width="24" height="9" fill="#D7141A"/><path d="M0 0L12 9L0 18Z" fill="#11457E"/>`,
}

// Vlag op maat; onbekende landen krijgen een neutraal donker vlak
export function Flag({ team, width, height, radius }) {
  const html = FLAGS[CODE[team]] || '<rect width="24" height="18" fill="#2c3a30"/>'
  return (
    <span
      className="inline-block shrink-0 overflow-hidden"
      style={{
        width,
        height,
        borderRadius: radius,
        boxShadow: 'inset 0 0 0 1px rgba(244,241,230,0.16)',
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 18"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </span>
  )
}

// Gestippelde contour voor wedstrijden waarvan het team nog niet bekend is
export function FlagPlaceholder() {
  return (
    <svg viewBox="0 0 26 19" width="26" height="19" className="shrink-0" aria-hidden="true">
      <rect
        x="1"
        y="1"
        width="24"
        height="17"
        rx="4"
        fill="none"
        stroke="#3a463d"
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />
    </svg>
  )
}
