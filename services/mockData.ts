
import { Player, Phase, Exercise, TrainingSession, WarmupExercise, WarmupPhase } from '../types';

export const mockWarmupExercises: WarmupExercise[] = [
  {
    id: 'w1',
    title: 'Spegeln (Puls)',
    phase: WarmupPhase.PULS,
    duration: '3 min',
    description: 'Spelarna jobbar parvis. En är ledare och gör basketrörelser, den andra ska spegla exakt.',
    coachingPoints: ['Låg tyngdpunkt', 'Snabba fötter', 'Ögonkontakt'],
    sbbfFocus: 'Rörelseförståelse & Reaktion',
    videoUrl: 'https://www.youtube.com/watch?v=1p_tQy2iX60'
  },
  {
    id: 'w2',
    title: 'Utfall med rotation',
    phase: WarmupPhase.AKTIVERING,
    duration: '4 min',
    description: 'Stora utfallssteg framåt med en rotation av överkroppen över det främre benet.',
    coachingPoints: ['Knä över tå', 'Stolt hållning', 'Kontrollerad rotation'],
    sbbfFocus: 'Knäkontroll & Mobilitet',
    videoUrl: 'https://www.youtube.com/watch?v=y-wV4Venusw'
  },
  {
    id: 'w3',
    title: 'Enbenslandningar',
    phase: WarmupPhase.AKTIVERING,
    duration: '3 min',
    description: 'Hoppa framåt/sidled och landa på ett ben. Håll balansen i 2 sekunder.',
    coachingPoints: ['Mjuk landning', 'Knä i linje med tå', 'Stilla höft'],
    sbbfFocus: 'Knäkontroll (SBBF Standard)',
    videoUrl: 'https://www.youtube.com/watch?v=f-S89Bq68L0'
  },
  {
    id: 'w4',
    title: 'Ballhandling Flow',
    phase: WarmupPhase.TEKNIK,
    duration: '5 min',
    description: 'Kombination av cirklar runt kropp, mellan ben och snabba dribblingar på stället.',
    coachingPoints: ['Blicken upp', 'Hårda dribblingar', 'Fingertoppskänsla'],
    sbbfFocus: 'Bollbekantskap',
    videoUrl: 'https://www.youtube.com/watch?v=S8pB6S7Z3C8'
  },
  {
    id: 'w5',
    title: 'Snabba fötter (Ladder)',
    phase: WarmupPhase.INTENSITET,
    duration: '2 min',
    description: 'Maximal frekvens i fötterna genom en tänkt stege eller över en linje.',
    coachingPoints: ['Korta steg', 'Armpendling', 'Andning'],
    sbbfFocus: 'Explosivitet',
    videoUrl: 'https://www.youtube.com/watch?v=A8gAP32wK4k'
  },
  {
    id: 'w6',
    title: 'SBBF Knäkontroll (Bas)',
    phase: WarmupPhase.AKTIVERING,
    duration: '5 min',
    description: 'Fokus på landningsteknik och knästabilitet. Hopp framåt, bakåt och åt sidan med fokus på att knät pekar i samma riktning som tårna.',
    coachingPoints: ['Knä över tå', 'Mjuk landning', 'Stilla höft'],
    sbbfFocus: 'Skadeprevention (SBBF Standard)',
    videoUrl: 'https://www.youtube.com/watch?v=f-S89Bq68L0'
  },
  {
    id: 'w7',
    title: 'Dribbel-kull',
    phase: WarmupPhase.PULS,
    duration: '4 min',
    description: 'Alla spelare har en boll. Man ska kulla varandra samtidigt som man behåller sin egen dribbling.',
    coachingPoints: ['Blicken upp', 'Skydda bollen', 'Snabba riktningsförändringar'],
    sbbfFocus: 'Bollkontroll & Spelförståelse',
    videoUrl: 'https://www.youtube.com/watch?v=1p_tQy2iX60'
  },
  {
    id: 'w8',
    title: 'Dynamisk Hamstring-stretch',
    phase: WarmupPhase.AKTIVERING,
    duration: '3 min',
    description: 'Gående stretch där man sträcker ut baksida lår genom att "skopa" marken med händerna vid varje steg.',
    coachingPoints: ['Rak rygg', 'Flexad fot', 'Kontrollerad rörelse'],
    sbbfFocus: 'Mobilitet',
    videoUrl: 'https://www.youtube.com/watch?v=y-wV4Venusw'
  },
  {
    id: 'w9',
    title: 'Form Shooting (Warmup)',
    phase: WarmupPhase.TEKNIK,
    duration: '5 min',
    description: 'Skott nära korgen med fokus på perfekt release och "svanhals". Ingen hopprörelse, bara arm och hand.',
    coachingPoints: ['Följ igenom', 'Hög release', 'Bollrotation'],
    sbbfFocus: 'Skott-fundament',
    videoUrl: 'https://www.youtube.com/watch?v=BnvGa0I8bMc'
  },
  {
    id: 'w10',
    title: 'Defensiv Zick-Zack',
    phase: WarmupPhase.INTENSITET,
    duration: '4 min',
    description: 'Jobba i defensiv ställning i sicksack-mönster längs planen. Fokus på snabba fötter och riktningsförändringar.',
    coachingPoints: ['Låg tyngdpunkt', 'Korsa inte fötterna', 'Händer ute'],
    sbbfFocus: 'Lateral snabbhet',
    videoUrl: 'https://www.youtube.com/watch?v=O70R86o-YTo'
  }
];

