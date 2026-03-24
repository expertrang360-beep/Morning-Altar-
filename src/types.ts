export interface Devotion {
  id: string;
  theme: string;
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

export interface PrayerRequest {
  id: string;
  text: string;
  createdAt: string;
  isAnswered: boolean;
}

export interface UserData {
  onboarded: boolean;
  devotionTime: string;
  sessionLength: number;
  streak: number;
  points: number;
  lastCompletedDate: string | null;
  reflections: ReflectionEntry[];
  currentDevotionId: string | null;
  recentDevotionIds: string[];
  lastDevotionDate: string | null;
  studyPlan: StudyPlanType;
  studyPlanStartDate: string | null;
  prayerRequests: PrayerRequest[];
}

export interface ReflectionEntry {
  date: string;
  theme: string;
  text: string;
}
