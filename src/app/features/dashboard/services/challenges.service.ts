import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { calculateLevel, localDateKey } from '../../../core/domain/gamification.rules';
import type { ReadingActivity } from '../../../core/models/activity.model';
import type { Achievement, Mission } from '../../../core/models/gamification.model';
import { STORAGE_KEYS } from '../../../core/storage/storage.keys';
import { StorageService } from '../../../core/storage/storage.service';
import type { MokaCelebration, MokaMood } from '../../moka/moka.component';
import {
  calculateMonthlyMissionStats,
  createDailyMissions,
  inferMissionHistoryFromActivities,
  mergeMissionHistories,
  reconcileDailyMissions,
} from '../domain/challenge-progress.rules';
import { AuthService } from './auth.service';
import { ReadingStreakService } from './reading-streak.service';

interface ChallengesState {
  totalXp: number;
  missionsDay: string;
  missions: Mission[];
  achievements: Achievement[];
  rewardedBookIds: string[];
  missionHistory: Record<string, string[]>;
  unseenMissionKeys: string[];
}

@Injectable({ providedIn: 'root' })
export class ChallengesService {
  private readonly auth = inject(AuthService);
  private readonly storage = inject(StorageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly readingStreak = inject(ReadingStreakService);
  private readonly totalXp = signal(0);
  private readonly missionState = signal<Mission[]>([]);
  private readonly achievementState = signal<Achievement[]>([]);
  private readonly missionHistoryState = signal<Record<string, string[]>>({});
  private readonly unseenMissionKeysState = signal<string[]>([]);
  private rewardedBookIds = new Set<string>();
  private unlockTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly justUnlockedState = signal<Achievement | null>(null);
  private readonly justUnlockedMoodState = signal<MokaMood | null>(null);
  private readonly celebrationState = signal<MokaCelebration | null>(null);
  private celebrationSequence = 0;

  readonly missions = this.missionState.asReadonly();
  readonly achievements = this.achievementState.asReadonly();
  readonly justUnlocked = this.justUnlockedState.asReadonly();
  readonly justUnlockedMood = this.justUnlockedMoodState.asReadonly();
  readonly celebration = this.celebrationState.asReadonly();
  readonly levelInfo = computed(() => calculateLevel(this.totalXp()));
  readonly unlockedCount = computed(
    () => this.achievementState().filter((item) => item.unlocked).length,
  );
  readonly unseenMissionIds = computed(() => {
    const prefix = `${localDateKey(new Date())}:`;
    return this.unseenMissionKeysState()
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.slice(prefix.length));
  });
  readonly hasUnseenMissions = computed(() => this.unseenMissionIds().length > 0);
  readonly monthlyStats = computed(() =>
    calculateMonthlyMissionStats(
      this.missionHistoryState(),
      new Date(),
      this.readingStreak.markedDays(),
    ),
  );

  constructor() {
    effect(() => {
      const email = this.auth.currentUser()?.email ?? 'guest';
      untracked(() => this.loadForUser(email));
    });
    this.destroyRef.onDestroy(() => {
      if (this.unlockTimer) clearTimeout(this.unlockTimer);
    });
  }

  onPagesRead(pages: number): void {
    this.updateMission('read-pages', pages);
  }

  onReadingSession(): void {
    this.updateMission('read-session', 1);
  }

  onMinutesRead(minutes: number): void {
    this.updateMission('read-minutes', minutes);
  }

  onBookStarted(): void {
    this.updateMission('start-book', 1);
  }

  onBookFinished(bookId?: string): void {
    if (bookId && this.rewardedBookIds.has(bookId)) return;
    if (bookId) this.rewardedBookIds.add(bookId);
    this.updateMission('finish-book', 1);
    this.unlock('first-book');
    this.persist();
  }

  onStreakDay(days: number): void {
    if (days >= 7) this.unlock('streak-7');
    if (days >= 30) this.unlock('streak-30');
  }

  onNightReading(): void {
    this.unlock('night-owl');
  }

  dismissJustUnlocked(): void {
    this.justUnlockedState.set(null);
    this.justUnlockedMoodState.set(null);
    this.celebrationState.set(null);
  }

  markMissionUpdatesSeen(): void {
    if (this.unseenMissionKeysState().length === 0) return;
    this.unseenMissionKeysState.set([]);
    this.persist();
  }

  resetDailyMissions(): void {
    this.missionState.set(createDailyMissions(localDateKey(new Date())));
    this.persist();
  }

  private updateMission(id: string, rawDelta: number): void {
    const delta = Number.isFinite(rawDelta) ? Math.max(0, Math.trunc(rawDelta)) : 0;
    if (delta === 0) return;

    let earnedXp = 0;
    let completed = false;
    this.missionState.update((missions) =>
      missions.map((mission) => {
        if (mission.id !== id || mission.completed) return mission;
        const progress = Math.min(mission.target, mission.progress + delta);
        const isComplete = progress >= mission.target;
        if (isComplete) {
          earnedXp = mission.xpReward;
          completed = true;
        }
        return { ...mission, progress, completed: isComplete };
      }),
    );

    if (earnedXp) this.totalXp.update((xp) => xp + earnedXp);
    if (completed) {
      this.recordMissionCompletion(id);
      const allMissionsCompleted = this.missionState().every((mission) => mission.completed);
      const achievementId = allMissionsCompleted ? 'all-missions' : 'first-mission';
      const mood: MokaMood = allMissionsCompleted ? 'perfect-day' : 'mission';
      if (!this.unlock(achievementId)) this.announceCelebration(mood);
    }
    this.persist();
  }

