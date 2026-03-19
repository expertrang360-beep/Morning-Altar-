import { BIBLE_BOOKS, TOTAL_CHAPTERS } from './bibleData';
import { StudyPlanType } from '../types';

export interface BibleReading {
  startBook: string;
  startChapter: number;
  endBook: string;
  endChapter: number;
  chapters: string[];
}

export interface PlanProgress {
  week: number;
  day: number;
  totalWeeks: number;
  totalDays: number;
  percentage: number;
}

export function calculatePlanProgress(startDateStr: string | null, plan: StudyPlanType): PlanProgress | null {
  if (!startDateStr || plan === 'none') return null;

  const startDate = new Date(startDateStr);
  const today = new Date();
  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  let totalDays = 365;
  if (plan === '6months') totalDays = 180;
  if (plan === '2years') totalDays = 730;

  const currentDay = Math.min(diffDays + 1, totalDays);
  const currentWeek = Math.ceil(currentDay / 7);
  const totalWeeks = Math.ceil(totalDays / 7);
  const percentage = Math.round((currentDay / totalDays) * 100);

  return {
    week: currentWeek,
    day: currentDay,
    totalWeeks,
    totalDays,
    percentage
  };
}

export function calculateDailyReading(startDateStr: string | null, plan: StudyPlanType): BibleReading | null {
  if (!startDateStr || plan === 'none') return null;

  const startDate = new Date(startDateStr);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let totalDays = 365;
  if (plan === '6months') totalDays = 180;
  if (plan === '2years') totalDays = 730;

  const cappedDiffDays = Math.min(diffDays, totalDays - 1);

  const chaptersPerDay = TOTAL_CHAPTERS / totalDays;
  const startChapterIndex = Math.floor(cappedDiffDays * chaptersPerDay);
  const endChapterIndex = Math.floor((cappedDiffDays + 1) * chaptersPerDay) - 1;

  return getReadingFromIndices(startChapterIndex, endChapterIndex);
}

function getReadingFromIndices(startIndex: number, endIndex: number): BibleReading {
  let currentIdx = 0;
  let startBook = '';
  let startChapter = 0;
  let endBook = '';
  let endChapter = 0;
  const chapters: string[] = [];

  for (const book of BIBLE_BOOKS) {
    for (let ch = 1; ch <= book.chapters; ch++) {
      if (currentIdx === startIndex) {
        startBook = book.name;
        startChapter = ch;
      }
      if (currentIdx >= startIndex && currentIdx <= endIndex) {
        chapters.push(`${book.name} ${ch}`);
        endBook = book.name;
        endChapter = ch;
      }
      currentIdx++;
    }
  }

  return {
    startBook,
    startChapter,
    endBook,
    endChapter,
    chapters
  };
}
