// Wedstrijden bijwerken? Pas alleen deze lijst aan.
// - youtubeId: null  -> "Nog niet beschikbaar" (kaart is niet aanklikbaar)
// - youtubeId: "..." -> "Samenvatting beschikbaar" (plak het ID uit de YouTube-URL,
//   bijv. https://www.youtube.com/watch?v=SD8KSUrx9jA -> "SD8KSUrx9jA")
//   In de speler kiesbaar via "Hele wedstrijd"; samenvatting blijft standaard.
// - Knock-outwedstrijden: vul teamA/teamB en de vlaggen in zodra de teams bekend zijn.
// Nooit een score of uitslag opslaan. Tijden zijn Nederlandse tijd.

export const matches = [
  // ── Groepsfase ──────────────────────────────────────────────
  // Groep A
  { id: 'mex-zaf', teamA: 'Mexico', teamB: 'Zuid-Afrika', flagA: '🇲🇽', flagB: '🇿🇦', kickoff: '2026-06-11T21:00:00+02:00', stage: 'Groep A', youtubeId: 'ZqzX-RTl3jo' },
  { id: 'kor-tsj', teamA: 'Zuid-Korea', teamB: 'Tsjechië', flagA: '🇰🇷', flagB: '🇨🇿', kickoff: '2026-06-12T04:00:00+02:00', stage: 'Groep A', youtubeId: '84RGrVxrRF4' },
  { id: 'tsj-zaf', teamA: 'Tsjechië', teamB: 'Zuid-Afrika', flagA: '🇨🇿', flagB: '🇿🇦', kickoff: '2026-06-18T18:00:00+02:00', stage: 'Groep A', youtubeId: '-oxHwK6aT7A' },
  { id: 'mex-kor', teamA: 'Mexico', teamB: 'Zuid-Korea', flagA: '🇲🇽', flagB: '🇰🇷', kickoff: '2026-06-19T03:00:00+02:00', stage: 'Groep A', youtubeId: 'PONABgf2zt4' },
  { id: 'tsj-mex', teamA: 'Tsjechië', teamB: 'Mexico', flagA: '🇨🇿', flagB: '🇲🇽', kickoff: '2026-06-25T03:00:00+02:00', stage: 'Groep A', youtubeId: null },
  { id: 'zaf-kor', teamA: 'Zuid-Afrika', teamB: 'Zuid-Korea', flagA: '🇿🇦', flagB: '🇰🇷', kickoff: '2026-06-25T03:00:00+02:00', stage: 'Groep A', youtubeId: null },

  // Groep B
  { id: 'can-bih', teamA: 'Canada', teamB: 'Bosnië en Herzegovina', flagA: '🇨🇦', flagB: '🇧🇦', kickoff: '2026-06-12T21:00:00+02:00', stage: 'Groep B', youtubeId: 'JepkqjGbVa4' },
  { id: 'qat-zwi', teamA: 'Qatar', teamB: 'Zwitserland', flagA: '🇶🇦', flagB: '🇨🇭', kickoff: '2026-06-13T21:00:00+02:00', stage: 'Groep B', youtubeId: 'cFN19vxtoOQ' },
  { id: 'zwi-bih', teamA: 'Zwitserland', teamB: 'Bosnië en Herzegovina', flagA: '🇨🇭', flagB: '🇧🇦', kickoff: '2026-06-18T21:00:00+02:00', stage: 'Groep B', youtubeId: 'uaTufNIuC1g' },
  { id: 'can-qat', teamA: 'Canada', teamB: 'Qatar', flagA: '🇨🇦', flagB: '🇶🇦', kickoff: '2026-06-19T00:00:00+02:00', stage: 'Groep B', youtubeId: 'NM6jpY7k170' },
  { id: 'zwi-can', teamA: 'Zwitserland', teamB: 'Canada', flagA: '🇨🇭', flagB: '🇨🇦', kickoff: '2026-06-24T21:00:00+02:00', stage: 'Groep B', youtubeId: null },
  { id: 'bih-qat', teamA: 'Bosnië en Herzegovina', teamB: 'Qatar', flagA: '🇧🇦', flagB: '🇶🇦', kickoff: '2026-06-24T21:00:00+02:00', stage: 'Groep B', youtubeId: null },

  // Groep C
  { id: 'bra-mar', teamA: 'Brazilië', teamB: 'Marokko', flagA: '🇧🇷', flagB: '🇲🇦', kickoff: '2026-06-14T00:00:00+02:00', stage: 'Groep C', youtubeId: '2mk4J7jpfqk' },
  { id: 'hai-sch', teamA: 'Haïti', teamB: 'Schotland', flagA: '🇭🇹', flagB: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', kickoff: '2026-06-14T03:00:00+02:00', stage: 'Groep C', youtubeId: 'ker6M3Dz5FA' },
  { id: 'sch-mar', teamA: 'Schotland', teamB: 'Marokko', flagA: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', flagB: '🇲🇦', kickoff: '2026-06-20T00:00:00+02:00', stage: 'Groep C', youtubeId: 'LPCgKzOXd1I' },
  { id: 'bra-hai', teamA: 'Brazilië', teamB: 'Haïti', flagA: '🇧🇷', flagB: '🇭🇹', kickoff: '2026-06-20T03:00:00+02:00', stage: 'Groep C', youtubeId: null },
  { id: 'sch-bra', teamA: 'Schotland', teamB: 'Brazilië', flagA: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', flagB: '🇧🇷', kickoff: '2026-06-25T00:00:00+02:00', stage: 'Groep C', youtubeId: null },
  { id: 'mar-hai', teamA: 'Marokko', teamB: 'Haïti', flagA: '🇲🇦', flagB: '🇭🇹', kickoff: '2026-06-25T00:00:00+02:00', stage: 'Groep C', youtubeId: null },

  // Groep D
  { id: 'usa-par', teamA: 'Verenigde Staten', teamB: 'Paraguay', flagA: '🇺🇸', flagB: '🇵🇾', kickoff: '2026-06-13T03:00:00+02:00', stage: 'Groep D', youtubeId: '8MOpqhfo1dE' },
  { id: 'aus-tur', teamA: 'Australië', teamB: 'Turkije', flagA: '🇦🇺', flagB: '🇹🇷', kickoff: '2026-06-14T06:00:00+02:00', stage: 'Groep D', youtubeId: '_oYpPLoRUHQ' },
  { id: 'usa-aus', teamA: 'Verenigde Staten', teamB: 'Australië', flagA: '🇺🇸', flagB: '🇦🇺', kickoff: '2026-06-19T21:00:00+02:00', stage: 'Groep D', youtubeId: null },
  { id: 'tur-par', teamA: 'Turkije', teamB: 'Paraguay', flagA: '🇹🇷', flagB: '🇵🇾', kickoff: '2026-06-20T06:00:00+02:00', stage: 'Groep D', youtubeId: null },
  { id: 'tur-usa', teamA: 'Turkije', teamB: 'Verenigde Staten', flagA: '🇹🇷', flagB: '🇺🇸', kickoff: '2026-06-26T04:00:00+02:00', stage: 'Groep D', youtubeId: null },
  { id: 'par-aus', teamA: 'Paraguay', teamB: 'Australië', flagA: '🇵🇾', flagB: '🇦🇺', kickoff: '2026-06-26T04:00:00+02:00', stage: 'Groep D', youtubeId: null },

  // Groep E
  { id: 'dui-cur', teamA: 'Duitsland', teamB: 'Curaçao', flagA: '🇩🇪', flagB: '🇨🇼', kickoff: '2026-06-14T19:00:00+02:00', stage: 'Groep E', youtubeId: 'FJFW5Lymxbs' },
  { id: 'ivk-ecu', teamA: 'Ivoorkust', teamB: 'Ecuador', flagA: '🇨🇮', flagB: '🇪🇨', kickoff: '2026-06-15T01:00:00+02:00', stage: 'Groep E', youtubeId: 'RwvxstuERqI' },
  { id: 'dui-ivk', teamA: 'Duitsland', teamB: 'Ivoorkust', flagA: '🇩🇪', flagB: '🇨🇮', kickoff: '2026-06-20T22:00:00+02:00', stage: 'Groep E', youtubeId: null },
  { id: 'ecu-cur', teamA: 'Ecuador', teamB: 'Curaçao', flagA: '🇪🇨', flagB: '🇨🇼', kickoff: '2026-06-21T02:00:00+02:00', stage: 'Groep E', youtubeId: null },
  { id: 'ecu-dui', teamA: 'Ecuador', teamB: 'Duitsland', flagA: '🇪🇨', flagB: '🇩🇪', kickoff: '2026-06-25T22:00:00+02:00', stage: 'Groep E', youtubeId: null },
  { id: 'cur-ivk', teamA: 'Curaçao', teamB: 'Ivoorkust', flagA: '🇨🇼', flagB: '🇨🇮', kickoff: '2026-06-25T22:00:00+02:00', stage: 'Groep E', youtubeId: null },

  // Groep F
  { id: 'ned-jap', teamA: 'Nederland', teamB: 'Japan', flagA: '🇳🇱', flagB: '🇯🇵', kickoff: '2026-06-14T22:00:00+02:00', stage: 'Groep F', youtubeId: 'Sr6urU4gC3I' },
  { id: 'zwe-tun', teamA: 'Zweden', teamB: 'Tunesië', flagA: '🇸🇪', flagB: '🇹🇳', kickoff: '2026-06-15T04:00:00+02:00', stage: 'Groep F', youtubeId: 'avSY7t0cHTs' },
  { id: 'ned-zwe', teamA: 'Nederland', teamB: 'Zweden', flagA: '🇳🇱', flagB: '🇸🇪', kickoff: '2026-06-20T19:00:00+02:00', stage: 'Groep F', youtubeId: null },
  { id: 'tun-jap', teamA: 'Tunesië', teamB: 'Japan', flagA: '🇹🇳', flagB: '🇯🇵', kickoff: '2026-06-21T06:00:00+02:00', stage: 'Groep F', youtubeId: null },
  { id: 'tun-ned', teamA: 'Tunesië', teamB: 'Nederland', flagA: '🇹🇳', flagB: '🇳🇱', kickoff: '2026-06-26T01:00:00+02:00', stage: 'Groep F', youtubeId: null },
  { id: 'jap-zwe', teamA: 'Japan', teamB: 'Zweden', flagA: '🇯🇵', flagB: '🇸🇪', kickoff: '2026-06-26T01:00:00+02:00', stage: 'Groep F', youtubeId: null },

  // Groep G
  { id: 'bel-egy', teamA: 'België', teamB: 'Egypte', flagA: '🇧🇪', flagB: '🇪🇬', kickoff: '2026-06-15T21:00:00+02:00', stage: 'Groep G', youtubeId: '_q4NML8deuI' },
  { id: 'irn-nzl', teamA: 'Iran', teamB: 'Nieuw-Zeeland', flagA: '🇮🇷', flagB: '🇳🇿', kickoff: '2026-06-16T03:00:00+02:00', stage: 'Groep G', youtubeId: 'XxxI-Ixs98k' },
  { id: 'bel-irn', teamA: 'België', teamB: 'Iran', flagA: '🇧🇪', flagB: '🇮🇷', kickoff: '2026-06-21T21:00:00+02:00', stage: 'Groep G', youtubeId: null },
  { id: 'nzl-egy', teamA: 'Nieuw-Zeeland', teamB: 'Egypte', flagA: '🇳🇿', flagB: '🇪🇬', kickoff: '2026-06-22T03:00:00+02:00', stage: 'Groep G', youtubeId: null },
  { id: 'nzl-bel', teamA: 'Nieuw-Zeeland', teamB: 'België', flagA: '🇳🇿', flagB: '🇧🇪', kickoff: '2026-06-27T05:00:00+02:00', stage: 'Groep G', youtubeId: null },
  { id: 'egy-irn', teamA: 'Egypte', teamB: 'Iran', flagA: '🇪🇬', flagB: '🇮🇷', kickoff: '2026-06-27T05:00:00+02:00', stage: 'Groep G', youtubeId: null },

  // Groep H
  { id: 'spa-kaa', teamA: 'Spanje', teamB: 'Kaapverdië', flagA: '🇪🇸', flagB: '🇨🇻', kickoff: '2026-06-15T18:00:00+02:00', stage: 'Groep H', youtubeId: 'OkTXVoDYkSs' },
  { id: 'sau-uru', teamA: 'Saoedi-Arabië', teamB: 'Uruguay', flagA: '🇸🇦', flagB: '🇺🇾', kickoff: '2026-06-16T00:00:00+02:00', stage: 'Groep H', youtubeId: 'dkVBsCDVIWs' },
  { id: 'spa-sau', teamA: 'Spanje', teamB: 'Saoedi-Arabië', flagA: '🇪🇸', flagB: '🇸🇦', kickoff: '2026-06-21T18:00:00+02:00', stage: 'Groep H', youtubeId: null },
  { id: 'uru-kaa', teamA: 'Uruguay', teamB: 'Kaapverdië', flagA: '🇺🇾', flagB: '🇨🇻', kickoff: '2026-06-22T00:00:00+02:00', stage: 'Groep H', youtubeId: null },
  { id: 'uru-spa', teamA: 'Uruguay', teamB: 'Spanje', flagA: '🇺🇾', flagB: '🇪🇸', kickoff: '2026-06-27T02:00:00+02:00', stage: 'Groep H', youtubeId: null },
  { id: 'kaa-sau', teamA: 'Kaapverdië', teamB: 'Saoedi-Arabië', flagA: '🇨🇻', flagB: '🇸🇦', kickoff: '2026-06-27T02:00:00+02:00', stage: 'Groep H', youtubeId: null },

  // Groep I
  { id: 'fra-sen', teamA: 'Frankrijk', teamB: 'Senegal', flagA: '🇫🇷', flagB: '🇸🇳', kickoff: '2026-06-16T21:00:00+02:00', stage: 'Groep I', youtubeId: '9PLr23U8ilI' },
  { id: 'irk-noo', teamA: 'Irak', teamB: 'Noorwegen', flagA: '🇮🇶', flagB: '🇳🇴', kickoff: '2026-06-17T00:00:00+02:00', stage: 'Groep I', youtubeId: 'ci3iuxgTBJ0' },
  { id: 'fra-irk', teamA: 'Frankrijk', teamB: 'Irak', flagA: '🇫🇷', flagB: '🇮🇶', kickoff: '2026-06-22T23:00:00+02:00', stage: 'Groep I', youtubeId: null },
  { id: 'noo-sen', teamA: 'Noorwegen', teamB: 'Senegal', flagA: '🇳🇴', flagB: '🇸🇳', kickoff: '2026-06-23T02:00:00+02:00', stage: 'Groep I', youtubeId: null },
  { id: 'noo-fra', teamA: 'Noorwegen', teamB: 'Frankrijk', flagA: '🇳🇴', flagB: '🇫🇷', kickoff: '2026-06-26T21:00:00+02:00', stage: 'Groep I', youtubeId: null },
  { id: 'sen-irk', teamA: 'Senegal', teamB: 'Irak', flagA: '🇸🇳', flagB: '🇮🇶', kickoff: '2026-06-26T21:00:00+02:00', stage: 'Groep I', youtubeId: null },

  // Groep J
  { id: 'arg-alg', teamA: 'Argentinië', teamB: 'Algerije', flagA: '🇦🇷', flagB: '🇩🇿', kickoff: '2026-06-17T03:00:00+02:00', stage: 'Groep J', youtubeId: 'XBQ0CRAn8A8' },
  { id: 'oos-jor', teamA: 'Oostenrijk', teamB: 'Jordanië', flagA: '🇦🇹', flagB: '🇯🇴', kickoff: '2026-06-17T06:00:00+02:00', stage: 'Groep J', youtubeId: 'VbyncZtkLzA' },
  { id: 'arg-oos', teamA: 'Argentinië', teamB: 'Oostenrijk', flagA: '🇦🇷', flagB: '🇦🇹', kickoff: '2026-06-22T19:00:00+02:00', stage: 'Groep J', youtubeId: null },
  { id: 'jor-alg', teamA: 'Jordanië', teamB: 'Algerije', flagA: '🇯🇴', flagB: '🇩🇿', kickoff: '2026-06-23T05:00:00+02:00', stage: 'Groep J', youtubeId: null },
  { id: 'jor-arg', teamA: 'Jordanië', teamB: 'Argentinië', flagA: '🇯🇴', flagB: '🇦🇷', kickoff: '2026-06-28T04:00:00+02:00', stage: 'Groep J', youtubeId: 'p71uMqfxA0E' },
  { id: 'alg-oos', teamA: 'Algerije', teamB: 'Oostenrijk', flagA: '🇩🇿', flagB: '🇦🇹', kickoff: '2026-06-28T04:00:00+02:00', stage: 'Groep J', youtubeId: 'ymuF49lDvV0' },

  // Groep K
  { id: 'por-drc', teamA: 'Portugal', teamB: 'DR Congo', flagA: '🇵🇹', flagB: '🇨🇩', kickoff: '2026-06-17T19:00:00+02:00', stage: 'Groep K', youtubeId: 'kbDsffQn20I' },
  { id: 'oez-col', teamA: 'Oezbekistan', teamB: 'Colombia', flagA: '🇺🇿', flagB: '🇨🇴', kickoff: '2026-06-18T04:00:00+02:00', stage: 'Groep K', youtubeId: 'ef2gjbyprLw' },
  { id: 'por-oez', teamA: 'Portugal', teamB: 'Oezbekistan', flagA: '🇵🇹', flagB: '🇺🇿', kickoff: '2026-06-23T19:00:00+02:00', stage: 'Groep K', youtubeId: null },
  { id: 'col-drc', teamA: 'Colombia', teamB: 'DR Congo', flagA: '🇨🇴', flagB: '🇨🇩', kickoff: '2026-06-24T04:00:00+02:00', stage: 'Groep K', youtubeId: null },
  { id: 'col-por', teamA: 'Colombia', teamB: 'Portugal', flagA: '🇨🇴', flagB: '🇵🇹', kickoff: '2026-06-28T01:30:00+02:00', stage: 'Groep K', youtubeId: 'UFtAUTtVuGo' },
  { id: 'drc-oez', teamA: 'DR Congo', teamB: 'Oezbekistan', flagA: '🇨🇩', flagB: '🇺🇿', kickoff: '2026-06-28T01:30:00+02:00', stage: 'Groep K', youtubeId: '2aZ9uGSwoYI' },

  // Groep L
  { id: 'eng-kro', teamA: 'Engeland', teamB: 'Kroatië', flagA: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', flagB: '🇭🇷', kickoff: '2026-06-17T22:00:00+02:00', stage: 'Groep L', youtubeId: 'dtXMnN56roY' },
  { id: 'gha-pan', teamA: 'Ghana', teamB: 'Panama', flagA: '🇬🇭', flagB: '🇵🇦', kickoff: '2026-06-18T01:00:00+02:00', stage: 'Groep L', youtubeId: 'TfR3EH505Pw' },
  { id: 'eng-gha', teamA: 'Engeland', teamB: 'Ghana', flagA: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', flagB: '🇬🇭', kickoff: '2026-06-23T22:00:00+02:00', stage: 'Groep L', youtubeId: null },
  { id: 'pan-kro', teamA: 'Panama', teamB: 'Kroatië', flagA: '🇵🇦', flagB: '🇭🇷', kickoff: '2026-06-24T01:00:00+02:00', stage: 'Groep L', youtubeId: null },
  { id: 'pan-eng', teamA: 'Panama', teamB: 'Engeland', flagA: '🇵🇦', flagB: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', kickoff: '2026-06-27T23:00:00+02:00', stage: 'Groep L', youtubeId: null },
  { id: 'kro-gha', teamA: 'Kroatië', teamB: 'Ghana', flagA: '🇭🇷', flagB: '🇬🇭', kickoff: '2026-06-27T23:00:00+02:00', stage: 'Groep L', youtubeId: null },

  // ── Knock-outfase (teams invullen zodra bekend) ─────────────
  // Zestiende finales
  { id: 'zf01', teamA: 'Zuid-Afrika', teamB: 'Canada', flagA: '🇿🇦', flagB: '🇨🇦', kickoff: '2026-06-28T21:00:00+02:00', stage: 'Zestiende finale', youtubeId: 'GWOp2ntlSZk' },
  { id: 'zf02', teamA: 'Brazilië', teamB: 'Japan', flagA: '🇧🇷', flagB: '🇯🇵', kickoff: '2026-06-29T19:00:00+02:00', stage: 'Zestiende finale', youtubeId: null },
  { id: 'zf03', teamA: 'Duitsland', teamB: 'Paraguay', flagA: '🇩🇪', flagB: '🇵🇾', kickoff: '2026-06-29T22:30:00+02:00', stage: 'Zestiende finale', youtubeId: null },
  { id: 'zf04', teamA: 'Nederland', teamB: 'Marokko', flagA: '🇳🇱', flagB: '🇲🇦', kickoff: '2026-06-30T03:00:00+02:00', stage: 'Zestiende finale', youtubeId: null },
  { id: 'zf05', teamA: 'Ivoorkust', teamB: 'Noorwegen', flagA: '🇨🇮', flagB: '🇳🇴', kickoff: '2026-06-30T19:00:00+02:00', stage: 'Zestiende finale', youtubeId: null },
  { id: 'zf06', teamA: 'Frankrijk', teamB: 'Zweden', flagA: '🇫🇷', flagB: '🇸🇪', kickoff: '2026-06-30T23:00:00+02:00', stage: 'Zestiende finale', youtubeId: null },
  { id: 'zf07', teamA: 'Mexico', teamB: 'Ecuador', flagA: '🇲🇽', flagB: '🇪🇨', kickoff: '2026-07-01T03:00:00+02:00', stage: 'Zestiende finale', youtubeId: null },
  { id: 'zf08', teamA: 'Engeland', teamB: 'DR Congo', flagA: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', flagB: '🇨🇩', kickoff: '2026-07-01T18:00:00+02:00', stage: 'Zestiende finale', youtubeId: null },
  { id: 'zf09', teamA: 'België', teamB: 'Senegal', flagA: '🇧🇪', flagB: '🇸🇳', kickoff: '2026-07-01T22:00:00+02:00', stage: 'Zestiende finale', youtubeId: null },
  { id: 'zf10', teamA: 'Verenigde Staten', teamB: 'Bosnië en Herzegovina', flagA: '🇺🇸', flagB: '🇧🇦', kickoff: '2026-07-02T02:00:00+02:00', stage: 'Zestiende finale', youtubeId: null },
  { id: 'zf11', teamA: 'Spanje', teamB: 'Oostenrijk', flagA: '🇪🇸', flagB: '🇦🇹', kickoff: '2026-07-02T21:00:00+02:00', stage: 'Zestiende finale', youtubeId: null },
  { id: 'zf12', teamA: 'Portugal', teamB: 'Kroatië', flagA: '🇵🇹', flagB: '🇭🇷', kickoff: '2026-07-03T01:00:00+02:00', stage: 'Zestiende finale', youtubeId: null },
  { id: 'zf13', teamA: 'Zwitserland', teamB: 'Algerije', flagA: '🇨🇭', flagB: '🇩🇿', kickoff: '2026-07-03T05:00:00+02:00', stage: 'Zestiende finale', youtubeId: null },
  { id: 'zf14', teamA: 'Australië', teamB: 'Egypte', flagA: '🇦🇺', flagB: '🇪🇬', kickoff: '2026-07-03T20:00:00+02:00', stage: 'Zestiende finale', youtubeId: null },
  { id: 'zf15', teamA: 'Argentinië', teamB: 'Kaapverdië', flagA: '🇦🇷', flagB: '🇨🇻', kickoff: '2026-07-04T00:00:00+02:00', stage: 'Zestiende finale', youtubeId: null },
  { id: 'zf16', teamA: 'Colombia', teamB: 'Ghana', flagA: '🇨🇴', flagB: '🇬🇭', kickoff: '2026-07-04T03:30:00+02:00', stage: 'Zestiende finale', youtubeId: null },

  // Achtste finales
  { id: 'af1', teamA: 'Canada', teamB: 'Marokko', flagA: '🇨🇦', flagB: '🇲🇦', kickoff: '2026-07-04T19:00:00+02:00', stage: 'Achtste finale', youtubeId: null },
  { id: 'af2', teamA: 'Paraguay', teamB: 'Frankrijk', flagA: '🇵🇾', flagB: '🇫🇷', kickoff: '2026-07-04T23:00:00+02:00', stage: 'Achtste finale', youtubeId: null },
  { id: 'af3', teamA: 'Brazilië', teamB: 'Noorwegen', flagA: '🇧🇷', flagB: '🇳🇴', kickoff: '2026-07-05T22:00:00+02:00', stage: 'Achtste finale', youtubeId: null },
  { id: 'af4', teamA: 'Mexico', teamB: 'Engeland', flagA: '🇲🇽', flagB: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', kickoff: '2026-07-06T02:00:00+02:00', stage: 'Achtste finale', youtubeId: null },
  { id: 'af5', teamA: 'Portugal', teamB: 'Spanje', flagA: '🇵🇹', flagB: '🇪🇸', kickoff: '2026-07-06T21:00:00+02:00', stage: 'Achtste finale', youtubeId: null },
  { id: 'af6', teamA: 'Verenigde Staten', teamB: 'België', flagA: '🇺🇸', flagB: '🇧🇪', kickoff: '2026-07-07T02:00:00+02:00', stage: 'Achtste finale', youtubeId: null },
  { id: 'af7', teamA: 'Argentinië', teamB: 'Egypte', flagA: '🇦🇷', flagB: '🇪🇬', kickoff: '2026-07-07T18:00:00+02:00', stage: 'Achtste finale', youtubeId: 'fDpuJAqFKJA' },
  { id: 'af8', teamA: 'Zwitserland', teamB: 'Colombia', flagA: '🇨🇭', flagB: '🇨🇴', kickoff: '2026-07-07T22:00:00+02:00', stage: 'Achtste finale', youtubeId: null },

  // Kwartfinales
  { id: 'kf1', teamA: 'Frankrijk', teamB: 'Marokko', flagA: '🇫🇷', flagB: '🇲🇦', kickoff: '2026-07-09T22:00:00+02:00', stage: 'Kwartfinale', youtubeId: null },
  { id: 'kf2', teamA: 'Spanje', teamB: 'België', flagA: '🇪🇸', flagB: '🇧🇪', kickoff: '2026-07-10T21:00:00+02:00', stage: 'Kwartfinale', youtubeId: null },
  { id: 'kf3', teamA: 'Noorwegen', teamB: 'Engeland', flagA: '🇳🇴', flagB: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', kickoff: '2026-07-11T23:00:00+02:00', stage: 'Kwartfinale', youtubeId: null },
  { id: 'kf4', teamA: 'Argentinië', teamB: 'Zwitserland', flagA: '🇦🇷', flagB: '🇨🇭', kickoff: '2026-07-12T03:00:00+02:00', stage: 'Kwartfinale', youtubeId: null },

  // Halve finales
  { id: 'hf1', teamA: 'Frankrijk', teamB: 'Spanje', flagA: '🇫🇷', flagB: '🇪🇸', kickoff: '2026-07-14T21:00:00+02:00', stage: 'Halve finale', youtubeId: null },
  { id: 'hf2', teamA: 'Engeland', teamB: 'Argentinië', flagA: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', flagB: '🇦🇷', kickoff: '2026-07-15T21:00:00+02:00', stage: 'Halve finale', youtubeId: null },

  // Troostfinale en finale
  { id: 'troost', teamA: 'Frankrijk', teamB: 'Engeland', flagA: '🇫🇷', flagB: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', kickoff: '2026-07-18T23:00:00+02:00', stage: 'Troostfinale', youtubeId: null },
  { id: 'finale', teamA: 'Spanje', teamB: 'Argentinië', flagA: '🇪🇸', flagB: '🇦🇷', kickoff: '2026-07-19T21:00:00+02:00', stage: 'Finale', youtubeId: null },
]
