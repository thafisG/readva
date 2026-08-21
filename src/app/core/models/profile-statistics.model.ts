export interface ReadingGoals {
  dailyMinutes: number;
  monthlyBooks: number;
}

export interface ReadingPeriodSummary {
  minutes: number;
  pages: number;
  sessions: number;
  completedBooks: number;
}

export interface ReadingDayStat {
  key: string;
  label: string;
  minutes: number;
  pages: number;
  active: boolean;
}

export interface ReadingCategoryStat {
  name: string;
  books: number;
  percentage: number;
}

export interface ReaderStatistics {
  totalBooks: number;
  completedBooks: number;
  pagesRead: number;
  minutesRead: number;
  sessions: number;
  averageSessionMinutes: number;
  currentStreak: number;
  activeDays: number;
  week: ReadingPeriodSummary;
  month: ReadingPeriodSummary;
  weekDays: ReadingDayStat[];
  categories: ReadingCategoryStat[];
}
