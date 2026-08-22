import type { ReadingActivity } from '../models/activity.model';
import type { Book } from '../models/book.model';
import type {
  ReaderStatistics,
  ReadingCategoryStat,
  ReadingDayStat,
  ReadingPeriodSummary,
} from '../models/profile-statistics.model';
import { calculateStreak, localDateKey } from './gamification.rules';

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function buildReaderStatistics(
  books: readonly Book[],
  activities: readonly ReadingActivity[],
  markedDays: readonly string[],
  today = new Date(),
): ReaderStatistics {
  const validActivities = activities.flatMap((activity) => {
    const date = parseActivityDate(activity);
    return date ? [{ activity, date }] : [];
  });
  const weekDates = createRecentDates(today, 7);
  const weekKeys = new Set(weekDates.map(localDateKey));
  const monthActivities = validActivities.filter(({ date }) => isSameMonth(date, today));
  const weekActivities = validActivities.filter(({ date }) => weekKeys.has(localDateKey(date)));

  const pagesRead = books.reduce((total, book) => total + safeNumber(book.currentPage), 0);
  const minutesRead = sumActivities(validActivities.map(({ activity }) => activity)).minutes;
  const sessions = validActivities.filter(({ activity }) => isReadingSession(activity)).length;

  return {
    totalBooks: books.length,
    completedBooks: books.filter(isCompleted).length,
    pagesRead,
    minutesRead,
    sessions,
    averageSessionMinutes: sessions ? Math.round(minutesRead / sessions) : 0,
    currentStreak: calculateStreak(markedDays, today),
    activeDays: new Set(validActivities.map(({ date }) => localDateKey(date))).size,
    week: summarizePeriod(
      weekActivities.map(({ activity }) => activity),
      books,
      weekKeys,
    ),
    month: summarizePeriod(
      monthActivities.map(({ activity }) => activity),
      books,
      null,
      today,
    ),
    weekDays: buildWeekDays(weekDates, validActivities, markedDays),
    categories: buildCategories(books),
  };
}

function buildWeekDays(
  dates: readonly Date[],
  activities: readonly { activity: ReadingActivity; date: Date }[],
  markedDays: readonly string[],
): ReadingDayStat[] {
  const marked = new Set(markedDays);
  return dates.map((date) => {
    const key = localDateKey(date);
    const dailyActivities = activities
      .filter((item) => localDateKey(item.date) === key)
      .map((item) => item.activity);
    const totals = sumActivities(dailyActivities);
    return {
      key,
      label: DAY_LABELS[date.getDay()],
      minutes: totals.minutes,
      pages: totals.pages,
      active: marked.has(key) || dailyActivities.length > 0,
    };
  });
}

function buildCategories(books: readonly Book[]): ReadingCategoryStat[] {
  const counts = new Map<string, number>();
  books.forEach((book) => {
    const category = book.category.trim() || 'Sem categoria';
    counts.set(category, (counts.get(category) ?? 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([name, count]) => ({
      name,
      books: count,
      percentage: books.length ? Math.round((count / books.length) * 100) : 0,
    }));
}

function summarizePeriod(
  activities: readonly ReadingActivity[],
  books: readonly Book[],
  dateKeys: ReadonlySet<string> | null,
  month?: Date,
): ReadingPeriodSummary {
  const totals = sumActivities(activities);
  const completedBooks = books.filter((book) => {
    if (!book.completedAt) return false;
    const completedAt = new Date(book.completedAt);
    if (Number.isNaN(completedAt.getTime())) return false;
    return dateKeys
      ? dateKeys.has(localDateKey(completedAt))
      : !!month && isSameMonth(completedAt, month);
  }).length;
  return {
    minutes: totals.minutes,
    pages: totals.pages,
    sessions: activities.filter(isReadingSession).length,
    completedBooks,
  };
}

function sumActivities(activities: readonly ReadingActivity[]): { minutes: number; pages: number } {
  return activities.reduce(
    (totals, activity) => ({
      minutes: totals.minutes + safeNumber(activity.minutesRead),
      pages: totals.pages + safeNumber(activity.pagesRead),
    }),
    { minutes: 0, pages: 0 },
  );
}

function createRecentDates(today: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    date.setDate(date.getDate() - (count - index - 1));
    return date;
  });
}

function parseActivityDate(activity: ReadingActivity): Date | null {
  const date = new Date(activity.createdAt || activity.timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isReadingSession(activity: ReadingActivity): boolean {
  return (
    activity.actionType === 'progress' &&
    (safeNumber(activity.minutesRead) > 0 || safeNumber(activity.pagesRead) > 0)
  );
}

function isCompleted(book: Book): boolean {
  return book.status === 'completed' || !!book.completedAt || book.currentPage >= book.totalPages;
}

function isSameMonth(date: Date, reference: Date): boolean {
  return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
}

function safeNumber(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(0, Number(value)) : 0;
}
