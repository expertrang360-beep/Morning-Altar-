export type DevotionPlanType = 'Faith' | 'Discipline' | 'Purpose';

export interface Devotion {
  id: string;
  theme: string;
  plan?: DevotionPlanType;
  affirmation: string;
  scripture: {
    reference: string;
    verses: string[];
  };
  readAloudVerse: string;
  reflectionPrompt: string;
  meditationScript?: string[];
}

export type StudyPlanType = '6months' | '1year' | '2years' | 'none';
export type ThemeId = 'classic' | 'dawn' | 'forest' | 'midnight' | 'sepia';

export interface PrayerRequest {
  id: string;
  text: string;
  createdAt: string;
  isAnswered: boolean;
  dueDate?: string;
}

export interface UserData {
  onboarded: boolean;
  username?: string;
  email?: string;
  devotionTime: string;
  sessionLength: number;
  streak: number;
  points: number;
  lastCompletedDate: string | null;
  lastQuizDate: string | null;
  reflections: ReflectionEntry[];
  currentDevotionId: string | null;
  recentDevotionIds: string[];
  lastDevotionDate: string | null;
  studyPlan: StudyPlanType;
  studyPlanStartDate: string | null;
  devotionPlan?: DevotionPlanType;
  prayerRequests: PrayerRequest[];
  themeId?: ThemeId;
}

export interface ReflectionEntry {
  date: string;
  theme: string;
  text: string;
}