export const mockPlayers: Player[] = [
  // Startar med tom lista för en ren coach-upplevelse
];

export const mockPhases: Phase[] = [
  {
    id: 1,
    title: 'Fas 1: Fundament & Balans',
    duration: 'Vecka 1-4',
    color: 'from-orange-700 to-orange-600',
    description: 'Fokus på kroppskontroll, grundposition och bollbekantskap.',
    exercises: [
      { id: 'f1e1', title: 'Form Shooting (One Hand)', category: 'Skott', overview: { setup: "1 meter från korgen", action: "Enhandsskott utan stödhand", coachingPoint: "Frys svanhalsen" }, pedagogy: { what: "Isolera release-mekaniken", how: "Håll armbågen i 90 grader", why: "Eliminera felkällor i skottet" }, criteria: ['Armbåge in', 'Bollrotation', 'Svanhals', 'Balanserade fötter'], videoUrl: 'https://www.youtube.com/watch?v=BnvGa0I8bMc', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Basketball shooting form' },
      { id: 'f1e2', title: 'Pound Dribble (High/Low)', category: 'Dribbling', overview: { setup: "Stilla, axelbrett", action: "Dribbla bollen så hårt som möjligt", coachingPoint: "Pausa aldrig bollen" }, pedagogy: { what: "Bollkontroll och kraft", how: "Använd fingertoppar och handled", why: "Öka kontroll vid press" }, criteria: ['Blick upp', 'Dribbelkraft', 'Låg stance', 'Växla höjd'], videoUrl: 'https://www.youtube.com/watch?v=1p_tQy2iX60', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Dribbling drill' },
      { id: 'f1e3', title: 'Triple Threat Positioning', category: 'Basket-IQ', overview: { setup: "Fånga bollen på hoppstopp", action: "Hitta skott-pass-dribbel hot", coachingPoint: "Bollen vid höften" }, pedagogy: { what: "Anfallsposition", how: "Böjda knän, redo för allt", why: "Göra försvaret osäkert" }, criteria: ['Balans', 'Bollen skyddad', 'Blick mot korg', 'Snabbt fotarbete'], videoUrl: 'https://www.youtube.com/watch?v=uUshU-x_w7I', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Triple threat stance' },
      { id: 'f1e4', title: 'Ball Slaps & Circles', category: 'Dribbling', overview: { setup: "Stilla", action: "Slå på bollen, cirkulera runt midja/ben", coachingPoint: "Snabba händer" }, pedagogy: { what: "Värm upp fingertoppar", how: "Slå bollen mellan händerna", why: "Bättre touch" }, criteria: ['Tempo', 'Hårda slag', 'Full rörlighet'], videoUrl: 'https://www.youtube.com/watch?v=S8pB6S7Z3C8', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Ball handling circles' },
      { id: 'f1fys1', title: 'Wall Sits (Statisk)', category: 'Fysik', overview: { setup: "Mot vägg", action: "Sitt i 90 grader", coachingPoint: "Pressa ryggen mot väggen" }, pedagogy: { what: "Isometrisk benstyrka", how: "Håll i 45-60 sek", why: "Uthållighet i försvarsställning" }, criteria: ['90 grader vinkel', 'Rak rygg', 'Stilla fötter'], videoUrl: 'https://www.youtube.com/watch?v=y-wV4Venusw', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Wall sit exercise' },
      { id: 'f1fys2', title: 'Plank Variations', category: 'Fysik', overview: { setup: "På golvet", action: "Håll rak kropp", coachingPoint: "Spänn sätet" }, pedagogy: { what: "Core-stabilitet", how: "Växla mellan armbågar/händer", why: "Kraftöverföring i skott och hopp" }, criteria: ['Rak linje', 'Andning', 'Ingen svank'], videoUrl: 'https://www.youtube.com/watch?v=ASdVnBL2X8E', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Plank exercise' }
    ]
  },
  {
    id: 2,
    title: 'Fas 2: Passning & Lagspel',
    duration: 'Vecka 5-8',
    color: 'from-blue-700 to-blue-600',
    description: 'Bollförflyttning, kommunikation och spacing.',
    exercises: [
      { id: 'f2e1', title: 'Chest Pass (Precision)', category: 'Passningar', overview: { setup: "Parvis, 5 meter", action: "Kliv in och passa", coachingPoint: "Tummarna ner i avslut" }, pedagogy: { what: "Grundpassning", how: "Explosivt utskjut från bröstet", why: "Snabbaste sättet att flytta bollen" }, criteria: ['Stega mot mål', 'Tummarna ner', 'Träffa bröstet', 'Hårda pass'], videoUrl: 'https://www.youtube.com/watch?v=vI3zZ7qK_zI', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Chest pass' },
      { id: 'f2e2', title: 'Bounce Pass (Under försvaret)', category: 'Passningar', overview: { setup: "Med försvarare i mitten", action: "Studsa förbi händer", coachingPoint: "Studs 2/3 framåt" }, pedagogy: { what: "Passning mot press", how: "Använd vinklar", why: "Undvika steals" }, criteria: ['Låg tyngdpunkt', 'Rätt studspunkt', 'Precision'], videoUrl: 'https://www.youtube.com/watch?v=0C5l0hJ5QhQ', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Bounce pass' },
      { id: 'f2e3', title: 'Overhead Pass (Långt)', category: 'Passningar', overview: { setup: "Fullplan", action: "Passa över försvar", coachingPoint: "Släpp bollen högt" }, pedagogy: { what: "Outlet-passningar", how: "Bakom huvudet, kasta framåt", why: "Starta snabba uppspel" }, criteria: ['Kraft', 'Båge', 'Mottagningsbar'], videoUrl: 'https://www.youtube.com/watch?v=U3v4QpS4QW0', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Overhead pass' },
      { id: 'f2e4', title: 'Star Passing Drill', category: 'Passningar', overview: { setup: "5 led i stjärnform", action: "Passa och spring till nästa led", coachingPoint: "Ögonkontakt först" }, pedagogy: { what: "Lagsamverkan", how: "Konstant rörelse", why: "Värma upp beslutsfattande" }, criteria: ['Tempo', 'Röst', 'Precision'], videoUrl: 'https://www.youtube.com/watch?v=q6F9Lh_iY8Q', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Star passing drill' },
      { id: 'f2fys1', title: 'Pushups (Explosiva)', category: 'Fysik', overview: { setup: "Armhävningsposition", action: "Tryck upp snabbt", coachingPoint: "Armbågar snett bakåt" }, pedagogy: { what: "Överkroppsstyrka", how: "Kontrollerat ner, snabbt upp", why: "Passningskraft" }, criteria: ['Djup', 'Fart upp', 'Core-kontroll'], videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Pushup form' },
      { id: 'f2fys2', title: 'Medicine Ball Slams', category: 'Fysik', overview: { setup: "Stå upp, boll över huvudet", action: "Kasta bollen i golvet max", coachingPoint: "Använd hela kroppen" }, pedagogy: { what: "Explosiv kraft", how: "Kasta genom golvet", why: "Öka passningshastighet" }, criteria: ['Full sträckning', 'Kraft', 'Andning'], videoUrl: 'https://www.youtube.com/watch?v=rxV3_60p2G8', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Med ball slam' }
    ]
  },
  {
    id: 3,
    title: 'Fas 3: Layups & Avslut',
    duration: 'Vecka 9-12',
    color: 'from-emerald-700 to-emerald-600',
    description: 'Närspel och olika typer av avslut vid korgen.',
    exercises: [
      { id: 'f3e1', title: 'Mikan Drill', category: 'Layups', overview: { setup: "Under korgen", action: "Växla höger/vänster layup", coachingPoint: "Håll bollen högt" }, pedagogy: { what: "Touch och fotarbete", how: "Använd plankan varje gång", why: "Utveckla båda händerna" }, criteria: ['Hög release', 'Plankträff', 'Rytm (H-V / V-H)'], videoUrl: 'https://www.youtube.com/watch?v=UqQ-G6vU9bM', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Mikan drill' },
      { id: 'f3e2', title: 'Power Layup (Two Foot)', category: 'Layups', overview: { setup: "Från vinge", action: "Hoppa från två fötter", coachingPoint: "Skydda bollen" }, pedagogy: { what: "Starkt avslut", how: "Landning - Hopp - Avslut", why: "Absorbera kontakt" }, criteria: ['Tvåfotsupphopp', 'Bollskydd (Chin it)', 'Styrka'], videoUrl: 'https://www.youtube.com/watch?v=zD_Yv1YV-4I', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Power layup' },
      { id: 'f3e3', title: 'Eurostep Basics', category: 'Layups', overview: { setup: "Full fart mot korg", action: "Kliv snett H, sen V", coachingPoint: "Långa kliv" }, pedagogy: { what: "Undvika försvar", how: "Byt riktning i luften/stegen", why: "Gå runt försvarare i färg" }, criteria: ['Riktningsförändring', 'Balans', 'Avslutskraft'], videoUrl: 'https://www.youtube.com/watch?v=TyE9G3fW_2o', instructions: { warmup: "", main: "" , conclusion: "" }, diagramPrompt: 'Eurostep' },
      { id: 'f3e4', title: 'Reverse Layup', category: 'Layups', overview: { setup: "Baslinje-drive", action: "Avsluta på andra sidan", coachingPoint: "Använd plankan som skydd" }, pedagogy: { what: "Avancerat avslut", how: "Hoppa under korgen", why: "Lura blockare" }, criteria: ['Vinkel på release', 'Huvud upp', 'Fotarbete'], videoUrl: 'https://www.youtube.com/watch?v=4fWwQ9lBInE', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Reverse layup' },
      { id: 'f3fys1', title: 'Calf Raises (Tåhävningar)', category: 'Fysik', overview: { setup: "På ett steg", action: "Höj/sänk hälarna", coachingPoint: "Gå hela vägen upp" }, pedagogy: { what: "Underbensstyrka", how: "Långsamma repetitioner", why: "Hoppstyrka och skadeprevention" }, criteria: ['Full range of motion', 'Kontroll', 'Balans'], videoUrl: 'https://www.youtube.com/watch?v=eMTy3qylqec', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Calf raise' },
      { id: 'f3fys2', title: 'Single Leg Balance', category: 'Fysik', overview: { setup: "Stå på ett ben", action: "Blunda eller gör cirklar", coachingPoint: "Håll höften rak" }, pedagogy: { what: "Proprioception", how: "Stilla i 30 sek", why: "Stabilitet i landningar" }, criteria: ['Ingen vingling', 'Stilla core', 'Knäkontroll'], videoUrl: 'https://www.youtube.com/watch?v=f-S89Bq68L0', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Balance exercise' }
    ]
  },
  {
    id: 4,
    title: 'Fas 4: Skytte & Distans',
    duration: 'Vecka 13-16',
    color: 'from-purple-700 to-purple-600',
    description: 'Befäst skotteknik och addera rörlighet.',
    exercises: [
      { id: 'f4e1', title: 'Catch and Shoot (Spot Up)', category: 'Skott', overview: { setup: "Runt trepoängslinjen", action: "Fånga, ställ fötter, skjut", coachingPoint: "Redo händer (Target hands)" }, pedagogy: { what: "Snabbt avslut", how: "Tå mot korgen, dippa bollen", why: "Utnyttja små luckor" }, criteria: ['Fotfart', 'Händer redo', 'Båge', 'Balans'], videoUrl: 'https://www.youtube.com/watch?v=L4t3G4m3S1t', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Catch and shoot' },
      { id: 'f4e2', title: 'One-Dribble Pull-up', category: 'Skott', overview: { setup: "Topp 3p", action: "En studs, sen upphoppskott", coachingPoint: "Hårt sista studs" }, pedagogy: { what: "Skapa separation", how: "Hoppa rakt upp", why: "Göra mål när försvar stänger drive" }, criteria: ['Rytm', 'Vertikalt hopp', 'Bollstopp'], videoUrl: 'https://www.youtube.com/watch?v=Xh0Y89U2Ie8', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Pull up jumper' },
      { id: 'f4e3', title: 'Free Throw Routine', category: 'Skott', overview: { setup: "Strafflinjen", action: "Upprepa exakt samma rörelse", coachingPoint: "Andas djupt" }, pedagogy: { what: "Mental styrka och fokus", how: "Bygg en 3-sekunders rutin", why: "Gratispoäng i matchen" }, criteria: ['Samma rutin', 'Fokus', 'Svanhals'], videoUrl: 'https://www.youtube.com/watch?v=BnvGa0I8bMc', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Free throw' },
      { id: 'f4e4', title: 'Around the World', category: 'Skott', overview: { setup: "5 punkter runt korg", action: "Sätt 2 i rad för att flytta", coachingPoint: "Följ bollen med blicken" }, pedagogy: { what: "Uthållighetsskytte", how: "Förflyttning under skott", why: "Hitta vinklar" }, criteria: ['Tempo', 'Konsekvens', 'Fotarbete'], videoUrl: 'https://www.youtube.com/watch?v=5rTIdF0S22M', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Around the world drill' },
      { id: 'f4fys1', title: 'Broad Jumps (Längdhopp)', category: 'Fysik', overview: { setup: "Fri yta", action: "Hoppa så långt som möjligt", coachingPoint: "Landa mjukt" }, pedagogy: { what: "Explosiv horisontell kraft", how: "Använd armar för pendel", why: "Första steget (explosivitet)" }, criteria: ['Armpendling', 'Landa på hälarna mjukt', 'Kraft'], videoUrl: 'https://www.youtube.com/watch?v=A8gAP32wK4k', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Broad jump' },
      { id: 'f4fys2', title: 'Squat Jumps', category: 'Fysik', overview: { setup: "Axelbrett", action: "Djup knäböj till maxhopp", coachingPoint: "Explodera upp" }, pedagogy: { what: "Vertikal spänst", how: "Snabb vändning i botten", why: "Rebound-styrka" }, criteria: ['Djup', 'Höjd', 'Landning'], videoUrl: 'https://www.youtube.com/watch?v=Azl5tkCzDcc', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Squat jump' }
    ]
  },
  {
    id: 5,
    title: 'Fas 5: Defense & Returtagning',
    duration: 'Vecka 17-20',
    color: 'from-rose-700 to-rose-600',
    description: 'Stoppa motståndaren och vinn bollen tillbaka.',
    exercises: [
      { id: 'f5e1', title: 'Defensive Slide Drill', category: 'Försvar', overview: { setup: "Mellan två koner", action: "Sida till sida utan att korsa fötter", coachingPoint: "Sitt lågt" }, pedagogy: { what: "Lateral snabbhet", how: "Tryck ifrån med bakre foten", why: "Hålla sig framför motståndaren" }, criteria: ['Låg rumpa', 'Inga korsade fötter', 'Händer ute'], videoUrl: 'https://www.youtube.com/watch?v=O70R86o-YTo', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Defensive slides' },
      { id: 'f5e2', title: 'Closeout Drills', category: 'Försvar', overview: { setup: "Från färg till 3p-linje", action: "Sprinta ut, korta steg på slutet", coachingPoint: "Hand i skyttens sikte" }, pedagogy: { what: "Minska skyttens tid", how: "Choppy steps sista biten", why: "Förhindra både skott och drive" }, criteria: ['Sprintstart', 'Balans vid stopp', 'Röst (Ball!)'], videoUrl: 'https://www.youtube.com/watch?v=zD_Yv1YV-4I', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Closeout drill' },
      { id: 'f5e3', title: 'Box Out (1v1)', category: 'Returtagning', overview: { setup: "Anfallare vs Försvarare", action: "Vid skott, hitta kontakt", coachingPoint: "Sök rumpa mot lår" }, pedagogy: { what: "Vinn insidan", how: "Armar breda, flytta inte fötter", why: "Give laget fler chanser" }, criteria: ['Hitta gubben', 'Kontakt', 'Aggressivitet'], videoUrl: 'https://www.youtube.com/watch?v=0X9M1c8t1c8', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Box out' },
      { id: 'f5e4', title: 'Help Side Shell', category: 'Försvar', overview: { setup: "4v4 uppställning", action: "Flytta vid varje pass", coachingPoint: "Se boll och gubbe" }, pedagogy: { what: "Lagförsvar", how: "Stå i triangeln", why: "Stoppa layups från drives" }, criteria: ['Positionering', 'Kommunikation', 'Hjälpvilja'], videoUrl: 'https://www.youtube.com/watch?v=uOqF5O0C8O8', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Shell drill' },
      { id: 'f5fys1', title: 'Lateral Lunges', category: 'Fysik', overview: { setup: "Bred stance", action: "Gå djupt åt ena sidan", coachingPoint: "Håll hälen i marken" }, pedagogy: { what: "Sidledsstyrka", how: "Knä över tå", why: "Djupare försvarsställning" }, criteria: ['Djup', 'Rak rygg', 'Balans'], videoUrl: 'https://www.youtube.com/watch?v=TyE9G3fW_2o', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Lateral lunge' },
      { id: 'f5fys2', title: 'Burpees (Matchtempo)', category: 'Fysik', overview: { setup: "Fri yta", action: "Ner på mage till hopp", coachingPoint: "Hela vägen ner" }, pedagogy: { what: "Total uthållighet", how: "Maximalt tempo", why: "Orka försvara i fjärde perioden" }, criteria: ['Fart', 'Form', 'Andning'], videoUrl: 'https://www.youtube.com/watch?v=dZfeHe69O_I', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Burpee' }
    ]
  },
  {
    id: 6,
    title: 'Fas 6: Taktik & Spelförståelse',
    duration: 'Vecka 21-24',
    color: 'from-cyan-700 to-blue-600',
    description: 'Transition, samspel och avancerade situationer.',
    exercises: [
      { id: 'f6e1', title: '3v2 Fast Break', category: 'Transition', overview: { setup: "Fullplan", action: "Hitta öppna ytan snabbt", coachingPoint: "Bollen i mitten" }, pedagogy: { what: "Numerärt överläge", how: "Passa till kanterna om försvar stänger", why: "Enkla poäng" }, criteria: ['Breddning', 'Beslut (Pass/Skott)', 'Fart'], videoUrl: 'https://www.youtube.com/watch?v=WJq0z-bC6kw', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: '3v2 fast break' },
      { id: 'f6e2', title: 'Pick & Roll Intro', category: 'Pick & Roll', overview: { setup: "2v2", action: "Sätt skärm, dribbla tajt", coachingPoint: "Vinkla fötter mot korg" }, pedagogy: { what: "Tvåmansspel", how: "Läs försvararens position", why: "Skapa 2-mot-1 lägen" }, criteria: ['Vinkel på skärm', 'Tajthet', 'Rullning'], videoUrl: 'https://www.youtube.com/watch?v=QwErTyU1V23', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Pick and roll' },
      { id: 'f6e3', title: 'Zone Defense Entry', category: 'Taktik', overview: { setup: "5 mot 2-3 zon", action: "Flytta bollen för att flytta zon", coachingPoint: "Attackera gapen" }, pedagogy: { what: "Zonförsvar", how: "Överbelasta en sida", why: "Hitta öppna skott" }, criteria: ['Passningshastighet', 'Spacing', 'IQ'], videoUrl: 'https://www.youtube.com/watch?v=Z0nEz0nE0nE', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Zone offense' },
      { id: 'f6e4', title: 'Drive & Kick Basics', category: 'Basket-IQ', overview: { setup: "3v3", action: "Driva, locka försvar, passa ut", coachingPoint: "Passa till skytt" }, pedagogy: { what: "Skapa skott för andra", how: "Driva djupt, hoppa inte", why: "Utnyttja hjälp-försvar" }, criteria: ['Beslutsfattande', 'Passningskvalitet', 'Spacing'], videoUrl: 'https://www.youtube.com/watch?v=uUshU-x_w7I', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Drive and kick' },
      { id: 'f6fys1', title: 'Mountain Climbers', category: 'Kondition', overview: { setup: "Plankposition", action: "Spring med knäna mot bröst", coachingPoint: "Stilla höft" }, pedagogy: { what: "Högintensiv core/fys", how: "Snabb takt", why: "Matchliknande hjärtfrekvens" }, criteria: ['Tempo', 'Form', 'Uthållighet'], videoUrl: 'https://www.youtube.com/watch?v=nmwgirgXLYM', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Mountain climber' },
      { id: 'f6fys2', title: 'Shuttle Runs (17s)', category: 'Kondition', overview: { setup: "Baslinje till baslinje", action: "Spring 17 sekunder max", coachingPoint: "Toucha linjen" }, pedagogy: { what: "Mjölksyretålighet", how: "Maximal insats", why: "Slutminuterna i en match" }, criteria: ['Vändningsteknik', 'Vilja', 'Återhämtning'], videoUrl: 'https://www.youtube.com/watch?v=5yVqZL0o8VI', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Suicides drill' }
    ]
  },
  {
    id: 7,
    title: 'Fas 7: Elite Skills & Spets',
    duration: 'Vecka 25-28',
    color: 'from-indigo-700 to-purple-600',
    description: 'Specialisering och avancerade individuella drag.',
    exercises: [
      { id: 'f7e1', title: 'Step Back Jumper', category: 'Skott', overview: { setup: "1v1", action: "Driva, tryck ifrån, skjut", coachingPoint: "Separera fötterna snabbt" }, pedagogy: { what: "Elite skottkapande", how: "Använd främre fot som fjäder", why: "Få iväg skott mot bra försvar" }, criteria: ['Separation', 'Balans i landning', 'Release'], videoUrl: 'https://www.youtube.com/watch?v=U3v4QpS4QW0', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Step back jumper' },
      { id: 'f7e2', title: 'Behind Back Dribble', category: 'Dribbling', overview: { setup: "Konbana", action: "Svep bollen bakom rygg", coachingPoint: "Håll bollen under höften" }, pedagogy: { what: "Avancerat bollskydd", how: "Svepande rörelse", why: "Byta hand när front är stängd" }, criteria: ['Bollkontroll', 'Blick upp', 'Fartbevarande'], videoUrl: 'https://www.youtube.com/watch?v=1p_tQy2iX60', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Behind the back' },
      { id: 'f7e3', title: 'Floater (Tear Drop)', category: 'Layups', overview: { setup: "Vid straffområdet", action: "Hög, mjuk release", coachingPoint: "Hoppa rakt upp" }, pedagogy: { what: "Avslut mot stora spelare", how: "En-hands touch", why: "Göra poäng innan blockare hinner fram" }, criteria: ['Höjd på boll', 'Mjuk touch', 'Landning'], videoUrl: 'https://www.youtube.com/watch?v=uUshU-x_w7I', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Floater' },
      { id: 'f7e4', title: 'Advanced Crossover (Iverson)', category: 'Dribbling', overview: { setup: "Mot kon", action: "Sälj åt ena hållet, gå andra", coachingPoint: "Vänta på försvaret" }, pedagogy: { what: "Ankelsbrytare", how: "Långt kliv åt fakesidan", why: "Skapa drive-vägar" }, criteria: ['Fakespel', 'Låg tyngdpunkt', 'Fartväxling'], videoUrl: 'https://www.youtube.com/watch?v=1p_tQy2iX60', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Crossover' },
      { id: 'f7fys1', title: 'Box Jumps (Elite)', category: 'Fysik', overview: { setup: "Stabil låda", action: "Hoppa upp, landa tyst", coachingPoint: "Använd hela armrörelsen" }, pedagogy: { what: "Maximal spänst", how: "Explodera från stilla", why: "Returtagning och blockar" }, criteria: ['Hopphöjd', 'Ljudlös landning', 'Balans'], videoUrl: 'https://www.youtube.com/watch?v=A8gAP32wK4k', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Box jump' },
      { id: 'f7fys2', title: 'Plyometric Lateral Hops', category: 'Fysik', overview: { setup: "Sidledshinder", action: "Hoppa över snabbt", coachingPoint: "Minimera markkontakt" }, pedagogy: { what: "Lateral reaktivitet", how: "Studsa som en boll", why: "Sidledssnabbhet i defense" }, criteria: ['Snabbhet', 'Knästabilitet', 'Fokus'], videoUrl: 'https://www.youtube.com/watch?v=LqUeX_y9o6g', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Lateral hops' }
    ]
  },
  {
    id: 8,
    title: 'Fas 8: Game Ready & Match',
    duration: 'Vecka 29-32',
    color: 'from-slate-800 to-slate-900',
    description: 'Full tillämpning av alla färdigheter i matchlika former.',
    exercises: [
      { id: 'f8e1', title: '5v5 Full Scrimmage', category: 'Taktik', overview: { setup: "Fullplan", action: "Matchspel enligt regler", coachingPoint: "Tillämpa fas 1-7" }, pedagogy: { what: "Spelförståelse", how: "Kommunicera och rör bollen", why: "Erfarenhet under press" }, criteria: ['Samspel', 'Defensiv intensitet', 'Beslut'], videoUrl: 'https://www.youtube.com/watch?v=L4t3G4m3S1t', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Scrimmage' },
      { id: 'f8e2', title: 'Baseline Out of Bounds (BLOB)', category: 'Taktik', overview: { setup: "Under korgen", action: "Satta spel för enkla poäng", coachingPoint: "Timing i skärmar" }, pedagogy: { what: "Inkast-taktik", how: "Följ mönstret", why: "Enkla 2 poäng varje match" }, criteria: ['Timing', 'Skärmkvalitet', 'Passningssäkerhet'], videoUrl: 'https://www.youtube.com/watch?v=F7r33T44h0w', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'BLOB play' },
      { id: 'f8e3', title: 'Sideline Out of Bounds (SLOB)', category: 'Taktik', overview: { setup: "Sidlinjen", action: "Få in bollen säkert", coachingPoint: "Möt passningen" }, pedagogy: { what: "Anfallstart", how: "V-cut sen hämta bollen", why: "Undvika turnovers på inkast" }, criteria: ['V-cut', 'Target hands', 'Säkerhet'], videoUrl: 'https://www.youtube.com/watch?v=qwErTyU1V23', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'SLOB play' },
      { id: 'f8e4', title: 'Clutch Free Throws (Game Pressure)', category: 'Skott', overview: { setup: "Efter 17s löpning", action: "Sätt 2 i rad", coachingPoint: "Fokusera på andning" }, pedagogy: { what: "Press-skytte", how: "Ignorera trötthet", why: "Vinna matcher i sista sekunden" }, criteria: ['Mental styrka', 'Teknik under trötthet', 'Resultat'], videoUrl: 'https://www.youtube.com/watch?v=BnvGa0I8bMc', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Pressure shooting' },
      { id: 'f8fys1', title: 'Full Court Suicide Drills', category: 'Kondition', overview: { setup: "Baslinje", action: "Spring till linjer (FT, Mid, FT, Bas)", coachingPoint: "Explodera vid varje vändning" }, pedagogy: { what: "Maximal matchkondition", how: "Låg stance i vändning", why: "Uthållighet" }, criteria: ['Fart', 'Vändningsteknik', 'Pannben'], videoUrl: 'https://www.youtube.com/watch?v=5yVqZL0o8VI', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Suicide sprint' },
      { id: 'f8fys2', title: 'Active Recovery Flow', category: 'Fysik', overview: { setup: "Fri yta", action: "Yoga-liknande stretch", coachingPoint: "Långa andetag" }, pedagogy: { what: "Återhämtning", how: "Mjuka rörelser", why: "Förhindra stelhet efter säsong" }, criteria: ['Lugn', 'Rörlighet', 'Andning'], videoUrl: 'https://www.youtube.com/watch?v=uOqF5O0C8O8', instructions: { warmup: "", main: "", conclusion: "" }, diagramPrompt: 'Stretching' }
    ]
  }
];

export const mockSessions: TrainingSession[] = [];
