
import { Player, Phase, Exercise, TrainingSession } from '../types';

export const mockPlayers: Player[] = [
  { id: '101', name: 'Aldrin', number: 1, position: 'Guard', age: 13, level: 'Medel', skillAssessment: { 'Skytte': 7, 'Dribbling': 8, 'Passning': 8, 'Försvar': 6, 'Spelförståelse': 9, 'Kondition': 7, 'Fysik': 6 }, individualPlan: ['f1e2', 'f2e1'], accessCode: 'P-1-XY3Z', homework: [{ id: 'h1', title: '50 Straffkast', completed: true, dateAssigned: '2024-03-20' }] },
  { id: '102', name: 'Blarand', number: 2, position: 'Forward', age: 13, level: 'Avancerad', skillAssessment: { 'Skytte': 8, 'Dribbling': 7, 'Passning': 7, 'Försvar': 7, 'Spelförståelse': 8, 'Kondition': 8, 'Fysik': 9 }, individualPlan: ['f3e1'] },
  { id: '103', name: 'Dion', number: 3, position: 'Center', age: 13, level: 'Nybörjare', skillAssessment: { 'Skytte': 5, 'Dribbling': 5, 'Passning': 6, 'Försvar': 9, 'Spelförståelse': 6, 'Kondition': 9, 'Fysik': 8 }, individualPlan: ['f1e3'] }
];

