// Wedstrijden bijwerken? Pas alleen deze lijst aan.
// - youtubeId: null  -> "Nog niet beschikbaar" (kaart is niet aanklikbaar)
// - youtubeId: "..." -> "Samenvatting beschikbaar" (plak het ID uit de YouTube-URL,
//   bijv. https://www.youtube.com/watch?v=SD8KSUrx9jA -> "SD8KSUrx9jA")
// - livestreamId: de terugkijkbare NOS-livestream van de hele wedstrijd.
//   In de speler kiesbaar via "Hele wedstrijd"; samenvatting blijft standaard.
// - Knock-outwedstrijden: vul teamA/teamB en de vlaggen in zodra de teams bekend zijn.
// Nooit een score of uitslag opslaan. Tijden zijn Nederlandse tijd.

export const matches = [
  // Oefeninterland (laatste test voor het WK, met echte samenvatting)
  { id: 'ned-oez', teamA: 'Nederland', teamB: 'Oezbekistan', flagA: '🇳🇱', flagB: '🇺🇿', kickoff: '2026-06-08T20:45:00+02:00', stage: 'Oefeninterland', youtubeId: 'SD8KSUrx9jA', livestreamId: null },

  // ── Groepsfase ──────────────────────────────────────────────
  // Groep A
  { id: 'mex-zaf', teamA: 'Mexico', teamB: 'Zuid-Afrika', flagA: '🇲🇽', flagB: '🇿🇦', kickoff: '2026-06-11T21:00:00+02:00', stage: 'Groep A', youtubeId: 'ZqzX-RTl3jo', livestreamId: 'bjKpBBOE6D8' },
  { id: 'kor-tsj', teamA: 'Zuid-Korea', teamB: 'Tsjechië', flagA: '🇰🇷', flagB: '🇨🇿', kickoff: '2026-06-12T04:00:00+02:00', stage: 'Groep A', youtubeId: '84RGrVxrRF4', livestreamId: null },
  { id: 'tsj-zaf', teamA: 'Tsjechië', teamB: 'Zuid-Afrika', flagA: '🇨🇿', flagB: '🇿🇦', kickoff: '2026-06-18T18:00:00+02:00', stage: 'Groep A', youtubeId: null, livestreamId: null },
  { id: 'mex-kor', teamA: 'Mexico', teamB: 'Zuid-Korea', flagA: '🇲🇽', flagB: '🇰🇷', kickoff: '2026-06-19T03:00:00+02:00', stage: 'Groep A', youtubeId: null, livestreamId: null },
  { id: 'tsj-mex', teamA: 'Tsjechië', teamB: 'Mexico', flagA: '🇨🇿', flagB: '🇲🇽', kickoff: '2026-06-25T03:00:00+02:00', stage: 'Groep A', youtubeId: null, livestreamId: null },
  { id: 'zaf-kor', teamA: 'Zuid-Afrika', teamB: 'Zuid-Korea', flagA: '🇿🇦', flagB: '🇰🇷', kickoff: '2026-06-25T03:00:00+02:00', stage: 'Groep A', youtubeId: null, livestreamId: null },

  // Groep B
  { id: 'can-bih', teamA: 'Canada', teamB: 'Bosnië en Herzegovina', flagA: '🇨🇦', flagB: '🇧🇦', kickoff: '2026-06-12T21:00:00+02:00', stage: 'Groep B', youtubeId: null, livestreamId: null },
  { id: 'qat-zwi', teamA: 'Qatar', teamB: 'Zwitserland', flagA: '🇶🇦', flagB: '🇨🇭', kickoff: '2026-06-13T21:00:00+02:00', stage: 'Groep B', youtubeId: null, livestreamId: null },
  { id: 'zwi-bih', teamA: 'Zwitserland', teamB: 'Bosnië en Herzegovina', flagA: '🇨🇭', flagB: '🇧🇦', kickoff: '2026-06-18T21:00:00+02:00', stage: 'Groep B', youtubeId: null, livestreamId: null },
  { id: 'can-qat', teamA: 'Canada', teamB: 'Qatar', flagA: '🇨🇦', flagB: '🇶🇦', kickoff: '2026-06-19T00:00:00+02:00', stage: 'Groep B', youtubeId: null, livestreamId: null },
  { id: 'zwi-can', teamA: 'Zwitserland', teamB: 'Canada', flagA: '🇨🇭', flagB: '🇨🇦', kickoff: '2026-06-24T21:00:00+02:00', stage: 'Groep B', youtubeId: null, livestreamId: null },
  { id: 'bih-qat', teamA: 'Bosnië en Herzegovina', teamB: 'Qatar', flagA: '🇧🇦', flagB: '🇶🇦', kickoff: '2026-06-24T21:00:00+02:00', stage: 'Groep B', youtubeId: null, livestreamId: null },

  // Groep C
  { id: 'bra-mar', teamA: 'Brazilië', teamB: 'Marokko', flagA: '🇧🇷', flagB: '🇲🇦', kickoff: '2026-06-14T00:00:00+02:00', stage: 'Groep C', youtubeId: null, livestreamId: null },
  { id: 'hai-sch', teamA: 'Haïti', teamB: 'Schotland', flagA: '🇭🇹', flagB: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', kickoff: '2026-06-14T03:00:00+02:00', stage: 'Groep C', youtubeId: null, livestreamId: null },
  { id: 'sch-mar', teamA: 'Schotland', teamB: 'Marokko', flagA: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', flagB: '🇲🇦', kickoff: '2026-06-20T00:00:00+02:00', stage: 'Groep C', youtubeId: null, livestreamId: null },
  { id: 'bra-hai', teamA: 'Brazilië', teamB: 'Haïti', flagA: '🇧🇷', flagB: '🇭🇹', kickoff: '2026-06-20T03:00:00+02:00', stage: 'Groep C', youtubeId: null, livestreamId: null },
  { id: 'sch-bra', teamA: 'Schotland', teamB: 'Brazilië', flagA: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', flagB: '🇧🇷', kickoff: '2026-06-25T00:00:00+02:00', stage: 'Groep C', youtubeId: null, livestreamId: null },
  { id: 'mar-hai', teamA: 'Marokko', teamB: 'Haïti', flagA: '🇲🇦', flagB: '🇭🇹', kickoff: '2026-06-25T00:00:00+02:00', stage: 'Groep C', youtubeId: null, livestreamId: null },

  // Groep D
  { id: 'usa-par', teamA: 'Verenigde Staten', teamB: 'Paraguay', flagA: '🇺🇸', flagB: '🇵🇾', kickoff: '2026-06-13T03:00:00+02:00', stage: 'Groep D', youtubeId: null, livestreamId: null },
  { id: 'aus-tur', teamA: 'Australië', teamB: 'Turkije', flagA: '🇦🇺', flagB: '🇹🇷', kickoff: '2026-06-14T06:00:00+02:00', stage: 'Groep D', youtubeId: null, livestreamId: null },
  { id: 'usa-aus', teamA: 'Verenigde Staten', teamB: 'Australië', flagA: '🇺🇸', flagB: '🇦🇺', kickoff: '2026-06-19T21:00:00+02:00', stage: 'Groep D', youtubeId: null, livestreamId: null },
  { id: 'tur-par', teamA: 'Turkije', teamB: 'Paraguay', flagA: '🇹🇷', flagB: '🇵🇾', kickoff: '2026-06-20T06:00:00+02:00', stage: 'Groep D', youtubeId: null, livestreamId: null },
  { id: 'tur-usa', teamA: 'Turkije', teamB: 'Verenigde Staten', flagA: '🇹🇷', flagB: '🇺🇸', kickoff: '2026-06-26T04:00:00+02:00', stage: 'Groep D', youtubeId: null, livestreamId: null },
  { id: 'par-aus', teamA: 'Paraguay', teamB: 'Australië', flagA: '🇵🇾', flagB: '🇦🇺', kickoff: '2026-06-26T04:00:00+02:00', stage: 'Groep D', youtubeId: null, livestreamId: null },

  // Groep E
  { id: 'dui-cur', teamA: 'Duitsland', teamB: 'Curaçao', flagA: '🇩🇪', flagB: '🇨🇼', kickoff: '2026-06-14T19:00:00+02:00', stage: 'Groep E', youtubeId: null, livestreamId: null },
  { id: 'ivk-ecu', teamA: 'Ivoorkust', teamB: 'Ecuador', flagA: '🇨🇮', flagB: '🇪🇨', kickoff: '2026-06-15T01:00:00+02:00', stage: 'Groep E', youtubeId: null, livestreamId: null },
  { id: 'dui-ivk', teamA: 'Duitsland', teamB: 'Ivoorkust', flagA: '🇩🇪', flagB: '🇨🇮', kickoff: '2026-06-20T22:00:00+02:00', stage: 'Groep E', youtubeId: null, livestreamId: null },
  { id: 'ecu-cur', teamA: 'Ecuador', teamB: 'Curaçao', flagA: '🇪🇨', flagB: '🇨🇼', kickoff: '2026-06-21T02:00:00+02:00', stage: 'Groep E', youtubeId: null, livestreamId: null },
  { id: 'ecu-dui', teamA: 'Ecuador', teamB: 'Duitsland', flagA: '🇪🇨', flagB: '🇩🇪', kickoff: '2026-06-25T22:00:00+02:00', stage: 'Groep E', youtubeId: null, livestreamId: null },
  { id: 'cur-ivk', teamA: 'Curaçao', teamB: 'Ivoorkust', flagA: '🇨🇼', flagB: '🇨🇮', kickoff: '2026-06-25T22:00:00+02:00', stage: 'Groep E', youtubeId: null, livestreamId: null },

  // Groep F
  { id: 'ned-jap', teamA: 'Nederland', teamB: 'Japan', flagA: '🇳🇱', flagB: '🇯🇵', kickoff: '2026-06-14T22:00:00+02:00', stage: 'Groep F', youtubeId: null, livestreamId: null },
  { id: 'zwe-tun', teamA: 'Zweden', teamB: 'Tunesië', flagA: '🇸🇪', flagB: '🇹🇳', kickoff: '2026-06-15T04:00:00+02:00', stage: 'Groep F', youtubeId: null, livestreamId: null },
  { id: 'ned-zwe', teamA: 'Nederland', teamB: 'Zweden', flagA: '🇳🇱', flagB: '🇸🇪', kickoff: '2026-06-20T19:00:00+02:00', stage: 'Groep F', youtubeId: null, livestreamId: null },
  { id: 'tun-jap', teamA: 'Tunesië', teamB: 'Japan', flagA: '🇹🇳', flagB: '🇯🇵', kickoff: '2026-06-21T06:00:00+02:00', stage: 'Groep F', youtubeId: null, livestreamId: null },
  { id: 'tun-ned', teamA: 'Tunesië', teamB: 'Nederland', flagA: '🇹🇳', flagB: '🇳🇱', kickoff: '2026-06-26T01:00:00+02:00', stage: 'Groep F', youtubeId: null, livestreamId: null },
  { id: 'jap-zwe', teamA: 'Japan', teamB: 'Zweden', flagA: '🇯🇵', flagB: '🇸🇪', kickoff: '2026-06-26T01:00:00+02:00', stage: 'Groep F', youtubeId: null, livestreamId: null },

  // Groep G
  { id: 'bel-egy', teamA: 'België', teamB: 'Egypte', flagA: '🇧🇪', flagB: '🇪🇬', kickoff: '2026-06-15T21:00:00+02:00', stage: 'Groep G', youtubeId: null, livestreamId: null },
  { id: 'irn-nzl', teamA: 'Iran', teamB: 'Nieuw-Zeeland', flagA: '🇮🇷', flagB: '🇳🇿', kickoff: '2026-06-16T03:00:00+02:00', stage: 'Groep G', youtubeId: null, livestreamId: null },
  { id: 'bel-irn', teamA: 'België', teamB: 'Iran', flagA: '🇧🇪', flagB: '🇮🇷', kickoff: '2026-06-21T21:00:00+02:00', stage: 'Groep G', youtubeId: null, livestreamId: null },
  { id: 'nzl-egy', teamA: 'Nieuw-Zeeland', teamB: 'Egypte', flagA: '🇳🇿', flagB: '🇪🇬', kickoff: '2026-06-22T03:00:00+02:00', stage: 'Groep G', youtubeId: null, livestreamId: null },
  { id: 'nzl-bel', teamA: 'Nieuw-Zeeland', teamB: 'België', flagA: '🇳🇿', flagB: '🇧🇪', kickoff: '2026-06-27T05:00:00+02:00', stage: 'Groep G', youtubeId: null, livestreamId: null },
  { id: 'egy-irn', teamA: 'Egypte', teamB: 'Iran', flagA: '🇪🇬', flagB: '🇮🇷', kickoff: '2026-06-27T05:00:00+02:00', stage: 'Groep G', youtubeId: null, livestreamId: null },

  // Groep H
  { id: 'spa-kaa', teamA: 'Spanje', teamB: 'Kaapverdië', flagA: '🇪🇸', flagB: '🇨🇻', kickoff: '2026-06-15T18:00:00+02:00', stage: 'Groep H', youtubeId: null, livestreamId: null },
  { id: 'sau-uru', teamA: 'Saoedi-Arabië', teamB: 'Uruguay', flagA: '🇸🇦', flagB: '🇺🇾', kickoff: '2026-06-16T00:00:00+02:00', stage: 'Groep H', youtubeId: null, livestreamId: null },
  { id: 'spa-sau', teamA: 'Spanje', teamB: 'Saoedi-Arabië', flagA: '🇪🇸', flagB: '🇸🇦', kickoff: '2026-06-21T18:00:00+02:00', stage: 'Groep H', youtubeId: null, livestreamId: null },
  { id: 'uru-kaa', teamA: 'Uruguay', teamB: 'Kaapverdië', flagA: '🇺🇾', flagB: '🇨🇻', kickoff: '2026-06-22T00:00:00+02:00', stage: 'Groep H', youtubeId: null, livestreamId: null },
  { id: 'uru-spa', teamA: 'Uruguay', teamB: 'Spanje', flagA: '🇺🇾', flagB: '🇪🇸', kickoff: '2026-06-27T02:00:00+02:00', stage: 'Groep H', youtubeId: null, livestreamId: null },
  { id: 'kaa-sau', teamA: 'Kaapverdië', teamB: 'Saoedi-Arabië', flagA: '🇨🇻', flagB: '🇸🇦', kickoff: '2026-06-27T02:00:00+02:00', stage: 'Groep H', youtubeId: null, livestreamId: null },

  // Groep I
  { id: 'fra-sen', teamA: 'Frankrijk', teamB: 'Senegal', flagA: '🇫🇷', flagB: '🇸🇳', kickoff: '2026-06-16T21:00:00+02:00', stage: 'Groep I', youtubeId: null, livestreamId: null },
  { id: 'irk-noo', teamA: 'Irak', teamB: 'Noorwegen', flagA: '🇮🇶', flagB: '🇳🇴', kickoff: '2026-06-17T00:00:00+02:00', stage: 'Groep I', youtubeId: null, livestreamId: null },
  { id: 'fra-irk', teamA: 'Frankrijk', teamB: 'Irak', flagA: '🇫🇷', flagB: '🇮🇶', kickoff: '2026-06-22T23:00:00+02:00', stage: 'Groep I', youtubeId: null, livestreamId: null },
  { id: 'noo-sen', teamA: 'Noorwegen', teamB: 'Senegal', flagA: '🇳🇴', flagB: '🇸🇳', kickoff: '2026-06-23T02:00:00+02:00', stage: 'Groep I', youtubeId: null, livestreamId: null },
  { id: 'noo-fra', teamA: 'Noorwegen', teamB: 'Frankrijk', flagA: '🇳🇴', flagB: '🇫🇷', kickoff: '2026-06-26T21:00:00+02:00', stage: 'Groep I', youtubeId: null, livestreamId: null },
  { id: 'sen-irk', teamA: 'Senegal', teamB: 'Irak', flagA: '🇸🇳', flagB: '🇮🇶', kickoff: '2026-06-26T21:00:00+02:00', stage: 'Groep I', youtubeId: null, livestreamId: null },

  // Groep J
  { id: 'arg-alg', teamA: 'Argentinië', teamB: 'Algerije', flagA: '🇦🇷', flagB: '🇩🇿', kickoff: '2026-06-17T03:00:00+02:00', stage: 'Groep J', youtubeId: null, livestreamId: null },
  { id: 'oos-jor', teamA: 'Oostenrijk', teamB: 'Jordanië', flagA: '🇦🇹', flagB: '🇯🇴', kickoff: '2026-06-17T06:00:00+02:00', stage: 'Groep J', youtubeId: null, livestreamId: null },
  { id: 'arg-oos', teamA: 'Argentinië', teamB: 'Oostenrijk', flagA: '🇦🇷', flagB: '🇦🇹', kickoff: '2026-06-22T19:00:00+02:00', stage: 'Groep J', youtubeId: null, livestreamId: null },
  { id: 'jor-alg', teamA: 'Jordanië', teamB: 'Algerije', flagA: '🇯🇴', flagB: '🇩🇿', kickoff: '2026-06-23T05:00:00+02:00', stage: 'Groep J', youtubeId: null, livestreamId: null },
  { id: 'jor-arg', teamA: 'Jordanië', teamB: 'Argentinië', flagA: '🇯🇴', flagB: '🇦🇷', kickoff: '2026-06-28T04:00:00+02:00', stage: 'Groep J', youtubeId: null, livestreamId: null },
  { id: 'alg-oos', teamA: 'Algerije', teamB: 'Oostenrijk', flagA: '🇩🇿', flagB: '🇦🇹', kickoff: '2026-06-28T04:00:00+02:00', stage: 'Groep J', youtubeId: null, livestreamId: null },

  // Groep K
  { id: 'por-drc', teamA: 'Portugal', teamB: 'DR Congo', flagA: '🇵🇹', flagB: '🇨🇩', kickoff: '2026-06-17T19:00:00+02:00', stage: 'Groep K', youtubeId: null, livestreamId: null },
  { id: 'oez-col', teamA: 'Oezbekistan', teamB: 'Colombia', flagA: '🇺🇿', flagB: '🇨🇴', kickoff: '2026-06-18T04:00:00+02:00', stage: 'Groep K', youtubeId: null, livestreamId: null },
  { id: 'por-oez', teamA: 'Portugal', teamB: 'Oezbekistan', flagA: '🇵🇹', flagB: '🇺🇿', kickoff: '2026-06-23T19:00:00+02:00', stage: 'Groep K', youtubeId: null, livestreamId: null },
  { id: 'col-drc', teamA: 'Colombia', teamB: 'DR Congo', flagA: '🇨🇴', flagB: '🇨🇩', kickoff: '2026-06-24T04:00:00+02:00', stage: 'Groep K', youtubeId: null, livestreamId: null },
  { id: 'col-por', teamA: 'Colombia', teamB: 'Portugal', flagA: '🇨🇴', flagB: '🇵🇹', kickoff: '2026-06-28T01:30:00+02:00', stage: 'Groep K', youtubeId: null, livestreamId: null },
  { id: 'drc-oez', teamA: 'DR Congo', teamB: 'Oezbekistan', flagA: '🇨🇩', flagB: '🇺🇿', kickoff: '2026-06-28T01:30:00+02:00', stage: 'Groep K', youtubeId: null, livestreamId: null },

  // Groep L
  { id: 'eng-kro', teamA: 'Engeland', teamB: 'Kroatië', flagA: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', flagB: '🇭🇷', kickoff: '2026-06-17T22:00:00+02:00', stage: 'Groep L', youtubeId: null, livestreamId: null },
  { id: 'gha-pan', teamA: 'Ghana', teamB: 'Panama', flagA: '🇬🇭', flagB: '🇵🇦', kickoff: '2026-06-18T01:00:00+02:00', stage: 'Groep L', youtubeId: null, livestreamId: null },
  { id: 'eng-gha', teamA: 'Engeland', teamB: 'Ghana', flagA: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', flagB: '🇬🇭', kickoff: '2026-06-23T22:00:00+02:00', stage: 'Groep L', youtubeId: null, livestreamId: null },
  { id: 'pan-kro', teamA: 'Panama', teamB: 'Kroatië', flagA: '🇵🇦', flagB: '🇭🇷', kickoff: '2026-06-24T01:00:00+02:00', stage: 'Groep L', youtubeId: null, livestreamId: null },
  { id: 'pan-eng', teamA: 'Panama', teamB: 'Engeland', flagA: '🇵🇦', flagB: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', kickoff: '2026-06-27T23:00:00+02:00', stage: 'Groep L', youtubeId: null, livestreamId: null },
  { id: 'kro-gha', teamA: 'Kroatië', teamB: 'Ghana', flagA: '🇭🇷', flagB: '🇬🇭', kickoff: '2026-06-27T23:00:00+02:00', stage: 'Groep L', youtubeId: null, livestreamId: null },

  // ── Knock-outfase (teams invullen zodra bekend) ─────────────
  // Zestiende finales
  { id: 'zf01', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-06-28T21:00:00+02:00', stage: 'Zestiende finale', youtubeId: null, livestreamId: null },
  { id: 'zf02', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-06-29T19:00:00+02:00', stage: 'Zestiende finale', youtubeId: null, livestreamId: null },
  { id: 'zf03', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-06-29T22:30:00+02:00', stage: 'Zestiende finale', youtubeId: null, livestreamId: null },
  { id: 'zf04', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-06-30T03:00:00+02:00', stage: 'Zestiende finale', youtubeId: null, livestreamId: null },
  { id: 'zf05', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-06-30T19:00:00+02:00', stage: 'Zestiende finale', youtubeId: null, livestreamId: null },
  { id: 'zf06', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-06-30T23:00:00+02:00', stage: 'Zestiende finale', youtubeId: null, livestreamId: null },
  { id: 'zf07', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-01T03:00:00+02:00', stage: 'Zestiende finale', youtubeId: null, livestreamId: null },
  { id: 'zf08', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-01T18:00:00+02:00', stage: 'Zestiende finale', youtubeId: null, livestreamId: null },
  { id: 'zf09', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-01T22:00:00+02:00', stage: 'Zestiende finale', youtubeId: null, livestreamId: null },
  { id: 'zf10', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-02T02:00:00+02:00', stage: 'Zestiende finale', youtubeId: null, livestreamId: null },
  { id: 'zf11', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-02T21:00:00+02:00', stage: 'Zestiende finale', youtubeId: null, livestreamId: null },
  { id: 'zf12', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-03T01:00:00+02:00', stage: 'Zestiende finale', youtubeId: null, livestreamId: null },
  { id: 'zf13', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-03T05:00:00+02:00', stage: 'Zestiende finale', youtubeId: null, livestreamId: null },
  { id: 'zf14', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-03T20:00:00+02:00', stage: 'Zestiende finale', youtubeId: null, livestreamId: null },
  { id: 'zf15', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-04T00:00:00+02:00', stage: 'Zestiende finale', youtubeId: null, livestreamId: null },
  { id: 'zf16', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-04T03:00:00+02:00', stage: 'Zestiende finale', youtubeId: null, livestreamId: null },

  // Achtste finales
  { id: 'af1', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-04T19:00:00+02:00', stage: 'Achtste finale', youtubeId: null, livestreamId: null },
  { id: 'af2', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-04T23:00:00+02:00', stage: 'Achtste finale', youtubeId: null, livestreamId: null },
  { id: 'af3', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-05T22:00:00+02:00', stage: 'Achtste finale', youtubeId: null, livestreamId: null },
  { id: 'af4', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-06T02:00:00+02:00', stage: 'Achtste finale', youtubeId: null, livestreamId: null },
  { id: 'af5', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-06T21:00:00+02:00', stage: 'Achtste finale', youtubeId: null, livestreamId: null },
  { id: 'af6', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-07T02:00:00+02:00', stage: 'Achtste finale', youtubeId: null, livestreamId: null },
  { id: 'af7', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-07T18:00:00+02:00', stage: 'Achtste finale', youtubeId: null, livestreamId: null },
  { id: 'af8', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-07T22:00:00+02:00', stage: 'Achtste finale', youtubeId: null, livestreamId: null },

  // Kwartfinales
  { id: 'kf1', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-09T22:00:00+02:00', stage: 'Kwartfinale', youtubeId: null, livestreamId: null },
  { id: 'kf2', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-10T21:00:00+02:00', stage: 'Kwartfinale', youtubeId: null, livestreamId: null },
  { id: 'kf3', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-11T23:00:00+02:00', stage: 'Kwartfinale', youtubeId: null, livestreamId: null },
  { id: 'kf4', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-12T03:00:00+02:00', stage: 'Kwartfinale', youtubeId: null, livestreamId: null },

  // Halve finales
  { id: 'hf1', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-14T21:00:00+02:00', stage: 'Halve finale', youtubeId: null, livestreamId: null },
  { id: 'hf2', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-15T21:00:00+02:00', stage: 'Halve finale', youtubeId: null, livestreamId: null },

  // Troostfinale en finale
  { id: 'troost', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-18T22:00:00+02:00', stage: 'Troostfinale', youtubeId: null, livestreamId: null },
  { id: 'finale', teamA: 'Nog te bepalen', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-19T21:00:00+02:00', stage: 'Finale', youtubeId: null, livestreamId: null },
]
