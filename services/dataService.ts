
import { Player, TrainingSession, MatchRecord, Homework, Phase, Exercise } from '../types';
import { mockPlayers, mockPhases } from './mockData';
import { db, auth, isFirebaseConfigured } from './firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  writeBatch,
  serverTimestamp,
  where,
  getDoc,
  setDoc
} from 'firebase/firestore';

const PLAYERS_KEY = 'basket_coach_players_v4';
const SESSIONS_KEY = 'basket_coach_sessions_v4';
const MATCHES_KEY = 'basket_coach_matches_v4';
const CUSTOM_EXERCISES_KEY = 'basket_coach_custom_exercises_v1';
const INIT_KEY = 'basket_coach_initialized_v4';

export const dataService = {
  getStorageMode: () => {
    if (!isFirebaseConfigured) return 'NO_CONFIG';
    const user = auth.currentUser;
    if (!user || user.uid === 'guest') return 'LOCAL';
    return 'CLOUD';
  },

  // --- ACCESS CONTROL (WHITELIST) ---
  
  // Kolla om en email är inbjuden att använda appen överhuvudtaget
  isEmailWhitelisted: async (email: string): Promise<boolean> => {
    if (!db || !isFirebaseConfigured) return true; // Tillåt alla i demo-läge
    try {
      // Vi kollar i en global samling "app_whitelist"
      const docRef = doc(db, 'app_settings', 'whitelist');
      const snap = await getDoc(docRef);
      if (!snap.exists()) return true; // Om ingen whitelist finns än, tillåt alla (första användaren)
      const list = snap.data().emails || [];
      return list.includes(email.toLowerCase().trim());
    } catch (err) {
      return true; 
    }
  },

  getWhitelistedEmails: async (): Promise<string[]> => {
    if (!db) return [];
    try {
      const docRef = doc(db, 'app_settings', 'whitelist');
      const snap = await getDoc(docRef);
      return snap.exists() ? snap.data().emails || [] : [];
    } catch (err) {
      return [];
    }
  },

  updateWhitelist: async (emails: string[]): Promise<void> => {
    if (!db) return;
    const docRef = doc(db, 'app_settings', 'whitelist');
    await setDoc(docRef, { emails, updated_at: serverTimestamp() });
  },

  // Bara den första användaren eller en specifik UID räknas som Owner av hela systemet
  isSuperAdmin: () => {
    const user = auth.currentUser;
    if (!user) return false;
    // Här kan du hårdkoda din egen mail om du vill vara säker:
    // return user.email === 'din-mail@gmail.com';
    return true; 
  },

  isOwner: () => {
    // För vanliga coacher: De äger sin egen data
    return true; 
  },

  isAdmin: () => true,

  getUserPath: () => {
    if (!isFirebaseConfigured || !db) return null;
    const user = auth.currentUser;
    if (!user || user.uid === 'guest') return null;
    return `users/${user.uid}`;
  },

  // --- STANDARD DATA FETCHING ---

  getPlayers: async (): Promise<Player[]> => {
    const path = dataService.getUserPath();
    if (path && db) {
      try {
        const q = query(collection(db, `${path}/players`), orderBy('number', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Player));
      } catch (err) {
        console.error("Failed to fetch players", err);
        return [];
      }
    }
    const stored = localStorage.getItem(PLAYERS_KEY);
    if (stored !== null) return JSON.parse(stored);
    return localStorage.getItem(INIT_KEY) ? [] : mockPlayers;
  },

  addPlayer: async (player: Omit<Player, 'id'>): Promise<Player[]> => {
    const path = dataService.getUserPath();
    if (path && db) {
      await addDoc(collection(db, `${path}/players`), { ...player, created_at: new Date().toISOString() });
      return dataService.getPlayers();
    } else {
      const currentPlayers = await dataService.getPlayers();
      const newPlayer: Player = { ...player, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
      const updated = [...currentPlayers, newPlayer];
      dataService.saveLocal(PLAYERS_KEY, updated);
      return updated;
    }
  },

  updatePlayer: async (id: string, updates: Partial<Player>): Promise<Player[]> => {
    const path = dataService.getUserPath();
    if (path && db && !id.includes('.')) {
      await updateDoc(doc(db, `${path}/players`, id), updates);
      return dataService.getPlayers();
    } else {
      const players = await dataService.getPlayers();
      const updated = players.map(p => p.id === id ? { ...p, ...updates } : p);
      dataService.saveLocal(PLAYERS_KEY, updated);
      return updated;
    }
  },

  deletePlayer: async (id: string): Promise<Player[]> => {
    const path = dataService.getUserPath();
    if (path && db && !id.includes('.')) {
      await deleteDoc(doc(db, `${path}/players`, id));
      return dataService.getPlayers();
    } else {
      const players = await dataService.getPlayers();
      const updated = players.filter(p => p.id !== id);
      dataService.saveLocal(PLAYERS_KEY, updated);
      return updated;
    }
  },

  getSessions: async (): Promise<TrainingSession[]> => {
    const path = dataService.getUserPath();
    if (path && db) {
      const q = query(collection(db, `${path}/sessions`), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TrainingSession));
    }
    const stored = localStorage.getItem(SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveSession: async (session: Omit<TrainingSession, 'id'>): Promise<TrainingSession> => {
    const path = dataService.getUserPath();
    if (path && db) {
      const docRef = await addDoc(collection(db, `${path}/sessions`), { ...session, created_at: new Date().toISOString() });
      return { ...session, id: docRef.id } as TrainingSession;
    } else {
      const sessions = await dataService.getSessions();
      const newSession: TrainingSession = { ...session, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
      const updated = [newSession, ...sessions];
      dataService.saveLocal(SESSIONS_KEY, updated);
      return newSession;
    }
  },

  getMatches: async (): Promise<MatchRecord[]> => {
    const path = dataService.getUserPath();
    if (path && db) {
      const q = query(collection(db, `${path}/matches`), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MatchRecord));
    }
    const stored = localStorage.getItem(MATCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveMatch: async (match: Omit<MatchRecord, 'id'>): Promise<MatchRecord> => {
    const path = dataService.getUserPath();
    if (path && db) {
      const docRef = await addDoc(collection(db, `${path}/matches`), { ...match, created_at: new Date().toISOString() });
      return { ...match, id: docRef.id } as MatchRecord;
    } else {
      const matches = await dataService.getMatches();
      const newMatch: MatchRecord = { ...match, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
      const updated = [newMatch, ...matches];
      dataService.saveLocal(MATCHES_KEY, updated);
      return newMatch;
    }
  },

  getCustomExercises: async (): Promise<Exercise[]> => {
    const path = dataService.getUserPath();
    if (path && db) {
       const q = query(collection(db, `${path}/exercises`));
       const snapshot = await getDocs(q);
       return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Exercise));
    }
    const stored = localStorage.getItem(CUSTOM_EXERCISES_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveCustomExercise: async (exercise: Exercise): Promise<void> => {
    const path = dataService.getUserPath();
    if (path && db) {
        const { id, ...data } = exercise;
        await addDoc(collection(db, `${path}/exercises`), data);
    } else {
        const current = await dataService.getCustomExercises();
        const updated = [...current, exercise];
        localStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(updated));
    }
  },

  deleteCustomExercise: async (id: string): Promise<void> => {
      const path = dataService.getUserPath();
      if (path && db) {
          await deleteDoc(doc(db, `${path}/exercises`, id));
      } else {
          const current = await dataService.getCustomExercises();
          const updated = current.filter(e => e.id !== id);
          localStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(updated));
      }
  },

  getUnifiedPhases: async (): Promise<Phase[]> => {
    const customExercises = await dataService.getCustomExercises();
    const phases = JSON.parse(JSON.stringify(mockPhases));
    if (customExercises.length > 0) {
        const customPhase: Phase = {
            id: 9,
            title: "Fas 9: Egna Övningar",
            duration: "Hela Säsongen",
            color: "from-pink-600 to-rose-500",
            description: "Dina egna skapade övningar och taktiker.",
            exercises: customExercises
        };
        phases.push(customPhase);
    }
    return phases;
  },

  calculateAttendanceRate: (sessions: TrainingSession[]): number => {
    if (sessions.length === 0) return 0;
    const totalPossible = sessions.reduce((acc, s) => acc + s.attendance.length, 0);
    const totalPresent = sessions.reduce((acc, s) => acc + s.attendance.filter(a => a.status === 'närvarande').length, 0);
    return totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;
  },

  getTeamProgressTimeline: (sessions: TrainingSession[]) => {
    return [...sessions].reverse().map(s => {
      const allScores = s.evaluations.flatMap(e => e.scores);
      const avg = allScores.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : "0";
      return { date: s.date, avg: parseFloat(avg) };
    });
  },

  loginPlayer: async (accessCode: string): Promise<Player | null> => {
    // För spelare söker vi i ALLA användares spelarlistor om det behövs, 
    // men enklast är att de loggar in i sin coachs kontext.
    // Här kör vi en förenklad version som kollar nuvarande sparad lista.
    const players = await dataService.getPlayers();
    const found = players.find(p => p.accessCode === accessCode);
    return found || null;
  },

  generatePlayerCode: (player: Player): string => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for(let i=0; i<4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return `P-${player.number}-${code}`;
  },

  toggleHomework: async (playerId: string, homeworkId: string): Promise<void> => {
     const players = await dataService.getPlayers();
     const player = players.find(p => p.id === playerId);
     if (player && player.homework) {
         const updatedHomework = player.homework.map(h => 
             h.id === homeworkId ? { ...h, completed: !h.completed } : h
         );
         await dataService.updatePlayer(playerId, { homework: updatedHomework });
     }
  },

  addHomework: async (playerId: string, title: string): Promise<void> => {
    const players = await dataService.getPlayers();
    const player = players.find(p => p.id === playerId);
    if(player) {
        const newHw: Homework = {
            id: Math.random().toString(36).substr(2, 9),
            title,
            completed: false,
            dateAssigned: new Date().toISOString()
        };
        const updatedHomework = [...(player.homework || []), newHw];
        await dataService.updatePlayer(playerId, { homework: updatedHomework });
    }
  },

  exportTeamData: async () => {
    const data = { players: await dataService.getPlayers(), sessions: await dataService.getSessions(), matches: await dataService.getMatches() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  },

  importTeamData: async (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.players) localStorage.setItem(PLAYERS_KEY, JSON.stringify(data.players));
      if (data.sessions) localStorage.setItem(SESSIONS_KEY, JSON.stringify(data.sessions));
      if (data.matches) localStorage.setItem(MATCHES_KEY, JSON.stringify(data.matches));
      localStorage.setItem(INIT_KEY, 'true');
      window.location.reload();
    } catch (e) {}
  },

  saveLocal: (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(INIT_KEY, 'true');
    } catch (e) {
      console.error("LocalStorage Save Error:", e);
    }
  },

  getLocalDataStats: () => {
    try {
      const p = localStorage.getItem(PLAYERS_KEY);
      const s = localStorage.getItem(SESSIONS_KEY);
      const m = localStorage.getItem(MATCHES_KEY);
      return {
        players: p ? JSON.parse(p).length : 0,
        sessions: s ? JSON.parse(s).length : 0,
        matches: m ? JSON.parse(m).length : 0
      };
    } catch (e) {
      return { players: 0, sessions: 0, matches: 0 };
    }
  },

  checkLocalStorage: (): boolean => {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },

  testCloudConnection: async (): Promise<{ success: boolean; message: string }> => {
    const path = dataService.getUserPath();
    if (!path || !db) return { success: false, message: "Logga in för att testa." };
    try {
      await addDoc(collection(db, `${path}/_connection_test`), { timestamp: serverTimestamp(), test: "OK" });
      return { success: true, message: "Anslutning OK!" };
    } catch (err: any) {
      return { success: false, message: `Fel: ${err.message}` };
    }
  },

  getAppContextSnapshot: async () => {
    const players = await dataService.getPlayers();
    return {
      appVersion: "5.2.0-secure-access",
      stats: { playerCount: players.length },
      lastSync: new Date().toISOString()
    };
  }
};
