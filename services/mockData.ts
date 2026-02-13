
import { Player, Phase, Exercise, TrainingSession } from '../types';

export const mockPlayers: Player[] = [
  { id: '101', name: 'Aldrin', number: 1, position: 'Guard', age: 13, level: 'Medel', skillAssessment: { 'Skytte': 7, 'Dribbling': 8, 'Passning': 8, 'Försvar': 6, 'Spelförståelse': 9, 'Kondition': 7, 'Fysik': 6 }, individualPlan: ['f1e2', 'f2e1'], accessCode: 'P-1-XY3Z', homework: [{ id: 'h1', title: '50 Straffkast', completed: true, dateAssigned: '2024-03-20' }] },
  { id: '102', name: 'Blarand', number: 2, position: 'Forward', age: 13, level: 'Avancerad', skillAssessment: { 'Skytte': 8, 'Dribbling': 7, 'Passning': 7, 'Försvar': 7, 'Spelförståelse': 8, 'Kondition': 8, 'Fysik': 9 }, individualPlan: ['f3e1'] },
  { id: '103', name: 'Dion', number: 3, position: 'Center', age: 13, level: 'Nybörjare', skillAssessment: { 'Skytte': 5, 'Dribbling': 5, 'Passning': 6, 'Försvar': 9, 'Spelförståelse': 6, 'Kondition': 9, 'Fysik': 8 }, individualPlan: ['f1e3'] }
];

