
import { db, auth } from './firebase';
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc,
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { LiveMatchData, Player } from '../types';

export const liveMatchService = {
  startMatch: async (homeName: string, awayName: string, players: Player[]): Promise<string> => {
    if (!db || !auth.currentUser) throw new Error("Not authenticated");
    
    const coachId = auth.currentUser.uid;
    const matchId = `live_${coachId}`;
    
    const initialPlayerFouls: Record<string, number> = {};
    const initialPlayerPoints: Record<string, number> = {};
    players.forEach(p => {
      initialPlayerFouls[p.id] = 0;
      initialPlayerPoints[p.id] = 0;
    });

    const matchData: LiveMatchData = {
      id: matchId,
      coachId,
      homeName,
      awayName,
      homeScore: 0,
      awayScore: 0,
      period: 1,
      homeFouls: 0,
      awayFouls: 0,
      homeTimeouts: 3,
      awayTimeouts: 3,
      playerFouls: initialPlayerFouls,
      playerPoints: initialPlayerPoints,
      status: 'active',
      lastUpdated: new Date().toISOString()
    };

    await setDoc(doc(db, 'live_matches', matchId), {
      ...matchData,
      serverTime: serverTimestamp()
    });

    return matchId;
  },

  subscribeToMatch: (matchId: string, callback: (data: LiveMatchData) => void) => {
    if (!db) return () => {};
    const docRef = doc(db, 'live_matches', matchId);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as LiveMatchData);
      }
    });
  },

  updateMatch: async (matchId: string, updates: Partial<LiveMatchData>) => {
    if (!db) return;
    const docRef = doc(db, 'live_matches', matchId);
    await updateDoc(docRef, {
      ...updates,
      lastUpdated: new Date().toISOString()
    });
  },

  finishMatch: async (matchId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'live_matches', matchId));
  }
};
