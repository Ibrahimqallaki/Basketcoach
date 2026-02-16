
import { Player, TrainingSession, MatchRecord, Homework, Phase, Exercise, AppTicket, TicketStatus } from '../types';
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
  serverTimestamp,
  getDoc,
  setDoc,
  where,
  collectionGroup,
  limit
} from 'firebase/firestore';

const PLAYERS_KEY = 'basket_coach_players_v4';
const SESSIONS_KEY = 'basket_coach_sessions_v4';
const MATCHES_KEY = 'basket_coach_matches_v4';
const CUSTOM_EXERCISES_KEY = 'basket_coach_custom_exercises_v1';
const INIT_KEY = 'basket_coach_initialized_v4';

const SUPER_ADMIN_EMAIL = "Ibrahim.qallaki@gmail.com"; 

export const dataService = {
  getStorageMode: () => {
    if (!isFirebaseConfigured) return 'NO_CONFIG';
    const user = auth.currentUser;
    if (!user || user.uid === 'guest') return 'LOCAL';
    return 'CLOUD';
  },

  generateSecureCode: (playerNumber: number | string) => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomPart = "";
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `P-${playerNumber}-${randomPart}`;
  },

  isEmailWhitelisted: async (email: string): Promise<boolean> => {
    if (!db || !isFirebaseConfigured) return true;
    try {
      const lowerEmail = email.toLowerCase().trim();
      if (lowerEmail === SUPER_ADMIN_EMAIL.toLowerCase()) return true;

      const docRef = doc(db, 'app_settings', 'whitelist');
      const snap = await getDoc(docRef);
      if (!snap.exists()) return false; 
      const list = snap.data().emails || [];
      return list.includes(lowerEmail);
    } catch (err) {
      return false; 
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
    if (!db || !dataService.isSuperAdmin()) return;
    const docRef = doc(db, 'app_settings', 'whitelist');
    await setDoc(docRef, { emails, updated_at: serverTimestamp() }, { merge: true });
  },

  isSuperAdmin: () => {
    const user = auth.currentUser;
    if (!user) return false;
    return user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  },

  getUserPath: () => {
    if (!isFirebaseConfigured || !db) return null;
    const user = auth.currentUser;
    if (!user || user.uid === 'guest' || user.isAnonymous) return null;
    return `users/${user.uid}`;
  },

  getPlayers: async (coachId?: string): Promise<Player[]> => {
    const path = coachId ? `users/${coachId}` : dataService.getUserPath();
    if (path && db) {
      try {
        const q = query(collection(db, `${path}/players`), orderBy('number', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Player));
      } catch (err) {
        console.error("Firestore read error (players):", err);
        return [];
      }
    }
    const stored = localStorage.getItem(PLAYERS_KEY);
    return stored ? JSON.parse(stored) : mockPlayers;
  },

  addPlayer: async (player: Omit<Player, 'id'>): Promise<Player[]> => {
    const path = dataService.getUserPath();
    if (path && db) {
      await addDoc(collection(db, `${path}/players`), { ...player, created_at: new Date().toISOString() });
      return dataService.getPlayers();
    } else {
      const current = await dataService.getPlayers();
      const newP: Player = { ...player, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
      const updated = [...current, newP];
      dataService.saveLocal(PLAYERS_KEY, updated);
      return updated;
    }
  },

  updatePlayer: async (id: string, updates: Partial<Player>): Promise<Player[]> => {
    const path = dataService.getUserPath();
    if (path && db) {
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
    if (path && db) {
      await deleteDoc(doc(db, `${path}/players`, id));
      return dataService.getPlayers();
    } else {
      const players = await dataService.getPlayers();
      const updated = players.filter(p => p.id !== id);
      dataService.saveLocal(PLAYERS_KEY, updated);
      return updated;
    }
  },

  getSessions: async (coachId?: string): Promise<TrainingSession[]> => {
    const path = coachId ? `users/${coachId}` : dataService.getUserPath();
    if (path && db) {
      try {
        const q = query(collection(db, `${path}/sessions`), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TrainingSession));
      } catch (err) {
          console.error("Firestore read error (sessions):", err);
          return [];
      }
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
      const newS: TrainingSession = { ...session, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
      dataService.saveLocal(SESSIONS_KEY, [newS, ...sessions]);
      return newS;
    }
  },

  getMatches: async (coachId?: string): Promise<MatchRecord[]> => {
    const path = coachId ? `users/${coachId}` : dataService.getUserPath();
    if (path && db) {
      try {
        const q = query(collection(db, `${path}/matches`), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MatchRecord));
      } catch (err) {
        console.error("Firestore read error (matches):", err);
        return [];
      }
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
      const newM: MatchRecord = { ...match, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
      dataService.saveLocal(MATCHES_KEY, [newM, ...matches]);
      return newM;
    }
  },

  deleteMatch: async (id: string): Promise<MatchRecord[]> => {
    const path = dataService.getUserPath();
    if (path && db) {
      await deleteDoc(doc(db, `${path}/matches`, id));
      return dataService.getMatches();
    } else {
      const matches = await dataService.getMatches();
      const updated = matches.filter(m => m.id !== id);
      dataService.saveLocal(MATCHES_KEY, updated);
      return updated;
    }
  },

  // TICKET SYSTEM (FEEDBACK LOOP)
  createTicket: async (ticket: Omit<AppTicket, 'id' | 'status' | 'createdAt' | 'appVersion' | 'technicalInfo'>): Promise<void> => {
    if (!isFirebaseConfigured || !db) return;
    const colRef = collection(db, 'app_tickets');
    await addDoc(colRef, {
      ...ticket,
      status: 'backlog',
      createdAt: new Date().toISOString(),
      appVersion: '5.7.0',
      technicalInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform
      }
    });
  },

  getTickets: async (): Promise<AppTicket[]> => {
    if (!isFirebaseConfigured || !db) return [];
    try {
      const user = auth.currentUser;
      const colRef = collection(db, 'app_tickets');
      
      let q;
      if (dataService.isSuperAdmin()) {
          // FIX: Tog bort orderBy även här för att slippa index-krav för admin
          q = query(colRef, limit(200)); 
      } else if (user) {
          // Spelare hämtar sina egna
          q = query(colRef, where('userId', '==', user.uid));
      } else {
          return [];
      }

      const snap = await getDocs(q);
      const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppTicket));
      
      // Sortera manuellt i minnet (nyaste överst)
      return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    } catch (err: any) {
      console.warn("Ticket fetch error:", err.code, err.message);
      if (err.message?.includes('index')) {
          throw new Error("MISSING_INDEX");
      }
      if (err.code === 'permission-denied') {
          throw new Error("ACCESS_DENIED");
      }
      return [];
    }
  },

  updateTicketStatus: async (ticketId: string, status: TicketStatus): Promise<void> => {
    if (!isFirebaseConfigured || !db || !dataService.isSuperAdmin()) return;
    const docRef = doc(db, 'app_tickets', ticketId);
    await updateDoc(docRef, { status });
  },

  deleteTicket: async (ticketId: string): Promise<void> => {
    if (!isFirebaseConfigured || !db || !dataService.isSuperAdmin()) return;
    await deleteDoc(doc(db, 'app_tickets', ticketId));
  },

  getCustomExercises: async (): Promise<Exercise[]> => {
    const path = dataService.getUserPath();
    if (path && db) {
      try {
        const q = query(collection(db, `${path}/custom_exercises`), orderBy('title', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Exercise));
      } catch (err) {
        return [];
      }
    }
    const stored = localStorage.getItem(CUSTOM_EXERCISES_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveCustomExercise: async (exercise: Exercise): Promise<Exercise[]> => {
    const path = dataService.getUserPath();
    if (path && db) {
      await setDoc(doc(db, `${path}/custom_exercises`, exercise.id), exercise);
      return dataService.getCustomExercises();
    } else {
      const current = await dataService.getCustomExercises();
      const updated = [...current, exercise];
      dataService.saveLocal(CUSTOM_EXERCISES_KEY, updated);
      return updated;
    }
  },

  deleteCustomExercise: async (id: string): Promise<Exercise[]> => {
    const path = dataService.getUserPath();
    if (path && db) {
      await deleteDoc(doc(db, `${path}/custom_exercises`, id));
      return dataService.getCustomExercises();
    } else {
      const current = await dataService.getCustomExercises();
      const updated = current.filter(ex => ex.id !== id);
      dataService.saveLocal(CUSTOM_EXERCISES_KEY, updated);
      return updated;
    }
  },

  getUnifiedPhases: async (): Promise<Phase[]> => {
    const custom = await dataService.getCustomExercises();
    const phases = JSON.parse(JSON.stringify(mockPhases));
    if (custom.length > 0) {
        phases.push({
            id: 9,
            title: "Egna Övningar",
            duration: "Säsong",
            color: "from-indigo-600 to-blue-500",
            description: "Dina skräddarsydda övningar.",
            exercises: custom
        });
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

  loginPlayer: async (accessCode: string): Promise<{ player: Player, coachId: string } | null> => {
    const cleanCode = accessCode.trim().toUpperCase();
    
    if (isFirebaseConfigured && db) {
      try {
        const playersRef = collectionGroup(db, 'players');
        const q = query(playersRef, where('accessCode', '==', cleanCode));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const d = snapshot.docs[0];
          const pathParts = d.ref.path.split('/');
          const coachId = pathParts[1]; 
          return { 
            player: { id: d.id, ...d.data() } as Player, 
            coachId 
          };
        }
      } catch (err: any) {
        console.warn("Player search index status:", err.code, err.message);
        if (err.code === 'permission-denied') {
            throw new Error("ACCESS_DENIED");
        }
        if (err.code === 'failed-precondition') {
            if (err.message.includes('index is not ready yet')) {
                throw new Error("INDEX_BUILDING");
            }
            throw new Error("MISSING_INDEX");
        }
        throw err;
      }
    }

    const players = await dataService.getPlayers();
    const localPlayer = players.find(p => p.accessCode?.trim().toUpperCase() === cleanCode);
    if (localPlayer) {
        return { player: localPlayer, coachId: 'guest' };
    }
    return null;
  },

  toggleHomework: async (playerId: string, homeworkId: string): Promise<void> => {
     const players = await dataService.getPlayers();
     const player = players.find(p => p.id === playerId);
     if (player && player.homework) {
         const updated = player.homework.map(h => h.id === homeworkId ? { ...h, completed: !h.completed } : h);
         await dataService.updatePlayer(playerId, { homework: updated });
     }
  },

  addHomework: async (playerId: string, title: string): Promise<void> => {
    const players = await dataService.getPlayers();
    const player = players.find(p => p.id === playerId);
    if(player) {
        const newHw = { id: Math.random().toString(36).substr(2, 9), title, completed: false, dateAssigned: new Date().toISOString() };
        await dataService.updatePlayer(playerId, { homework: [...(player.homework || []), newHw] });
    }
  },

  exportTeamData: async () => {
    const data = { players: await dataService.getPlayers(), sessions: await dataService.getSessions(), matches: await dataService.getMatches() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `basketcoach_backup_${new Date().toISOString().split('T')[0]}.json`;
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
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(INIT_KEY, 'true');
  },

  getLocalDataStats: () => {
    const p = localStorage.getItem(PLAYERS_KEY);
    const s = localStorage.getItem(SESSIONS_KEY);
    return {
      players: p ? JSON.parse(p).length : 0,
      sessions: s ? JSON.parse(s).length : 0
    };
  },

  getAppContextSnapshot: async () => {
    const players = await dataService.getPlayers();
    return {
      version: "5.7.0",
      playerCount: players.length,
      timestamp: new Date().toISOString()
    };
  }
};