export const mockPhases: Phase[] = [
  {
    id: 1,
    title: 'Fas 1: Fundament',
    duration: 'Vecka 1-4',
    color: 'from-orange-700 to-orange-600',
    description: 'Basmekanik och kroppskontroll.',
    exercises: [
      { id: 'f1e1', title: 'Form Shooting', category: 'Skott', overview: { setup: "1m från korg", action: "Enhandsskott", coachingPoint: "Frys svanhalsen" }, pedagogy: { what: "Skottmekanik", how: "Balansera bollen i en hand", why: "Isolera release" }, criteria: ['Balans i fötter', 'Armbåge in', 'Svanhals (Follow-through)', 'Bollrotation', 'Benkraft'], videoUrl: 'https://youtube.com/shorts/2xDgvuV3mtE', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Basketball shooting form diagram' },
      { id: 'f1e2', title: 'Pound Dribble', category: 'Dribbling', overview: { setup: "Stilla", action: "Hårda studs", coachingPoint: "Genom golvet" }, pedagogy: { what: "Bollkontroll", how: "Dribbla maxkraft", why: "Fingerstyrka" }, criteria: ['Hårdhet i studs', 'Blick upp', 'Låg tyngdpunkt', 'Använda fingertoppar', 'Skydda bollen'], videoUrl: 'https://www.youtube.com/watch?v=1p_tQy2iX60', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Basketball dribbling drill layout' },
      { id: 'f1e3', title: 'Defensive Stance', category: 'Försvar', overview: { setup: "Öppen yta", action: "Djup sittställning", coachingPoint: "Vikt på framfot" }, pedagogy: { what: "Grundposition", how: "Breda fötter, låg tyngdpunkt", why: "Snabbhet" }, criteria: ['Breda fötter', 'Låg rumpa (Sitta ner)', 'Rak rygg', 'Aktiva händer', 'Vikt på framfötterna'], videoUrl: 'https://www.youtube.com/shorts/5MCh5C1d9SE', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Basketball defensive stance position' },
      { id: 'f1fys', title: 'Wall Sits', category: 'Fysik', overview: { setup: "Vägg", action: "90 grader", coachingPoint: "Rak rygg" }, pedagogy: { what: "Isometrisk styrka", how: "Sitt mot vägg", why: "Uthållighet i defense" }, criteria: ['90 grader knäled', 'Rak rygg mot vägg', 'Händer hänger fritt', 'Andning', 'Vilja/Tid'], videoUrl: 'https://www.youtube.com/watch?v=-cdph8zf0j0', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Fitness wall sit exercise' }
    ]
  },
  {
    id: 2,
    title: 'Fas 2: Passning',
    duration: 'Vecka 5-8',
    color: 'from-blue-700 to-blue-600',
    description: 'Bollförflyttning och lagspel.',
    exercises: [
      { id: 'f2e1', title: 'Chest Pass', category: 'Passningar', overview: { setup: "Parvis", action: "Bröstpass", coachingPoint: "Tummarna ner" }, pedagogy: { what: "Grundpass", how: "Stega in i passet", why: "Kraft/Precision" }, criteria: ['Stega mot mottagare', 'Tummarna ner', 'Raka armar i avslut', 'Kraft', 'Träffa bröstkorgen'], videoUrl: 'https://www.youtube.com/watch?v=vI3zZ7qK_zI', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Basketball chest pass mechanics' },
      { id: 'f2e2', title: 'Bounce Pass', category: 'Passningar', overview: { setup: "Med försvar", action: "Studspass", coachingPoint: "Lågt släpp" }, pedagogy: { what: "Pass under händer", how: "Studsa 2/3 fram", why: "Undvika steals" }, criteria: ['Studs 2/3 av sträckan', 'Låg tyngdpunkt', 'En-hands-avslut', 'Precision', 'Lura försvaret'], videoUrl: 'https://www.youtube.com/watch?v=vI3zZ7qK_zI', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Basketball bounce pass angles' },
      { id: 'f2e3', title: 'Give & Go', category: 'Basket-IQ', overview: { setup: "3 spelare", action: "Passa och skär", coachingPoint: "Explosivt första steg" }, pedagogy: { what: "Rörelse efter pass", how: "Ögonkontakt, sen cut", why: "Enkla poäng" }, criteria: ['Timing i passning', 'Explosiv start (Cut)', 'Visa händerna', 'Ögonkontakt', 'Avslut mot korg'], videoUrl: 'https://www.youtube.com/watch?v=0C5l0hJ5QhQ', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Basketball give and go play' },
      { id: 'f2fys', title: 'Lateral Lunges', category: 'Fysik', overview: { setup: "Fri yta", action: "Sidoutfall", coachingPoint: "Knä över tå" }, pedagogy: { what: "Sidledsstyrka", how: "Djupa kliv åt sidan", why: "Slajd-styrka" }, criteria: ['Rak rygg', 'Knäkontroll (ej inåt)', 'Djup i rörelsen', 'Balans', 'Tryck ifrån'], videoUrl: 'https://www.youtube.com/watch?v=TyE9G3fW_2o', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Lateral lunge fitness movement' }
    ]
  },
  {
    id: 3,
    title: 'Fas 3: Layups',
    duration: 'Vecka 9-12',
    color: 'from-emerald-700 to-emerald-600',
    description: 'Avslut nära korgen.',
    exercises: [
      { id: 'f3e1', title: 'Mikan Drill', category: 'Layups', overview: { setup: "Under korgen", action: "Alternera sidor", coachingPoint: "Hög release" }, pedagogy: { what: "Närspel", how: "Använd plankan", why: "Touch" }, criteria: ['Hög boll vid hakan', 'Använda plankan', 'Fotarbete (H-V / V-H)', 'Rytm', 'Mjuk touch'], videoUrl: 'https://www.youtube.com/watch?v=UqQ-G6vU9bM', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Mikan layup drill positions' },
      { id: 'f3e2', title: 'Power Layup', category: 'Layups', overview: { setup: "Från vinge", action: "Tvåfotsupphopp", coachingPoint: "Skydda bollen" }, pedagogy: { what: "Starkt avslut", how: "Hoppa från båda fötter", why: "Absorbera kontakt" }, criteria: ['Tvåfotsupphopp', 'Skydda bollen (Chin it)', 'Balans i luften', 'Söka kontakt', 'Landning'], videoUrl: 'https://www.youtube.com/watch?v=UqQ-G6vU9bM', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Basketball power layup mechanics' },
      { id: 'f3e3', title: 'Eurostep', category: 'Layups', overview: { setup: "Full fart", action: "Riktningsbyte", coachingPoint: "Långa kliv" }, pedagogy: { what: "Fintat avslut", how: "Stega snett höger-vänster", why: "Undvika blockar" }, criteria: ['Tydlig sidoförflyttning', 'Bollskydd (högt/lågt)', 'Fartväxling', 'Balans vid avslut', 'Lura försvaret'], videoUrl: 'https://www.youtube.com/watch?v=UqQ-G6vU9bM', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Eurostep footwork diagram' },
      { id: 'f3fys', title: 'Single Leg Balance', category: 'Fysik', overview: { setup: "Stilla", action: "Stå på ett ben", coachingPoint: "Stilla höft" }, pedagogy: { what: "Proprioception", how: "Blunda på ett ben", why: "Minska skaderisk" }, criteria: ['Stilla höft', 'Knäkontroll', 'Fokus/Blick', 'Uthållighet', 'Kroppshållning'], videoUrl: 'https://www.youtube.com/watch?v=3GkQY5Z8yQI', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Single leg balance stability' }
    ]
  },
  {
    id: 4,
    title: 'Fas 4: Shooting',
    duration: 'Vecka 13-16',
    color: 'from-purple-700 to-purple-600',
    description: 'Distansskytte och fotarbete.',
    exercises: [
      { id: 'f4e1', title: 'Catch and Shoot', category: 'Skott', overview: { setup: "V-cut till hörn", action: "Fånga och skjut", coachingPoint: "Redo händer" }, pedagogy: { what: "Snabbt skott", how: "Hitta korgen tidigt", why: "Utnyttja luckor" }, criteria: ['Redo händer (Target hands)', 'Fotarbete in i skott', 'Snabb release', 'Båge på bollen', 'Balans'], videoUrl: 'https://www.youtube.com/watch?v=U3v4QpS4QW0', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Catch and shoot basketball drill' },
      { id: 'f4e2', title: 'Pull-up Jumper', category: 'Skott', overview: { setup: "Dribbling", action: "Stoppa och hoppa", coachingPoint: "Vertikalt hopp" }, pedagogy: { what: "Skott från dribbling", how: "Hårt sista studs", why: "Skapa separation" }, criteria: ['Kontrollerat stopp', 'Hoppa rakt upp', 'Hög releasepunkt', 'Balans i landning', 'Flyt i rörelsen'], videoUrl: 'https://www.youtube.com/watch?v=U3v4QpS4QW0', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Pull up jumper basketball move' },
      { id: 'f4e3', title: 'Free Throws', category: 'Skott', overview: { setup: "Linjen", action: "Rutinarbete", coachingPoint: "Samma varje gång" }, pedagogy: { what: "Straffkast", how: "Andas, sikta, följ genom", why: "Gratispoäng" }, criteria: ['Fast rutin', 'Djup andning', 'Benkraft', 'Mjuk hand/Svanhals', 'Fokus'], videoUrl: 'https://youtube.com/shorts/2xDgvuV3mtE', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Free throw shooting routine' },
      { id: 'f4fys', title: 'Broad Jumps', category: 'Fysik', overview: { setup: "Längd", action: "Explosivt hopp", coachingPoint: "Mjuk landning" }, pedagogy: { what: "Explosivitet", how: "Hoppa så långt du kan", why: "Snabbhet" }, criteria: ['Armpendling', 'Explosivt frånskjut', 'Mjuk landning (Tyst)', 'Balans vid landning', 'Hållning'], videoUrl: 'https://www.youtube.com/watch?v=A8gAP32wK4k', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Broad jump explosive movement' }
    ]
  },
  {
    id: 5,
    title: 'Fas 5: Defense',
    duration: 'Vecka 17-20',
    color: 'from-rose-700 to-rose-600',
    description: 'Individuellt och lagförsvar.',
    exercises: [
      { id: 'f5e1', title: 'Slide Drill', category: 'Försvar', overview: { setup: "Mellan koner", action: "Sido-glid", coachingPoint: "Inte korsa fötter" }, pedagogy: { what: "Fotarbete", how: "Håll fötterna isär", why: "Stoppa drives" }, criteria: ['Fötter isär (ej korsa)', 'Låg tyngdpunkt', 'Snabbhet', 'Reaktionsförmåga', 'Huvudet stilla'], videoUrl: 'https://www.youtube.com/shorts/5MCh5C1d9SE', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Defensive slide footwork drill' },
      { id: 'f5e2', title: 'Closeouts', category: 'Försvar', overview: { setup: "Sprint ut", action: "Korta steg vid skytt", coachingPoint: "Hand i sikte" }, pedagogy: { what: "Närma sig skytt", how: "Sprinta halvvägs, hacka sen", why: "Stoppa skottet" }, criteria: ['Sprint i start', 'Korta steg på slutet (Choppy)', 'Hand upp (Störa skott)', 'Balans (Redo för drive)', 'Röstkommunikation'], videoUrl: 'https://www.youtube.com/shorts/5MCh5C1d9SE', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Basketball defensive closeout drill' },
      { id: 'f5e3', title: 'Box Out', category: 'Returtagning', overview: { setup: "1v1 cirkel", action: "Hitta kontakt", coachingPoint: "Låg tyngdpunkt" }, pedagogy: { what: "Utblockering", how: "Sök kontakt med rumpan", why: "Vinn returen" }, criteria: ['Hitta anfallaren', 'Kontakt med rumpan', 'Armar breda', 'Låg tyngdpunkt', 'Aggressivitet mot boll'], videoUrl: 'https://www.youtube.com/watch?v=0X9M1c8t1c8', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Rebounding box out drill' },
      { id: 'f5fys', title: 'Plank Variations', category: 'Fysik', overview: { setup: "Golv", action: "Statisk hållning", coachingPoint: "Rak linje" }, pedagogy: { what: "Bålstabilitet", how: "Håll kroppen spänd", why: "Kontakt-tålighet" }, criteria: ['Rak linje (Rygg/Höft)', 'Spänd bål', 'Armbågar under axlar', 'Andning', 'Tid/Uthållighet'], videoUrl: 'https://www.youtube.com/watch?v=TyE9G3fW_2o', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Core plank exercise variations' }
    ]
  },
  {
    id: 6,
    title: 'Fas 6: Advanced IQ',
    duration: 'Vecka 21-24',
    color: 'from-cyan-700 to-blue-600',
    description: 'Spelförståelse och taktiska val.',
    exercises: [
      { id: 'f6e1', title: '3v2 Fast Break', category: 'Transition', overview: { setup: "Fullplan", action: "Hitta öppna ytan", coachingPoint: "Bollen i mitten" }, pedagogy: { what: "Numerärt överläge", how: "Passa till kanterna", why: "Enkla poäng" }, criteria: ['Bredda banan', 'Beslutsfattande (Pass vs Avslut)', 'Blicken upp', 'Kommunicera', 'Utnyttja överläge'], videoUrl: 'https://www.youtube.com/watch?v=WJq0z-bC6kw', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: '3v2 fast break transition play' },
      { id: 'f6e2', title: 'Pick & Roll Intro', category: 'Pick & Roll', overview: { setup: "2v2", action: "Sätt screen", coachingPoint: "Vinkla skärmen" }, pedagogy: { what: "Tvåmansspel", how: "Dribbla tajt på screenen", why: "Skapa övertag" }, criteria: ['Vinkel på screen', 'Dribbla tajt (Axel mot höft)', 'Läsa försvaret', 'Timing i rullning', 'Passningsval'], videoUrl: 'https://www.youtube.com/watch?v=QwErTyU1V23', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Pick and roll basketball play' },
      { id: 'f6e3', title: 'Zone Defense Prep', category: 'Taktik', overview: { setup: "5v5", action: "Flytta som en enhet", coachingPoint: "Prata högt" }, pedagogy: { what: "Zonförsvar", how: "Täck ytor, inte gubbe", why: "Stoppa drives" }, criteria: ['Rätt position', 'Flytta med bollen', 'Händer upp (Skära passningar)', 'Kommunikation', 'Täcka ytor'], videoUrl: 'https://www.youtube.com/watch?v=Z0nEz0nE0nE', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: '2-3 zone defense basketball layout' },
      { id: 'f6fys', title: 'Mountain Climbers', category: 'Kondition', overview: { setup: "Plankposition", action: "Snabba knän", coachingPoint: "Låg rumpa" }, pedagogy: { what: "Högintensiv fys", how: "Explosiva benrörelser", why: "Matchtempo" }, criteria: ['Höga knän', 'Stilla överkropp', 'Frekvens/Tempo', 'Andning', 'Uthållighet'], videoUrl: 'https://www.youtube.com/watch?v=5yVqZL0o8VI', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Mountain climber fitness exercise' }
    ]
  },
  {
    id: 7,
    title: 'Fas 7: Elite Skills',
    duration: 'Vecka 25-28',
    color: 'from-indigo-700 to-purple-600',
    description: 'Specialisering och spets.',
    exercises: [
      { id: 'f7e1', title: 'Step Back Jumper', category: 'Skott', overview: { setup: "1v1", action: "Skapa yta", coachingPoint: "Balans i landning" }, pedagogy: { what: "Elite skott", how: "Stöt ifrån med främre fot", why: "Skapa skott mot bra defense" }, criteria: ['Skapa separation', 'Balans i skottet', 'Fotarbete (Push-off)', 'Rytm', 'Sälja driven'], videoUrl: 'https://www.youtube.com/watch?v=U3v4QpS4QW0', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Step back jumper move diagram' },
      { id: 'f7e2', title: 'Behind Back Dribble', category: 'Dribbling', overview: { setup: "Kon-bana", action: "Handbyte bakom rygg", coachingPoint: "Skydda bollen" }, pedagogy: { what: "Avancerat handbyte", how: "Svep bollen bakom höften", why: "Undvika fällor" }, criteria: ['Bollkontroll', 'Svepande rörelse (Wrap)', 'Kroppshållning framåt', 'Fartbevarande', 'Blick upp'], videoUrl: 'https://www.youtube.com/watch?v=1p_tQy2iX60', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Behind the back dribble mechanics' },
      { id: 'f7e3', title: 'Help Side Defense', category: 'Försvar', overview: { setup: "4v4", action: "Flytta vid pass", coachingPoint: "Se boll och gubbe" }, pedagogy: { what: "Hjälpförsvar", how: "Stå i triangeln", why: "Stoppa layups" }, criteria: ['Se boll och gubbe (Pistols)', 'Triangelposition', 'Kommunikation', 'Closeout-teknik', 'Hjälpvilja'], videoUrl: 'https://www.youtube.com/shorts/5MCh5C1d9SE', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Basketball help side defense shell drill' },
      { id: 'f7fys', title: 'Box Jumps', category: 'Fysik', overview: { setup: "Låda", action: "Upphopp", coachingPoint: "Landa tyst" }, pedagogy: { what: "Pliometri", how: "Maximal spänst", why: "Returtagning" }, criteria: ['Explosivt frånskjut', 'Använda armarna', 'Mjuk landning', 'Full sträckning', 'Frekvens'], videoUrl: 'https://www.youtube.com/watch?v=A8gAP32wK4k', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Box jump vertical jump exercise' }
    ]
  },
  {
    id: 8,
    title: 'Fas 8: Game Ready',
    duration: 'Vecka 29-32',
    color: 'from-slate-800 to-slate-900',
    description: 'Matchlik träning.',
    exercises: [
      { id: 'f8e1', title: 'Scrimmage', category: 'Taktik', overview: { setup: "5v5", action: "Matchspel", coachingPoint: "Tillämpa fas 1-7" }, pedagogy: { what: "Full match", how: "Spela enligt regler", why: "Erfarenhet" }, criteria: ['Spelförståelse', 'Lagspel/Passningar', 'Defensiv intensitet', 'Beslutsfattande', 'Attityd/Fair play'], videoUrl: 'https://www.youtube.com/watch?v=L4t3G4m3S1t', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: '5v5 full court basketball scrimmage' },
      { id: 'f8e2', title: 'Out of Bounds Plays', category: 'Taktik', overview: { setup: "Baslinje", action: "Satta spel", coachingPoint: "Timing i screens" }, pedagogy: { what: "Inkastspel", how: "Följ mönstret", why: "Enkla poäng" }, criteria: ['Timing i löpningar', 'Kvalitet på screens', 'Passningssäkerhet', 'Avslut', 'Kunna sin roll'], videoUrl: 'https://www.youtube.com/watch?v=F7r33T44h0w', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Baseline out of bounds basketball play' },
      { id: 'f8e3', title: 'Clutch Free Throws', category: 'Skott', overview: { setup: "Efter löpning", action: "Trötta skott", coachingPoint: "Mental styrka" }, pedagogy: { what: "Press-skytte", how: "Sätt 2 i rad för vinst", why: "Matchavgörande" }, criteria: ['Hantera press', 'Fokus/Andning', 'Behålla teknik vid trötthet', 'Resultat', 'Mental styrka'], videoUrl: 'https://youtube.com/shorts/2xDgvuV3mtE', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Clutch free throw pressure shooting' },
      { id: 'f8fys', title: 'Shuttle Runs', category: 'Kondition', overview: { setup: "Linjer", action: "Vändlöpning", coachingPoint: "Toucha linjen" }, pedagogy: { what: "Mjölksyretålighet", how: "Maxfart fram/tillbaka", why: "Fjärde perioden" }, criteria: ['Maxfart', 'Vändningsteknik', 'Nudda linjen', 'Vilja/Pannben', 'Återhämtning'], videoUrl: 'https://www.youtube.com/watch?v=5yVqZL0o8VI', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Basketball shuttle run conditioning' }
    ]
  }
];

export const mockSessions: TrainingSession[] = [
  { id: 's1', date: '2024-03-01', phaseId: 1, exerciseIds: ['f1e1'], attendance: mockPlayers.map(p => ({ playerId: p.id, status: 'närvarande' })), evaluations: mockPlayers.map(p => ({ playerId: p.id, exerciseId: 'f1e1', scores: [3, 3], timestamp: new Date().toISOString() })) }
];
