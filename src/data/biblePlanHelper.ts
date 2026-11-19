import { BIBLE_BOOKS, TOTAL_CHAPTERS } from './bibleData';
import { StudyPlanType } from '../types';

export const OT_CHAPTERS_COUNT = 929;
export const NT_CHAPTERS_COUNT = 260;

export interface BibleReading {
  startBook: string;
  startChapter: number;
  endBook: string;
  endChapter: number;
  chapters: string[];
  testament: 'Old Testament' | 'New Testament' | 'Both';
  dayNumber: number;
  totalDays: number;
  chaptersPerDay: number;
}

export interface PlanProgress {
  week: number;
  day: number;
  totalWeeks: number;
  totalDays: number;
  percentage: number;
  estimatedCompletionDate: string;
  chaptersRead: number;
  chaptersRemaining: number;
}

export interface GoalEstimateItem {
  id: string;
  title: string;
  capacity: number; // chapters per day
  totalDays: number;
  approxMonths: number;
  dailyMinutes: number;
  firstTestamentDays: number;
  firstTestamentName: string;
  completionDate: string;
  paceLabel: string;
  recommendedFor: string;
}

/**
 * Returns all 1,189 chapters in the order determined by startTestament:
 * - 'ot': Genesis 1 -> Malachi 4 -> Matthew 1 -> Revelation 22
 * - 'nt': Matthew 1 -> Revelation 22 -> Genesis 1 -> Malachi 4
 */
export function getOrderedChapters(startTestament: 'ot' | 'nt' = 'ot'): { book: string; chapter: number; testament: 'OT' | 'NT' }[] {
  const allChapters: { book: string; chapter: number; testament: 'OT' | 'NT' }[] = [];
  
  const ntStartIndex = BIBLE_BOOKS.findIndex(b => b.name === 'Matthew');
  const otBooks = BIBLE_BOOKS.slice(0, ntStartIndex);
  const ntBooks = BIBLE_BOOKS.slice(ntStartIndex);

  if (startTestament === 'nt') {
    // New Testament first, then Old Testament
    for (const book of ntBooks) {
      for (let ch = 1; ch <= book.chapters; ch++) {
        allChapters.push({ book: book.name, chapter: ch, testament: 'NT' });
      }
    }
    for (const book of otBooks) {
      for (let ch = 1; ch <= book.chapters; ch++) {
        allChapters.push({ book: book.name, chapter: ch, testament: 'OT' });
      }
    }
  } else {
    // Old Testament first, then New Testament
    for (const book of otBooks) {
      for (let ch = 1; ch <= book.chapters; ch++) {
        allChapters.push({ book: book.name, chapter: ch, testament: 'OT' });
      }
    }
    for (const book of ntBooks) {
      for (let ch = 1; ch <= book.chapters; ch++) {
        allChapters.push({ book: book.name, chapter: ch, testament: 'NT' });
      }
    }
  }

  return allChapters;
}

/**
 * Calculates completion estimates for different pace options and capacities
 */