export const mockPhases: Phase[] = [
  {
    id: 1, title: 'Fas 1: Fundament', duration: 'Vecka 1-4', color: 'from-orange-700 to-orange-600', description: 'Basmekanik och kroppskontroll.',
    exercises: [
      { id: 'f1e1', title: 'Form Shooting', category: 'Skott', overview: { setup: "1m från korg", action: "Enhandsskott", coachingPoint: "Frys svanhalsen" }, pedagogy: { what: "Skottmekanik", how: "Balansera bollen i en hand", why: "Isolera release" }, criteria: ['Fotställning', 'Balans', 'Armbåge in', 'Följ genom', 'Båge'], videoUrl: 'https://youtube.com/shorts/2xDgvuV3mtE', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Basketball form' },
      { id: 'f1e2', title: 'Pound Dribble', category: 'Dribbling', overview: { setup: "Stilla", action: "Hårda studs", coachingPoint: "Genom golvet" }, pedagogy: { what: "Bollkontroll", how: "Dribbla maxkraft", why: "Fingerstyrka" }, criteria: ['Kraft', 'Blick upp', 'Låg tyngdpunkt', 'Kontroll', 'Frekvens'], videoUrl: 'https://www.youtube.com/shorts/1p_tQy2iX60', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Dribbling' },
      { id: 'f1e3', title: 'Defensive Stance', category: 'Försvar', overview: { setup: "Öppen yta", action: "Djup sittställning", coachingPoint: "Vikt på framfot" }, pedagogy: { what: "Grundposition", how: "Breda fötter, låg tyngdpunkt", why: "Snabbhet" }, criteria: ['Djup', 'Balans', 'Aktiva händer', 'Blick', 'Fart i fötter'], videoUrl: 'https://www.youtube.com/shorts/5MCh5C1d9SE', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Defense' },
      { id: 'f1fys', title: 'Wall Sits', category: 'Fysik', overview: { setup: "Vägg", action: "90 grader", coachingPoint: "Rak rygg" }, pedagogy: { what: "Isometrisk styrka", how: "Sitt mot vägg", why: "Uthållighet" }, criteria: ['Vinkel 90st', 'Hållning', 'Andning', 'Mental styrka', 'Stabilitet'], videoUrl: 'https://www.youtube.com/watch?v=-cdph8zf0j0', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Fitness' }
    ]
  },
  {
    id: 2, title: 'Fas 2: Passning', duration: 'Vecka 5-8', color: 'from-blue-700 to-blue-600', description: 'Bollförflyttning och lagspel.',
    exercises: [
      { id: 'f2e1', title: 'Chest Pass', category: 'Passningar', overview: { setup: "Parvis", action: "Bröstpass", coachingPoint: "Tummarna ner" }, pedagogy: { what: "Grundpass", how: "Stega in i passet", why: "Kraft/Precision" }, criteria: ['Rotation', 'Precision', 'Kraft', 'Steg framåt', 'Mottagning'], videoUrl: 'https://www.youtube.com/watch?v=vI3zZ7qK_zI', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Pass' },
      { id: 'f2e2', title: 'Bounce Pass', category: 'Passningar', overview: { setup: "Med försvar", action: "Studspass", coachingPoint: "Lågt släpp" }, pedagogy: { what: "Pass under händer", how: "Studsa 2/3 fram", why: "Undvika steals" }, criteria: ['Vinkel', 'Hårdhet', 'Timing', 'Låg release', 'Precision'], videoUrl: 'https://www.youtube.com/watch?v=vI3zZ7qK_zI', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Pass' },
      { id: 'f2e3', title: 'Give & Go', category: 'Basket-IQ', overview: { setup: "3 spelare", action: "Passa och skär", coachingPoint: "Explosivt första steg" }, pedagogy: { what: "Rörelse efter pass", how: "Ögonkontakt, sen cut", why: "Enkla poäng" }, criteria: ['V-cut', 'Target hands', 'Timing', 'Fart i skärning', 'Avslut'], videoUrl: 'https://www.youtube.com/watch?v=0C5l0hJ5QhQ', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'IQ' },
      { id: 'f2fys', title: 'Lateral Lunges', category: 'Fysik', overview: { setup: "Fri yta", action: "Sidoutfall", coachingPoint: "Knä över tå" }, pedagogy: { what: "Sidledsstyrka", how: "Djupa kliv åt sidan", why: "Slajd-styrka" }, criteria: ['Djup', 'Kontroll', 'Balans', 'Explosivitet upp', 'Knäkontroll'], videoUrl: 'https://www.youtube.com/watch?v=TyE9G3fW_2o', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Fitness' }
    ]
  },
  {
    id: 3, title: 'Fas 3: Layups', duration: 'Vecka 9-12', color: 'from-emerald-700 to-emerald-600', description: 'Avslut nära korgen.',
    exercises: [
      { id: 'f3e1', title: 'Mikan Drill', category: 'Layups', overview: { setup: "Under korg", action: "Alternera sidor", coachingPoint: "Hög release" }, pedagogy: { what: "Närspel", how: "Använd plankan", why: "Touch" }, criteria: ['Fotarbete', 'Touch', 'Hög release', 'Rytm', 'Blick på korg'], videoUrl: 'https://www.youtube.com/watch?v=UqQ-G6vU9bM', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Layup' },
      { id: 'f3e2', title: 'Power Layup', category: 'Layups', overview: { setup: "Från vinge", action: "Tvåfotsupphopp", coachingPoint: "Skydda bollen" }, pedagogy: { what: "Starkt avslut", how: "Hoppa från båda fötter", why: "Absorbera kontakt" }, criteria: ['Bollskydd', 'Stopp-steg', 'Upphopp', 'Styrka', 'Focus'], videoUrl: 'https://www.youtube.com/watch?v=UqQ-G6vU9bM', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Layup' },
      { id: 'f3e3', title: 'Eurostep', category: 'Layups', overview: { setup: "Full fart", action: "Riktningsbyte", coachingPoint: "Långa kliv" }, pedagogy: { what: "Fintat avslut", how: "Stega snett höger-vänster", why: "Undvika blockar" }, criteria: ['Steglängd', 'Balans', 'Bollrörelse', 'Läsning', 'Avslut'], videoUrl: 'https://www.youtube.com/watch?v=UqQ-G6vU9bM', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Layup' },
      { id: 'f3fys', title: 'Single Leg Balance', category: 'Fysik', overview: { setup: "Stilla", action: "Stå på ett ben", coachingPoint: "Stilla höft" }, pedagogy: { what: "Proprioception", how: "Blunda på ett ben", why: "Minska skaderisk" }, criteria: ['Stabilitet', 'Ankelstyrka', 'Hållning', 'Koncentration', 'Höftkontroll'], videoUrl: 'https://www.youtube.com/watch?v=3GkQY5Z8yQI', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Balance' }
    ]
  },
  {
    id: 4, title: 'Fas 4: Skytte', duration: 'Vecka 13-16', color: 'from-purple-700 to-purple-600', description: 'Distansskytte och fotarbete.',
    exercises: [
      { id: 'f4e1', title: 'Catch and Shoot', category: 'Skott', overview: { setup: "V-cut", action: "Fånga och skjut", coachingPoint: "Redo händer" }, pedagogy: { what: "Snabbt skott", how: "Hitta korgen tidigt", why: "Utnyttja luckor" }, criteria: ['Fart', 'Square up', 'Hand-ready', 'Release', 'Båge'], videoUrl: 'https://www.youtube.com/watch?v=U3v4QpS4QW0', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Shooting' },
      { id: 'f4e2', title: 'Pull-up Jumper', category: 'Skott', overview: { setup: "Dribbling", action: "Stoppa och hoppa", coachingPoint: "Vertikalt hopp" }, pedagogy: { what: "Skott från dribbling", how: "Hårt sista studs", why: "Skapa separation" }, criteria: ['Balans', 'Höjd i hopp', 'Bollkontroll', 'Snabbhet', 'Touch'], videoUrl: 'https://www.youtube.com/watch?v=U3v4QpS4QW0', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Shooting' },
      { id: 'f4e3', title: 'Free Throws', category: 'Skott', overview: { setup: "Linjen", action: "Rutinarbete", coachingPoint: "Samma varje gång" }, pedagogy: { what: "Straffkast", how: "Andas, sikta, följ genom", why: "Gratispoäng" }, criteria: ['Rutin', 'Fokus', 'Sikte', 'Följ genom', 'Andning'], videoUrl: 'https://youtube.com/shorts/2xDgvuV3mtE', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'FT' },
      { id: 'f4fys', title: 'Broad Jumps', category: 'Fysik', overview: { setup: "Längd", action: "Explosivt hopp", coachingPoint: "Mjuk landning" }, pedagogy: { what: "Explosivitet", how: "Hoppa så långt du kan", why: "Snabbhet" }, criteria: ['Kraft', 'Landning', 'Satsning', 'Armpendel', 'Knäkontroll'], videoUrl: 'https://www.youtube.com/watch?v=A8gAP32wK4k', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Power' }
    ]
  },
  {
    id: 5, title: 'Fas 5: Försvar', duration: 'Vecka 17-20', color: 'from-rose-700 to-rose-600', description: 'Individuellt och lagförsvar.',
    exercises: [
      { id: 'f5e1', title: 'Slide Drill', category: 'Försvar', overview: { setup: "Mellan koner", action: "Sido-glid", coachingPoint: "Inte korsa fötter" }, pedagogy: { what: "Fotarbete", how: "Håll fötterna isär", why: "Stoppa drives" }, criteria: ['Fart', 'Stance', 'Händer ute', 'Blick', 'Ingen kyss'], videoUrl: 'https://www.youtube.com/shorts/5MCh5C1d9SE', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Defense' },
      { id: 'f5e2', title: 'Closeouts', category: 'Försvar', overview: { setup: "Sprint ut", action: "Korta steg vid skytt", coachingPoint: "Hand i sikte" }, pedagogy: { what: "Närsmå skytt", how: "Sprinta halvvägs, hacka sen", why: "Stoppa skottet" }, criteria: ['Sprint-fart', 'Hacksteg', 'Hand upp', 'Balans', 'Reaktion'], videoUrl: 'https://www.youtube.com/shorts/5MCh5C1d9SE', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Defense' },
      { id: 'f5e3', title: 'Box Out', category: 'Returtagning', overview: { setup: "1v1 cirkel", action: "Hitta kontakt", coachingPoint: "Låg tyngdpunkt" }, pedagogy: { what: "Utblockering", how: "Sök kontakt med rumpan", why: "Vinn returen" }, criteria: ['Kontakt', 'Aggressivitet', 'Position', 'Bredd', 'Grepp'], videoUrl: 'https://www.youtube.com/watch?v=0X9M1c8t1c8', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Rebound' },
      { id: 'f5fys', title: 'Plank Variations', category: 'Fysik', overview: { setup: "Golv", action: "Statisk hållning", coachingPoint: "Rak linje" }, pedagogy: { what: "Bålstabilitet", how: "Håll kroppen spänd", why: "Kontakt-tålighet" }, criteria: ['Hållning', 'Tid', 'Stabilitet', 'Andning', 'Variation'], videoUrl: 'https://www.youtube.com/watch?v=TyE9G3fW_2o', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Core' }
    ]
  },
  {
    id: 6, title: 'Fas 6: Transition', duration: 'Vecka 21-24', color: 'from-cyan-700 to-blue-600', description: 'Spelförståelse och fart.',
    exercises: [
      { id: 'f6e1', title: '3v2 Fast Break', category: 'Transition', overview: { setup: "Fullplan", action: "Hitta ytan", coachingPoint: "Bollen i mitten" }, pedagogy: { what: "Överläge", how: "Passa till kanterna", why: "Enkla poäng" }, criteria: ['Beslut', 'Spacing', 'Fart', 'Passning', 'Avslut'], videoUrl: 'https://www.youtube.com/watch?v=WJq0z-bC6kw', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'IQ' },
      { id: 'f6e2', title: 'Pick & Roll Intro', category: 'Pick & Roll', overview: { setup: "2v2", action: "Sätt screen", coachingPoint: "Vinkla skärmen" }, pedagogy: { what: "Tvåmansspel", how: "Dribbla tajt på screenen", why: "Skapa övertag" }, criteria: ['Timing', 'Läsning', 'Screen-vinkel', 'Roll/Pop', 'Avslut'], videoUrl: 'https://www.youtube.com/watch?v=QwErTyU1V23', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Tactics' },
      { id: 'f6e3', title: 'Outlet Pass', category: 'Passningar', overview: { setup: "Retur", action: "Vänd utåt", coachingPoint: "Snabbt utspel" }, pedagogy: { what: "Starta kontring", how: "Hitta vingen direkt", why: "Tempo" }, criteria: ['Sikte', 'Vändning', 'Fart', 'Precision', 'Kommunikation'], videoUrl: 'https://www.youtube.com/watch?v=K8L9M7N6O5P', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Pass' },
      { id: 'f6fys', title: 'Mountain Climbers', category: 'Kondition', overview: { setup: "Plankposition", action: "Snabba knän", coachingPoint: "Låg rumpa" }, pedagogy: { what: "Högintensiv fys", how: "Explosiva benrörelser", why: "Matchtempo" }, criteria: ['Frekvens', 'Bål', 'Uthållighet', 'Teknik', 'Tempo'], videoUrl: 'https://www.youtube.com/watch?v=5yVqZL0o8VI', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Fitness' }
    ]
  },
  {
    id: 7, title: 'Fas 7: Specialisering', duration: 'Vecka 25-28', color: 'from-indigo-700 to-purple-600', description: 'Avancerad teknik.',
    exercises: [
      { id: 'f7e1', title: 'Step Back Jumper', category: 'Skott', overview: { setup: "1v1", action: "Skapa yta", coachingPoint: "Balans i landning" }, pedagogy: { what: "Elite skott", how: "Stöt ifrån framfot", why: "Skapa separation" }, criteria: ['Separation', 'Balans', 'Fart', 'Landning', 'Precision'], videoUrl: 'https://www.youtube.com/watch?v=U3v4QpS4QW0', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Shooting' },
      { id: 'f7e2', title: 'Behind Back Dribble', category: 'Dribbling', overview: { setup: "Kon-bana", action: "Handbyte bakom", coachingPoint: "Skydda bollen" }, pedagogy: { what: "Elite dribbling", how: "Svep bollen lågt", why: "Undvika fällor" }, criteria: ['Kontroll', 'Fart', 'Bollskydd', 'Låg studs', 'Smidighet'], videoUrl: 'https://www.youtube.com/watch?v=1p_tQy2iX60', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Dribbling' },
      { id: 'f7e3', title: 'Help Side Defense', category: 'Försvar', overview: { setup: "4v4", action: "Flytta vid pass", coachingPoint: "Se boll och gubbe" }, pedagogy: { what: "Hjälpförsvar", how: "Stå i triangeln", why: "Stoppa layups" }, criteria: ['Position', 'Blick', 'Prat', 'Rotation', 'Closeout'], videoUrl: 'https://www.youtube.com/shorts/5MCh5C1d9SE', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Defense' },
      { id: 'f7fys', title: 'Box Jumps', category: 'Fysik', overview: { setup: "Låda", action: "Upphopp", coachingPoint: "Landa tyst" }, pedagogy: { what: "Pliometri", how: "Maximal spänst", why: "Returtagning" }, criteria: ['Höjd', 'Landning', 'Satsning', 'Explosivitet', 'Säkerhet'], videoUrl: 'https://www.youtube.com/watch?v=A8gAP32wK4k', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Power' }
    ]
  },
  {
    id: 8, title: 'Fas 8: Peak', duration: 'Vecka 29-32', color: 'from-slate-800 to-slate-900', description: 'Matchförberedelser.',
    exercises: [
      { id: 'f8e1', title: 'Scrimmage', category: 'Taktik', overview: { setup: "5v5", action: "Matchspel", coachingPoint: "Tillämpa allt" }, pedagogy: { what: "Full match", how: "Spela enligt regler", why: "Erfarenhet" }, criteria: ['Beslut', 'Lagspel', 'Försvar', 'Transition', 'Kommunikation'], videoUrl: 'https://www.youtube.com/watch?v=L4t3G4m3S1t', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Game' },
      { id: 'f8e2', title: 'Out of Bounds Plays', category: 'Taktik', overview: { setup: "Baslinje", action: "Satta spel", coachingPoint: "Timing i screens" }, pedagogy: { what: "Inkastspel", how: "Följ mönstret", why: "Enkla poäng" }, criteria: ['Exekvering', 'Timing', 'Spacing', 'Screen-kvalitet', 'Passnings-val'], videoUrl: 'https://www.youtube.com/watch?v=F7r33T44h0w', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Tactics' },
      { id: 'f8e3', title: 'Clutch Free Throws', category: 'Skott', overview: { setup: "Trött", action: "Press-skott", coachingPoint: "Mental kyla" }, pedagogy: { what: "Matchavgörande", how: "Andas, sätt 2 i rad", why: "Vinnarmoral" }, criteria: ['Kyla', 'Fokus', 'Rutin', 'Trötthetshantering', 'Mål'], videoUrl: 'https://youtube.com/shorts/2xDgvuV3mtE', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Shooting' },
      { id: 'f8fys', title: 'Shuttle Runs', category: 'Kondition', overview: { setup: "Linjer", action: "Vändlöpning", coachingPoint: "Toucha linjen" }, pedagogy: { what: "Uthållighet", how: "Maxfart", why: "Fjärde perioden" }, criteria: ['Vilja', 'Fart', 'Vändning', 'Andning', 'Hållning'], videoUrl: 'https://www.youtube.com/watch?v=5yVqZL0o8VI', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Fitness' }
    ]
  }
];

export const mockSessions: TrainingSession[] = [
  { id: 's1', date: '2024-03-01', phaseId: 1, exerciseIds: ['f1e1'], attendance: mockPlayers.map(p => ({ playerId: p.id, status: 'närvarande' })), evaluations: mockPlayers.map(p => ({ playerId: p.id, exerciseId: 'f1e1', scores: [3, 3, 3, 3, 3], timestamp: new Date().toISOString() })) }
];
