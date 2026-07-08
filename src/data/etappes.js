// Tour de France 2026: alle 21 etappes (4 t/m 26 juli, rustdagen 13 en 20 juli).
// Zelfde spelregels als matches.js:
// - youtubeId: null  -> "Nog niet beschikbaar" (kaart is niet aanklikbaar)
// - youtubeId: "..." -> samenvatting beschikbaar (ID uit de YouTube-URL)
// - Nooit een uitslag, winnaar of klassement opslaan. Tijden zijn Nederlandse tijd.
// - Eén object per regel houden: het check-script vult youtubeId per regel in.
//
// Route (start/finish/afstand/type) komt van cyclingstage.com, de starttijden
// van franceletour.com (CEST, dubbel gecheckt tegen de routes). De cron matcht
// alleen op het etappenummer, dus een afwijkende plaatsnaam breekt niets,
// maar staat wel zichtbaar in de app.
//
// teamA bevat een leesbare naam ("Etappe 5") voor het beheerscherm en de logs;
// stage is overal 'Tour de France' zodat speler en SEO die als toernooi tonen.

export const etappes = [
  { id: 'tour-1', sport: 'tour', etappeNr: 1, teamA: 'Etappe 1', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-04T17:05:00+02:00', stage: 'Tour de France', startPlaats: 'Barcelona', finishPlaats: 'Barcelona', afstandKm: 19.6, etappeType: 'ploegentijdrit', youtubeId: null },
  { id: 'tour-2', sport: 'tour', etappeNr: 2, teamA: 'Etappe 2', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-05T13:45:00+02:00', stage: 'Tour de France', startPlaats: 'Tarragona', finishPlaats: 'Barcelona', afstandKm: 168.5, etappeType: 'heuvelachtig', youtubeId: null },
  { id: 'tour-3', sport: 'tour', etappeNr: 3, teamA: 'Etappe 3', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-06T12:15:00+02:00', stage: 'Tour de France', startPlaats: 'Granollers', finishPlaats: 'Les Angles', afstandKm: 195.9, etappeType: 'bergen', youtubeId: 'NnYmMfAXso8' },
  { id: 'tour-4', sport: 'tour', etappeNr: 4, teamA: 'Etappe 4', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-07T13:05:00+02:00', stage: 'Tour de France', startPlaats: 'Carcassonne', finishPlaats: 'Foix', afstandKm: 181.9, etappeType: 'heuvelachtig', youtubeId: 'uMUhpFXH3_I' },
  { id: 'tour-5', sport: 'tour', etappeNr: 5, teamA: 'Etappe 5', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-08T14:05:00+02:00', stage: 'Tour de France', startPlaats: 'Lannemezan', finishPlaats: 'Pau', afstandKm: 158.3, etappeType: 'vlak', youtubeId: null },
  { id: 'tour-6', sport: 'tour', etappeNr: 6, teamA: 'Etappe 6', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-09T12:15:00+02:00', stage: 'Tour de France', startPlaats: 'Pau', finishPlaats: 'Gavarnie-Gèdre', afstandKm: 186.2, etappeType: 'bergen', youtubeId: null },
  { id: 'tour-7', sport: 'tour', etappeNr: 7, teamA: 'Etappe 7', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-10T13:05:00+02:00', stage: 'Tour de France', startPlaats: 'Hagetmau', finishPlaats: 'Bordeaux', afstandKm: 175.1, etappeType: 'vlak', youtubeId: null },
  { id: 'tour-8', sport: 'tour', etappeNr: 8, teamA: 'Etappe 8', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-11T13:05:00+02:00', stage: 'Tour de France', startPlaats: 'Périgueux', finishPlaats: 'Bergerac', afstandKm: 180.4, etappeType: 'vlak', youtubeId: null },
  { id: 'tour-9', sport: 'tour', etappeNr: 9, teamA: 'Etappe 9', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-12T13:05:00+02:00', stage: 'Tour de France', startPlaats: 'Malemort', finishPlaats: 'Ussel', afstandKm: 185.5, etappeType: 'heuvelachtig', youtubeId: null },
  // rustdag 13 juli
  { id: 'tour-10', sport: 'tour', etappeNr: 10, teamA: 'Etappe 10', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-14T12:15:00+02:00', stage: 'Tour de France', startPlaats: 'Aurillac', finishPlaats: 'Le Lioran', afstandKm: 166.6, etappeType: 'heuvelachtig', youtubeId: null },
  { id: 'tour-11', sport: 'tour', etappeNr: 11, teamA: 'Etappe 11', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-15T13:05:00+02:00', stage: 'Tour de France', startPlaats: 'Vichy', finishPlaats: 'Nevers', afstandKm: 161.3, etappeType: 'vlak', youtubeId: null },
  { id: 'tour-12', sport: 'tour', etappeNr: 12, teamA: 'Etappe 12', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-16T13:05:00+02:00', stage: 'Tour de France', startPlaats: 'Magny-Cours', finishPlaats: 'Chalon-sur-Saône', afstandKm: 179.1, etappeType: 'vlak', youtubeId: null },
  { id: 'tour-13', sport: 'tour', etappeNr: 13, teamA: 'Etappe 13', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-17T13:05:00+02:00', stage: 'Tour de France', startPlaats: 'Dole', finishPlaats: 'Belfort', afstandKm: 205.8, etappeType: 'heuvelachtig', youtubeId: null },
  { id: 'tour-14', sport: 'tour', etappeNr: 14, teamA: 'Etappe 14', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-18T12:15:00+02:00', stage: 'Tour de France', startPlaats: 'Mulhouse', finishPlaats: 'Le Markstein', afstandKm: 155.3, etappeType: 'bergen', youtubeId: null },
  { id: 'tour-15', sport: 'tour', etappeNr: 15, teamA: 'Etappe 15', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-19T12:15:00+02:00', stage: 'Tour de France', startPlaats: 'Champagnole', finishPlaats: 'Plateau de Solaison', afstandKm: 183.9, etappeType: 'bergen', youtubeId: null },
  // rustdag 20 juli
  { id: 'tour-16', sport: 'tour', etappeNr: 16, teamA: 'Etappe 16', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-21T12:30:00+02:00', stage: 'Tour de France', startPlaats: 'Évian-les-Bains', finishPlaats: 'Thonon-les-Bains', afstandKm: 26.1, etappeType: 'tijdrit', youtubeId: null },
  { id: 'tour-17', sport: 'tour', etappeNr: 17, teamA: 'Etappe 17', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-22T13:05:00+02:00', stage: 'Tour de France', startPlaats: 'Chambéry', finishPlaats: 'Voiron', afstandKm: 174.7, etappeType: 'vlak', youtubeId: null },
  { id: 'tour-18', sport: 'tour', etappeNr: 18, teamA: 'Etappe 18', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-23T12:15:00+02:00', stage: 'Tour de France', startPlaats: 'Voiron', finishPlaats: 'Orcières-Merlette', afstandKm: 185.2, etappeType: 'bergen', youtubeId: null },
  { id: 'tour-19', sport: 'tour', etappeNr: 19, teamA: 'Etappe 19', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-24T12:15:00+02:00', stage: 'Tour de France', startPlaats: 'Gap', finishPlaats: "Alpe d'Huez", afstandKm: 127.9, etappeType: 'bergen', youtubeId: null },
  { id: 'tour-20', sport: 'tour', etappeNr: 20, teamA: 'Etappe 20', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-25T12:15:00+02:00', stage: 'Tour de France', startPlaats: "Le Bourg-d'Oisans", finishPlaats: "Alpe d'Huez", afstandKm: 170.9, etappeType: 'bergen', youtubeId: null },
  { id: 'tour-21', sport: 'tour', etappeNr: 21, teamA: 'Etappe 21', teamB: '', flagA: '', flagB: '', kickoff: '2026-07-26T16:30:00+02:00', stage: 'Tour de France', startPlaats: 'Thoiry', finishPlaats: 'Parijs', afstandKm: 133.0, etappeType: 'vlak', youtubeId: null },
]
