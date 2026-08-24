import type { ReadingActivity } from '../../../core/models/activity.model';
import type { Mission } from '../../../core/models/gamification.model';

export const DAILY_MISSION_COUNT = 4;

export interface MonthlyMissionStats {
  monthLabel: string;
  completedMissions: number;
  availableMissions: number;
  activeDays: number;
  elapsedDays: number;
  streakDays: number;
  progressPercent: number;
}

interface MissionVariant {
  title: string;
  target: number;
  xpReward: number;
}

interface DailyReadingTotals {
  pages: number;
  minutes: number;
  sessions: number;
  booksStarted: number;
}

const PAGE_VARIANTS: readonly MissionVariant[] = [
  { title: 'Primeiras páginas', target: 10, xpReward: 35 },
  { title: 'Ritmo de leitura', target: 15, xpReward: 45 },
  { title: 'Leitor do dia', target: 20, xpReward: 50 },
  { title: 'Virador de páginas', target: 30, xpReward: 70 },
];

const MINUTE_VARIANTS: readonly MissionVariant[] = [
  { title: 'Pausa para ler', target: 10, xpReward: 35 },
  { title: 'Momento de leitura', target: 15, xpReward: 45 },
  { title: 'Foco no livro', target: 20, xpReward: 50 },
  { title: 'Maratona de leitura', target: 30, xpReward: 60 },
];

function dateSeed(dateKey: string): number {
  return [...dateKey].reduce((sum, character) => sum + (Number(character) || 0), 0);
}

export function createDailyMissions(dateKey: string): Mission[] {
  const seed = dateSeed(dateKey);
  const pages = PAGE_VARIANTS[seed % PAGE_VARIANTS.length];
  const minutes = MINUTE_VARIANTS[(seed + 1) % MINUTE_VARIANTS.length];
  const sessionTarget = seed % 3 === 0 ? 2 : 1;

  return [
    {
      id: 'read-pages',
      matIcon: 'menu_book',
      title: pages.title,
      description: `Leia ${pages.target} páginas hoje`,
      xpReward: pages.xpReward,
      progress: 0,
      target: pages.target,
      completed: false,
    },
    {
      id: 'read-minutes',
      matIcon: 'timer',
      title: minutes.title,
      description: `Leia por ${minutes.target} minutos`,
      xpReward: minutes.xpReward,
      progress: 0,
      target: minutes.target,
      completed: false,
    },
    {
      id: 'read-session',
      matIcon: 'local_fire_department',
      title: sessionTarget === 1 ? 'Consistência' : 'Leitura em dobro',
      description:
        sessionTarget === 1 ? 'Registre uma sessão de leitura' : 'Registre duas sessões de leitura',
      xpReward: sessionTarget === 1 ? 30 : 55,
      progress: 0,
      target: sessionTarget,
      completed: false,
    },
    {
      id: 'start-book',
      matIcon: 'auto_stories',
      title: 'Novo começo',
      description: 'Adicione um novo livro à sua lista',
      xpReward: 40,
      progress: 0,
      target: 1,
      completed: false,
    },
  ];
}

export function reconcileDailyMissions(
  missions: readonly Mission[],
  activities: readonly ReadingActivity[],
  dateKey: string,
): Mission[] {
  const totals = groupActivitiesByDate(activities).get(dateKey);
  if (!totals) return [...missions];

  return missions.map((mission) => {
    const inferredProgress = progressForMission(mission.id, totals);
    const progress = Math.min(mission.target, Math.max(mission.progress, inferredProgress));
    return { ...mission, progress, completed: mission.completed || progress >= mission.target };
  });
}

export function inferMissionHistoryFromActivities(
  activities: readonly ReadingActivity[],
): Record<string, string[]> {
  return Object.fromEntries(
    [...groupActivitiesByDate(activities)].map(([dateKey, totals]) => {
      const completedMissionIds = createDailyMissions(dateKey)
        .filter((mission) => progressForMission(mission.id, totals) >= mission.target)
        .map((mission) => mission.id);
      return [dateKey, completedMissionIds];
    }),
  );
}

export function mergeMissionHistories(
  ...histories: readonly Readonly<Record<string, readonly string[]>>[]
): Record<string, string[]> {
  const merged: Record<string, string[]> = {};
  for (const history of histories) {
    for (const [dateKey, missionIds] of Object.entries(history)) {
      merged[dateKey] = [...new Set([...(merged[dateKey] ?? []), ...missionIds])];
    }
  }
  return merged;
}

export function calculateMonthlyMissionStats(
  history: Readonly<Record<string, readonly string[]>>,
  today: Date,
  markedDays?: readonly string[],
): MonthlyMissionStats {
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const monthEntries = Object.entries(history).filter(([dateKey]) => dateKey.startsWith(monthKey));
  const completedMissions = monthEntries.reduce(
    (total, [, missionIds]) => total + missionIds.length,
    0,
  );
  const activeDateKeys = new Set(
    (
      markedDays ??
      monthEntries.filter(([, missionIds]) => missionIds.length > 0).map(([key]) => key)
    ).filter((dateKey) => dateKey.startsWith(monthKey)),
  );
  const elapsedDays = today.getDate();
  const availableMissions = elapsedDays * DAILY_MISSION_COUNT;

  return {
    monthLabel: today.toLocaleDateString('pt-BR', { month: 'long' }),
    completedMissions,
    availableMissions,
    activeDays: activeDateKeys.size,
    elapsedDays,
    streakDays: calculateMonthlyStreak(activeDateKeys, today, monthKey),
    progressPercent:
      availableMissions > 0
        ? Math.min(100, Math.round((completedMissions / availableMissions) * 100))
        : 0,
  };
}

function groupActivitiesByDate(
  activities: readonly ReadingActivity[],
): Map<string, DailyReadingTotals> {
  const grouped = new Map<string, DailyReadingTotals>();
  for (const activity of activities) {
    const dateKey = activityDateKey(activity);
    if (!dateKey) continue;
    const current = grouped.get(dateKey) ?? { pages: 0, minutes: 0, sessions: 0, booksStarted: 0 };
    grouped.set(dateKey, {
      pages: current.pages + nonNegativeInteger(activity.pagesRead),
      minutes: current.minutes + nonNegativeInteger(activity.minutesRead),
      sessions: current.sessions + (activity.actionType === 'progress' ? 1 : 0),
      booksStarted: current.booksStarted + (activity.actionType === 'started' ? 1 : 0),
    });
  }
  return grouped;
}

function progressForMission(missionId: string, totals: DailyReadingTotals): number {
  switch (missionId) {
    case 'read-pages':
      return totals.pages;
    case 'read-minutes':
      return totals.minutes;
    case 'read-session':
      return totals.sessions;
    case 'start-book':
      return totals.booksStarted;
    default:
      return 0;
  }
}

function activityDateKey(activity: ReadingActivity): string | null {
  const date = new Date(activity.createdAt || activity.timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return toDateKey(date);
}

function nonNegativeInteger(value: number | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
}

function calculateMonthlyStreak(
  markedDays: ReadonlySet<string>,
  today: Date,
  monthKey: string,
): number {
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  if (!markedDays.has(toDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (toDateKey(cursor).startsWith(monthKey) && markedDays.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
