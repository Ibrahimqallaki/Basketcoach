
export enum View {
  DASHBOARD = 'DASHBOARD',
  ROSTER = 'ROSTER',
  PLAN = 'PLAN',
  TRAINING = 'TRAINING',
  MATCH_EVAL = 'MATCH_EVAL',
  VIDEO_ANALYSIS = 'VIDEO_ANALYSIS',
  AI_COACH = 'AI_COACH',
  TOOLS = 'TOOLS',
  AI_STUDIO = 'AI_STUDIO',
  ABOUT = 'ABOUT',
  ACCOUNT = 'ACCOUNT',
  PLAYER_PORTAL = 'PLAYER_PORTAL',
  LIVE_SCOUT = 'LIVE_SCOUT'
}

export interface LiveMatchData {
  id: string;
  coachId: string;
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
  period: number;
  homeFouls: number;
  awayFouls: number;
  homeTimeouts: number;
  awayTimeouts: number;
  playerFouls: Record<string, number>;
  playerPoints: Record<string, number>;
  status: 'active' | 'finished';
  lastUpdated: string;
}

export type TicketStatus = 'backlog' | 'todo' | 'in_progress' | 'done';
export type TicketType = 'bug' | 'feature' | 'feedback';

export interface AppTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: 'coach' | 'player';
  title: string;
  description: string;
  type: TicketType;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high';
  appVersion: string;
  createdAt: string;
  technicalInfo?: {
    userAgent: string;
    platform: string;
  };
}

export type SkillCategory = 'Skott' | 'Dribbling' | 'Passningar' | 'Försvar' | 'Kondition' | 'Basket-IQ' | 'Transition' | 'Pick & Roll' | 'Fysik' | 'Taktik' | 'Layups' | 'Returtagning';

export interface Homework {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dateAssigned: string;
}

export interface NutritionLog {
  date: string;
  items: {
    id: string;
    label: string;
    completed: boolean;
    type: 'protein' | 'hydration' | 'recovery' | 'greens';
  }[];
}

export interface Player {
  id: string;
  name: string;
  number: number;
  avatar?: string;
  position?: string;
  age?: number;
  level?: string;
  skillAssessment?: Record<string, number>;
  individualPlan?: string[];
  notes?: string;
  accessCode?: string; 
  homework?: Homework[]; 
  nutrition?: NutritionLog; 
  created_at?: string;
}

export interface Badge {
  id: string;
  label: string;
  icon: string;
  description: string;
  color: string;
  unlocked: boolean;
}

export interface Exercise {
  id: string;
  title: string;
  category: SkillCategory;
  level?: 'Nybörjare' | 'Medel' | 'Avancerad';
  duration?: string;
  overview: {
    setup: string;
    action: string;
    coachingPoint: string;
  };
  pedagogy?: {
    what: string;
    how: string;
    why: string;
  };
  instructions: {
    warmup: string;
    main: string;
    conclusion: string;
  };
  criteria: string[];
  diagramPrompt: string;
  videoUrl?: string; 
}

export interface Phase {
  id: number;
  title: string;
  duration: string;
  description: string;
  exercises: Exercise[];
  color: string;
}

export interface Attendance {
  playerId: string;
  status: 'närvarande' | 'delvis' | 'frånvarande';
  note?: string;
}

export interface Evaluation {
  playerId: string;
  exerciseId: string;
  scores: number[]; 
  note?: string;
  timestamp: string;
}

export interface TrainingSession {
  id: string;
  date: string;
  phaseId: number;
  exerciseIds: string[];
  attendance: Attendance[];
  evaluations: Evaluation[];
  created_at?: string;
}

export interface MatchFeedback {
  playerId: string;
  effort: number;
  teamwork: number;
  learning: number;
  strengths: string;
  improvements: string;
}

export interface Shot {
  id: string;
  x: number; 
  y: number; 
  result: 'make' | 'miss';
}

export interface MatchRecord {
  id: string;
  date: string;
  opponent: string;
  score: number;
  opponentScore: number;
  feedbacks: MatchFeedback[];
  teamSummary: string;
  strategyImage?: string; 
  tacticalPlays?: string[]; 
  shots?: Shot[]; 
  created_at?: string;
}

export interface VideoClip {
  id: string;
  timestamp: number;
  label: string;
  note: string;
  type: 'positive' | 'negative' | 'neutral';
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
    webkitAudioContext: typeof AudioContext;
  }
}
