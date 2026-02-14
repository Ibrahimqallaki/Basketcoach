
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
  PLAYER_PORTAL = 'PLAYER_PORTAL'
}

/* Added 'Layups' and 'Returtagning' to SkillCategory to match mockData usage */
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
  accessCode?: string; // Code for player login
  homework?: Homework[]; // List of assignments
  nutrition?: NutritionLog; // Daily nutrition tracking
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
  videoUrl?: string; // Optional YouTube embed URL
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
  x: number; // Percentage 0-100 relative to width
  y: number; // Percentage 0-100 relative to height
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
  strategyImage?: string; // Deprecated, kept for backward compatibility
  tacticalPlays?: string[]; // New: Array of multiple whiteboard images
  shots?: Shot[]; // New: Shot chart data
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
