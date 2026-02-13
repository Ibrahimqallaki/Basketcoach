
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
  where
} from 'firebase/firestore';

const PLAYERS_KEY = 'basket_coach_players_v4';
const SESSIONS_KEY = 'basket_coach_sessions_v4';
const MATCHES_KEY = 'basket_coach_matches_v4';
const CUSTOM_EXERCISES_KEY = 'basket_coach_custom_exercises_v1';
const INIT_KEY = 'basket_coach_initialized_v4';

// Helper to ensure players persist on first save in local mode
const ensurePlayersPersisted = () => {
  // Fix: Check for !auth.currentUser as well to cover uninitialized auth state which defaults to local
  if (!isFirebaseConfigured || !auth.currentUser || auth.currentUser.uid === 'guest') {
    if (localStorage.getItem(PLAYERS_KEY) === null) {
      localStorage.setItem(PLAYERS_KEY, JSON.stringify(mockPlayers));
    }
  }
};

export const dataService = {
  getStorageMode: () => {
    if (!isFirebaseConfigured) return 'NO_CONFIG';
    const user = auth.currentUser;
    if (!user || user.uid === 'guest') return 'LOCAL';
    return 'CLOUD';
  },

  getAppContextSnapshot: async () => {
    const players = await dataService.getPlayers();
    const sessions = await dataService.getSessions();
    const matches = await dataService.getMatches();
    
    return {
      appVersion: "Säsong 25/26-production",
      stats: {
        playerCount: players.length,
        sessionCount: sessions.length,
        matchCount: matches.length
      },
      lastSync: new Date().toISOString(),
      schema: "v4-async-local-storage",
      storageMode: dataService.getStorageMode(),
      environment: window.location.hostname
    };
  },

  getUserPath: () => {
    if (!isFirebaseConfigured || !db) return null;
    const user = auth.currentUser;
    return (user && user.uid !== 'guest') ? `users/${user.uid}` : null;
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

  saveLocal: (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(INIT_KEY, 'true');
    } catch (e) {
      console.error("LocalStorage Save Error:", e);
    }
  },

  testCloudConnection: async (): Promise<{ success: boolean; message: string }> => {
    const path = dataService.getUserPath();
    if (!path || !db) return { success: false, message: "Logga in för att testa molnet." };
    
    try {
      const testRef = collection(db, `${path}/_connection_test`);
      await addDoc(testRef, { timestamp: serverTimestamp(), test: "OK" });
      return { success: true, message: "Firestore-anslutning OK!" };
    } catch (err: any) {
      return { success: false, message: `Fel vid moln-skrivning: ${err.message}` };
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

  migrateLocalToCloud: async () => {
    const path = dataService.getUserPath();
    if (!path || !db) throw new Error("Logga in för att migrera.");

    try {
      const pData = localStorage.getItem(PLAYERS_KEY);
      const players: Player[] = pData ? JSON.parse(pData) : [];

      if (players.length === 0) return true;

      const batch = writeBatch(db);
      players.forEach(p => {
        const pRef = doc(collection(db, `${path}/players`));
        const { id, ...rest } = p;
        batch.set(pRef, { ...rest, migrated_at: new Date().toISOString() });
      });
      
      await batch.commit();
      localStorage.removeItem(PLAYERS_KEY);
      localStorage.setItem(INIT_KEY, 'true');
      return true;
    } catch (e) {
      console.error("Migration failed:", e);
      throw e;
    }
  },

  // --- CUSTOM EXERCISES ---
  
  getCustomExercises: async (): Promise<Exercise[]> => {
    const path = dataService.getUserPath();
    // For now, keep custom exercises local or cloud based on simple check
    // Ideally, these should also go to cloud, but let's start with LocalStorage for simplicity/MVP
    // unless cloud path is active.
    
    if (path && db) {
       try {
         const q = query(collection(db, `${path}/exercises`));
         const snapshot = await getDocs(q);
         return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Exercise));
       } catch (err) {
         console.warn("Could not fetch custom exercises from cloud", err);
         return [];
       }
    }

    const stored = localStorage.getItem(CUSTOM_EXERCISES_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveCustomExercise: async (exercise: Exercise): Promise<void> => {
    const path = dataService.getUserPath();
    if (path && db) {
        // Remove ID from data if it exists to let Firestore handle it or use setDoc
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

  // Merges built-in mock phases with custom exercises
  getUnifiedPhases: async (): Promise<Phase[]> => {
    const customExercises = await dataService.getCustomExercises();
    
    // Deep copy mock phases to avoid mutating original
    const phases = JSON.parse(JSON.stringify(mockPhases));

    if (customExercises.length > 0) {
        // Strategy: We can either add them to specific phases if we had a 'phaseId' in Exercise
        // OR simpler: Add them all to a "Custom / Egna" Phase or append to Phase 1-8 based on complexity.
        // Let's create a "Fas 9: Egna Övningar" for now to make them distinct, 
        // OR append them to Phase 8 if no phase specified.
        
        // Let's try appending them to the first phase for now, or a new phase.
        // Better: Let the user decide phase? For MVP, let's put them in a new Phase 9.
        
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

  // --- PLAYER LOGIN LOGIC ---
  loginPlayer: async (accessCode: string): Promise<Player | null> => {
    // 1. Try Cloud
    if (db && isFirebaseConfigured) {
        // Query ALL users' player collections to find the code.
        // NOTE: In a real production app with strict rules, this would require a Collection Group query
        // or a dedicated 'public_player_codes' collection. 
        // For this architecture, we will attempt to find the player within the current setup if we can.
        // Limitation: If not logged in as coach, we can't search other users' subcollections easily without Collection Groups.
        // FALLBACK: For this prototype, we assume the coach is using the device or it uses LocalStorage for demo.
    }

    // 2. Local Storage Search (Simpler for Demo/MVP)
    const stored = localStorage.getItem(PLAYERS_KEY);
    const players: Player[] = stored ? JSON.parse(stored) : mockPlayers;
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

  // --- EXISTING METHODS ---

  getPlayers: async (): Promise<Player[]> => {
    const path = dataService.getUserPath();
    if (path && db) {
      try {
        const q = query(collection(db, `${path}/players`), orderBy('number', 'asc'));
        const snapshot = await getDocs(q);
        // Strictly return cloud data if in cloud mode. Do not fallback to local storage.
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Player));
      } catch (err) {
        console.error("Failed to fetch players from cloud", err);
        // Return empty array on error to prevent showing inconsistent guest data
        return [];
      }
    }
    const stored = localStorage.getItem(PLAYERS_KEY);
    if (stored !== null) return JSON.parse(stored);
    return localStorage.getItem(INIT_KEY) ? [] : mockPlayers;
  },

  addPlayer: async (player: Omit<Player, 'id'>): Promise<Player[]> => {
    // Optimistic update for local view if needed, but primarily source of truth depends on mode.
    // For cloud mode, we re-fetch or assume consistency.
    // Here we maintain the pattern: write to source, then return updated list.
    
    const path = dataService.getUserPath();
    if (path && db) {
      try { 
        await addDoc(collection(db, `${path}/players`), { ...player, created_at: new Date().toISOString() });
        // Fetch fresh to ensure sync
        return dataService.getPlayers();
      } catch (err) {
        console.error("Cloud save failed", err);
        throw err;
      }
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
    if (path && db && !id.includes('.')) { // Cloud IDs are usually not dot-separated (local IDs might be?)
      try { 
        await updateDoc(doc(db, `${path}/players`, id), updates);
        return dataService.getPlayers();
      } catch (e) {
        console.error("Cloud update failed", e);
        throw e;
      }
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
      try { 
        await deleteDoc(doc(db, `${path}/players`, id));
        return dataService.getPlayers();
      } catch (e) {
        console.error("Cloud delete failed", e);
        throw e;
      }
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
      try {
        const q = query(collection(db, `${path}/sessions`), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TrainingSession));
      } catch (e) {
        console.error("Failed to fetch sessions from cloud", e);
        return [];
      }
    }
    const stored = localStorage.getItem(SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveSession: async (session: Omit<TrainingSession, 'id'>): Promise<TrainingSession> => {
    const path = dataService.getUserPath();
    if (path && db) {
      try { 
        const docRef = await addDoc(collection(db, `${path}/sessions`), { ...session, created_at: new Date().toISOString() });
        return { ...session, id: docRef.id } as TrainingSession;
      } catch (e) {
        console.error("Cloud save session failed", e);
        throw e;
      }
    } else {
      // Fix: Ensure default players are saved before saving session to prevent data loss on next reload
      ensurePlayersPersisted();
      
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
      try {
        const q = query(collection(db, `${path}/matches`), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MatchRecord));
      } catch (e) {
        console.error("Failed to fetch matches from cloud", e);
        return [];
      }
    }
    const stored = localStorage.getItem(MATCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveMatch: async (match: Omit<MatchRecord, 'id'>): Promise<MatchRecord> => {
    const path = dataService.getUserPath();
    if (path && db) {
      try { 
        const docRef = await addDoc(collection(db, `${path}/matches`), { ...match, created_at: new Date().toISOString() });
        return { ...match, id: docRef.id } as MatchRecord;
      } catch (e) {
        console.error("Cloud save match failed", e);
        throw e;
      }
    } else {
      // Fix: Ensure default players are saved before saving match
      ensurePlayersPersisted();

      const matches = await dataService.getMatches();
      const newMatch: MatchRecord = { ...match, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
      const updated = [newMatch, ...matches];
      dataService.saveLocal(MATCHES_KEY, updated);
      return newMatch;
    }
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

  getTeamInsights: (sessions: TrainingSession[]) => {
    if (sessions.length < 2) return ["Fortsätt träna för att se insikter.", "Fokusera på Basketens ABC."];
    return ["Laget visar en positiv trend.", "Fler bedömningar behövs för djupare analys."];
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
  }
};