export function calculateGoalEstimates(startTestament: 'ot' | 'nt' = 'ot', currentCapacity: number = 3): {
  presetGoals: GoalEstimateItem[];
  customGoal: GoalEstimateItem;
  milestones: { title: string; chaptersNeeded: number; daysAtCurrentPace: number; targetDate: string }[];
} {
  const firstTestamentChapters = startTestament === 'nt' ? NT_CHAPTERS_COUNT : OT_CHAPTERS_COUNT;
  const firstTestamentName = startTestament === 'nt' ? 'New Testament' : 'Old Testament';

  const formatFinishDate = (daysToAdd: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const createGoal = (
    id: string,
    title: string,
    capacity: number,
    totalDays: number,
    paceLabel: string,
    recommendedFor: string
  ): GoalEstimateItem => {
    const approxMonths = Math.round((totalDays / 30.4) * 10) / 10;
    const dailyMinutes = Math.round(capacity * 4.5); // ~4.5 minutes per chapter
    const firstTestamentDays = Math.ceil(firstTestamentChapters / capacity);

    return {
      id,
      title,
      capacity,
      totalDays,
      approxMonths,
      dailyMinutes,
      firstTestamentDays,
      firstTestamentName,
      completionDate: formatFinishDate(totalDays),
      paceLabel,
      recommendedFor,
    };
  };

  const presetGoals: GoalEstimateItem[] = [
    createGoal(
      '6months',
      'Sprint (6 Months)',
      6.6,
      180,
      '~6.6 ch/day',
      'Intensive study, fast immersion, sabbatical'
    ),
    createGoal(
      '1year',
      'Classic 1-Year Journey',
      3.26,
      365,
      '~3.3 ch/day',
      'Most popular balanced daily discipline'
    ),
    createGoal(
      '2years',
      'Steady Walk (2 Years)',
      1.63,
      730,
      '~1.6 ch/day',
      'Gentle pace for busy mornings & deep contemplation'
    ),
  ];

  // Custom capacity estimate
  const cap = Math.max(1, Math.min(10, currentCapacity));
  const customTotalDays = Math.ceil(TOTAL_CHAPTERS / cap);
  const customGoal = createGoal(
    'custom',
    `Custom Capacity (${cap} ch/day)`,
    cap,
    customTotalDays,
    `${cap} ch/day`,
    'Tailored exactly to your personal morning reading capacity'
  );

  // Milestones based on selected start Testament and capacity
  const milestones = [
    {
      title: startTestament === 'nt' ? 'Complete 4 Gospels (Matt - John)' : 'Complete Torah / Pentateuch',
      chaptersNeeded: startTestament === 'nt' ? 89 : 187,
      daysAtCurrentPace: Math.ceil((startTestament === 'nt' ? 89 : 187) / cap),
      targetDate: formatFinishDate(Math.ceil((startTestament === 'nt' ? 89 : 187) / cap)),
    },
    {
      title: `Finish Full ${firstTestamentName}`,
      chaptersNeeded: firstTestamentChapters,
      daysAtCurrentPace: Math.ceil(firstTestamentChapters / cap),
      targetDate: formatFinishDate(Math.ceil(firstTestamentChapters / cap)),
    },
    {
      title: 'Complete All 1,189 Chapters of the Bible',
      chaptersNeeded: TOTAL_CHAPTERS,
      daysAtCurrentPace: customTotalDays,
      targetDate: formatFinishDate(customTotalDays),
    },
  ];

  return { presetGoals, customGoal, milestones };
}

export function getTotalDaysForPlan(plan: StudyPlanType, dailyCapacity: number = 3): number {
  if (plan === '6months') return 180;
  if (plan === '1year') return 365;
  if (plan === '2years') return 730;
  if (plan === 'custom') {
    const cap = Math.max(1, dailyCapacity || 3);
    return Math.ceil(TOTAL_CHAPTERS / cap);
  }
  return 365;
}

export function calculatePlanProgress(
  startDateStr: string | null, 
  plan: StudyPlanType,
  dailyCapacity: number = 3
): PlanProgress | null {
  if (!startDateStr || plan === 'none') return null;

  const startDate = new Date(startDateStr);
  const today = new Date();
  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  const totalDays = getTotalDaysForPlan(plan, dailyCapacity);
  const currentDay = Math.min(diffDays + 1, totalDays);
  const currentWeek = Math.ceil(currentDay / 7);
  const totalWeeks = Math.ceil(totalDays / 7);
  const percentage = Math.min(100, Math.round((currentDay / totalDays) * 100));

  const chaptersRead = Math.min(TOTAL_CHAPTERS, Math.round((currentDay / totalDays) * TOTAL_CHAPTERS));
  const chaptersRemaining = Math.max(0, TOTAL_CHAPTERS - chaptersRead);

  const completionDateObj = new Date(startDate);
  completionDateObj.setDate(completionDateObj.getDate() + totalDays);
  const estimatedCompletionDate = completionDateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return {
    week: currentWeek,
    day: currentDay,
    totalWeeks,
    totalDays,
    percentage,
    estimatedCompletionDate,
    chaptersRead,
    chaptersRemaining
  };
}

export function calculateDailyReading(
  startDateStr: string | null, 
  plan: StudyPlanType, 
  startTestament: 'ot' | 'nt' = 'ot',
  dailyCapacity: number = 3
): BibleReading | null {
  if (!startDateStr || plan === 'none') return null;

  const startDate = new Date(startDateStr);
  const today = new Date();
  const diffTime = Math.max(0, today.getTime() - startDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const totalDays = getTotalDaysForPlan(plan, dailyCapacity);
  const cappedDiffDays = Math.min(diffDays, totalDays - 1);

  const chaptersPerDay = TOTAL_CHAPTERS / totalDays;
  const startIndex = Math.floor(cappedDiffDays * chaptersPerDay);
  const endIndex = Math.min(Math.floor((cappedDiffDays + 1) * chaptersPerDay) - 1, TOTAL_CHAPTERS - 1);

  const ordered = getOrderedChapters(startTestament);
  const chaptersList: string[] = [];
  
  let startBook = '';
  let startChapter = 0;
  let endBook = '';
  let endChapter = 0;
  const testamentsPresent = new Set<'OT' | 'NT'>();

  for (let i = startIndex; i <= endIndex && i < ordered.length; i++) {
    const item = ordered[i];
    chaptersList.push(`${item.book} ${item.chapter}`);
    testamentsPresent.add(item.testament);

    if (i === startIndex) {
      startBook = item.book;
      startChapter = item.chapter;
    }
    if (i === endIndex) {
      endBook = item.book;
      endChapter = item.chapter;
    }
  }

  let testamentLabel: 'Old Testament' | 'New Testament' | 'Both' = 'Old Testament';
  if (testamentsPresent.has('OT') && testamentsPresent.has('NT')) {
    testamentLabel = 'Both';
  } else if (testamentsPresent.has('NT')) {
    testamentLabel = 'New Testament';
  }

  return {
    startBook: startBook || 'Genesis',
    startChapter: startChapter || 1,
    endBook: endBook || startBook || 'Genesis',
    endChapter: endChapter || startChapter || 1,
    chapters: chaptersList.length > 0 ? chaptersList : ['Genesis 1'],
    testament: testamentLabel,
    dayNumber: cappedDiffDays + 1,
    totalDays,
    chaptersPerDay: Math.max(1, Math.round(chaptersPerDay * 10) / 10)
  };
}