  private recordMissionCompletion(missionId: string): void {
    const today = localDateKey(new Date());
    this.missionHistoryState.update((history) => {
      const completedToday = history[today] ?? [];
      if (completedToday.includes(missionId)) return history;
      return { ...history, [today]: [...completedToday, missionId] };
    });

    const missionKey = `${today}:${missionId}`;
    this.unseenMissionKeysState.update((keys) =>
      keys.includes(missionKey) ? keys : [...keys, missionKey],
    );
  }

  private unlock(id: string): boolean {
    const achievement = this.achievementState().find((item) => item.id === id);
    if (!achievement || achievement.unlocked) return false;
    const unlocked = { ...achievement, unlocked: true };
    this.achievementState.update((items) =>
      items.map((item) => (item.id === id ? unlocked : item)),
    );
    this.justUnlockedState.set(unlocked);
    this.justUnlockedMoodState.set(unlocked.mokaMood);
    this.announceCelebration(unlocked.mokaMood);
    return true;
  }

  private announceCelebration(mood: MokaMood): void {
    this.celebrationState.set({ id: ++this.celebrationSequence, mood });
    if (this.unlockTimer) clearTimeout(this.unlockTimer);
    this.unlockTimer = setTimeout(() => this.dismissJustUnlocked(), 5000);
  }

  private loadForUser(email: string): void {
    const today = localDateKey(new Date());
    const activities = this.storage.readUser<ReadingActivity[]>(
      STORAGE_KEYS.activities,
      email,
      [],
      [`@readva:activities:${email}`],
    );
    const state = this.storage.readUser<ChallengesState>(
      STORAGE_KEYS.challenges,
      email,
      {
        totalXp: 0,
        missionsDay: today,
        missions: createDailyMissions(today),
        achievements: this.defaultAchievements(),
        rewardedBookIds: [],
        missionHistory: {},
        unseenMissionKeys: [],
      },
      ['challenges_state'],
    );

    const storedMissions =
      state.missionsDay === today && Array.isArray(state.missions)
        ? state.missions
        : createDailyMissions(today);
    const storedHistory = this.normalizeHistory(state.missionHistory);
    const reconciledHistory = mergeMissionHistories(
      storedHistory,
      inferMissionHistoryFromActivities(activities),
    );

    this.totalXp.set(Number.isFinite(state.totalXp) ? Math.max(0, state.totalXp) : 0);
    this.missionState.set(reconcileDailyMissions(storedMissions, activities, today));
    this.achievementState.set(
      Array.isArray(state.achievements) ? state.achievements : this.defaultAchievements(),
    );
    this.rewardedBookIds = new Set(
      Array.isArray(state.rewardedBookIds) ? state.rewardedBookIds : [],
    );
    this.missionHistoryState.set(reconciledHistory);
    this.unseenMissionKeysState.set(
      Array.isArray(state.unseenMissionKeys)
        ? state.unseenMissionKeys.filter((key) => key.startsWith(`${today}:`))
        : [],
    );
    const historyWasReconciled =
      JSON.stringify(storedHistory) !== JSON.stringify(reconciledHistory);
    if (state.missionsDay !== today || historyWasReconciled) this.persist();
  }

  private normalizeHistory(value: unknown): Record<string, string[]> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).flatMap(([dateKey, missionIds]) =>
        Array.isArray(missionIds)
          ? [[dateKey, missionIds.filter((id): id is string => typeof id === 'string')]]
          : [],
      ),
    );
  }

  private persist(): void {
    this.storage.writeUser(STORAGE_KEYS.challenges, this.auth.currentUser()?.email ?? 'guest', {
      totalXp: this.totalXp(),
      missionsDay: localDateKey(new Date()),
      missions: this.missionState(),
      achievements: this.achievementState(),
      rewardedBookIds: [...this.rewardedBookIds],
      missionHistory: this.missionHistoryState(),
      unseenMissionKeys: this.unseenMissionKeysState(),
    } satisfies ChallengesState);
  }

  private defaultAchievements(): Achievement[] {
    return [
      {
        id: 'first-book',
        matIcon: 'emoji_events',
        title: 'Primeiro livro',
        description: 'Termine seu primeiro livro',
        color: '#c47a20',
        unlocked: false,
        mokaMood: 'completed-book',
      },
      {
        id: 'streak-7',
        matIcon: 'local_fire_department',
        title: '7 dias seguidos',
        description: 'Mantenha uma sequência de 7 dias',
        color: '#e07b54',
        unlocked: false,
        mokaMood: 'streak',
      },
      {
        id: 'streak-30',
        matIcon: 'diamond',
        title: 'Leitor do mês',
        description: 'Leia por 30 dias consecutivos',
        color: '#7c5c45',
        unlocked: false,
        mokaMood: 'streak',
      },
      {
        id: 'level-5',
        matIcon: 'star',
        title: 'Nível 5',
        description: 'Alcance o nível 5',
        color: '#c47a20',
        unlocked: false,
        mokaMood: 'goal',
      },
      {
        id: 'level-10',
        matIcon: 'grade',
        title: 'Nível 10',
        description: 'Alcance o nível 10',
        color: '#5da06a',
        unlocked: false,
        mokaMood: 'goal',
      },
      {
        id: 'night-owl',
        matIcon: 'bedtime',
        title: 'Coruja noturna',
        description: 'Leia após as 22h',
        color: '#7c5c45',
        unlocked: false,
        mokaMood: 'sleepy',
      },
      {
        id: 'first-mission',
        matIcon: 'track_changes',
        title: 'Primeira missão',
        description: 'Complete sua primeira missão diária',
        color: '#c47a20',
        unlocked: false,
        mokaMood: 'mission',
      },
      {
        id: 'all-missions',
        matIcon: 'verified',
        title: 'Dia perfeito',
        description: 'Complete todas as missões do dia',
        color: '#5da06a',
        unlocked: false,
        mokaMood: 'perfect-day',
      },
    ];
  }
}
