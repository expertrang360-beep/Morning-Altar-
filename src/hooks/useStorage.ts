import { useState, useEffect, useCallback } from 'react';
import { UserData, ReflectionEntry, Devotion, StudyPlanType } from '../types';
import { devotions } from '../data/devotions';

const STORAGE_KEY = 'morning_altar_user_data';

const DEFAULT_USER_DATA: UserData = {
  onboarded: false,
  username: '',
  email: '',
  devotionTime: '06:00',
  sessionLength: 10,
  streak: 0,
  points: 0,
  lastCompletedDate: null,
  lastQuizDate: null,
  reflections: [],
  currentDevotionId: null,
  recentDevotionIds: [],
  lastDevotionDate: null,
  studyPlan: 'none',
  studyPlanStartDate: null,
  prayerRequests: [],
  themeId: 'classic'
};

export function useStorage() {
  const [userData, setUserData] = useState<UserData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Backfill points for existing users if missing
        if (parsed.points === undefined) {
          parsed.points = parsed.streak || 0;
        }
        return { ...DEFAULT_USER_DATA, ...parsed };
      } catch (e) {
        console.error("Error parsing stored user data:", e);
        return DEFAULT_USER_DATA;
      }
    }
    return DEFAULT_USER_DATA;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  }, [userData]);

  const updateOnboarding = (devotionTime: string, sessionLength: number, studyPlan: StudyPlanType = 'none', username?: string, email?: string) => {
    setUserData(prev => ({
      ...prev,
      onboarded: true,
      username: username || prev.username,
      email: email || prev.email,
      devotionTime,
      sessionLength,
      studyPlan,
      studyPlanStartDate: studyPlan !== 'none' ? new Date().toISOString() : null
    }));
  };

  const updateStudyPlan = (studyPlan: StudyPlanType) => {
    setUserData(prev => ({
      ...prev,
      studyPlan,
      studyPlanStartDate: studyPlan !== 'none' ? new Date().toISOString() : null
    }));
  };

  const updateUserData = (updates: Partial<UserData>) => {
    setUserData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const selectDailyDevotion = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // If we already picked a devotion for today, return it
    if (userData.lastDevotionDate === today && userData.currentDevotionId) {
      const existing = devotions.find(d => d.id === userData.currentDevotionId);
      if (existing) return existing;
    }

    // Otherwise, pick a new one
    // Filter out devotions that are in the recent list
    const recentIds = userData.recentDevotionIds || [];
    const available = devotions.filter(d => !recentIds.includes(d.id));
    
    // If we've seen everything recently, reset the recent list for selection
    const pool = available.length > 0 ? available : devotions;
    
    const randomIndex = Math.floor(Math.random() * pool.length);
    const selected = pool[randomIndex];

    // Save the selection for today
    setUserData(prev => ({
      ...prev,
      currentDevotionId: selected.id,
      lastDevotionDate: today
    }));

    return selected;
  }, [userData.lastDevotionDate, userData.currentDevotionId, userData.recentDevotionIds]);

  const completeDevotion = (reflection: string, theme: string) => {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = userData.lastCompletedDate;
    
    let newStreak = userData.streak;
    let newPoints = userData.points || 0;
    
    if (lastDate) {
      const last = new Date(lastDate);
      const diff = (new Date(today).getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        newStreak += 1;
        newPoints += 1; // 1 point per day
        
        // Bonus for 1 year streak
        if (newStreak % 365 === 0) {
          newPoints += 100; // Bonus points for maintaining a 1-year streak
        }
      } else if (diff > 1) {
        newStreak = 1;
        newPoints += 1; // Start earning again
      }
    } else {
      newStreak = 1;
      newPoints += 1;
    }

    const newReflection: ReflectionEntry = {
      date: new Date().toISOString(),
      theme,
      text: reflection
    };

    // Add current devotion to recent list
    const recentIds = userData.recentDevotionIds || [];
    const newRecentIds = userData.currentDevotionId 
      ? [userData.currentDevotionId, ...recentIds].slice(0, 15)
      : recentIds;

    setUserData(prev => ({
      ...prev,
      streak: newStreak,
      points: newPoints,
      lastCompletedDate: today,
      reflections: [newReflection, ...prev.reflections].slice(0, 30),
      recentDevotionIds: newRecentIds
    }));
  };

  const completeQuiz = (score: number) => {
    setUserData(prev => ({
      ...prev,
      points: (prev.points || 0) + (score === 5 ? 2 : 0),
      lastQuizDate: new Date().toISOString()
    }));
  };

  return { userData, updateOnboarding, completeDevotion, selectDailyDevotion, updateStudyPlan, updateUserData, completeQuiz };
}
