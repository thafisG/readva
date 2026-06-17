import { Injectable, signal, computed } from '@angular/core';

export interface Mission {
  id: string;
  icon: string;
  title: string;
  description: string;
  xpReward: number;
  progress: number;
  target: number;
  completed: boolean;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
  unlocked: boolean;
}

export interface LevelInfo {
  level: number;
  currentLevelXp: number;
  xpForNextLevel: number;
  progressPercent: number;
}

const XP_PER_LEVEL = 500;

@Injectable({ providedIn: 'root' })
export class ChallengesService {
  private _totalXp = signal<number>(this.loadXp());
  private _missions = signal<Mission[]>(this.loadMissions());
  private _achievements = signal<Achievement[]>(this.loadAchievements());
  private _justUnlocked = signal<Achievement | null>(null);

  readonly missions = this._missions.asReadonly();
  readonly achievements = this._achievements.asReadonly();
  readonly justUnlocked = this._justUnlocked.asReadonly();

  readonly levelInfo = computed<LevelInfo>(() => {
    const xp = this._totalXp();
    const level = Math.floor(xp / XP_PER_LEVEL) + 1;
    const currentLevelXp = xp % XP_PER_LEVEL;
    const xpForNextLevel = XP_PER_LEVEL;
    const progressPercent = (currentLevelXp / xpForNextLevel) * 100;
    return { level, currentLevelXp, xpForNextLevel, progressPercent };
  });

  readonly unlockedCount = computed(() => this._achievements().filter((a) => a.unlocked).length);

  onPagesRead(pages: number): void {
    this.updateMissionProgress('read-pages', pages);
    this.updateMissionProgress('read-session', 1);
  }

  onMinutesRead(minutes: number): void {
    this.updateMissionProgress('read-minutes', minutes);
  }

  onBookStarted(): void {
    this.updateMissionProgress('start-book', 1);
  }

  onBookFinished(): void {
    this.updateMissionProgress('finish-book', 1);
    this.checkAchievement('first-book');
  }

  onStreakDay(streakDays: number): void {
    if (streakDays >= 7) this.checkAchievement('streak-7');
    if (streakDays >= 30) this.checkAchievement('streak-30');
  }

  onNightReading(): void {
    this.checkAchievement('night-owl');
  }

  dismissJustUnlocked(): void {
    this._justUnlocked.set(null);
  }

  resetDailyMissions(): void {
    const reset = this.defaultMissions().map((m) => ({ ...m, progress: 0, completed: false }));
    this._missions.set(reset);
    this.saveMissions(reset);
  }

  private updateMissionProgress(id: string, delta: number): void {
    this._missions.update((missions) => {
      const updated = missions.map((m) => {
        if (m.id !== id || m.completed) return m;
        const progress = Math.min(m.progress + delta, m.target);
        const completed = progress >= m.target;
        if (completed && !m.completed) this.grantXp(m.xpReward);
        return { ...m, progress, completed };
      });
      this.saveMissions(updated);
      return updated;
    });
  }

  private grantXp(amount: number): void {
    this._totalXp.update((xp) => {
      const next = xp + amount;
      localStorage.setItem('challenges_xp', String(next));
      return next;
    });
    const { level } = this.levelInfo();
    if (level >= 5) this.checkAchievement('level-5');
    if (level >= 10) this.checkAchievement('level-10');
  }

  private checkAchievement(id: string): void {
    this._achievements.update((list) => {
      const idx = list.findIndex((a) => a.id === id);
      if (idx === -1 || list[idx].unlocked) return list;
      const updated = list.map((a, i) => (i === idx ? { ...a, unlocked: true } : a));
      this._justUnlocked.set(updated[idx]);
      this.saveAchievements(updated);
      setTimeout(() => this._justUnlocked.set(null), 4000);
      return updated;
    });
  }

  private loadXp(): number {
    return Number(localStorage.getItem('challenges_xp') ?? 0);
  }

  private loadMissions(): Mission[] {
    try {
      const raw = localStorage.getItem('challenges_missions');
      if (raw) {
        const saved: Mission[] = JSON.parse(raw);
        const today = new Date().toDateString();
        const savedDay = localStorage.getItem('challenges_missions_day');
        if (savedDay === today) return saved;
      }
    } catch {}
    const missions = this.defaultMissions();
    this.saveMissions(missions);
    return missions;
  }

  private saveMissions(missions: Mission[]): void {
    localStorage.setItem('challenges_missions', JSON.stringify(missions));
    localStorage.setItem('challenges_missions_day', new Date().toDateString());
  }

  private loadAchievements(): Achievement[] {
    try {
      const raw = localStorage.getItem('challenges_achievements');
      if (raw) return JSON.parse(raw);
    } catch {}
    return this.defaultAchievements();
  }

  private saveAchievements(achievements: Achievement[]): void {
    localStorage.setItem('challenges_achievements', JSON.stringify(achievements));
  }

  private defaultMissions(): Mission[] {
    return [
      {
        id: 'read-pages',
        icon: '📖',
        title: 'Leitor do dia',
        description: 'Leia 20 páginas hoje',
        xpReward: 50,
        progress: 0,
        target: 20,
        completed: false,
      },
      {
        id: 'read-minutes',
        icon: '⏱️',
        title: 'Maratona de leitura',
        description: 'Leia por 30 minutos',
        xpReward: 60,
        progress: 0,
        target: 30,
        completed: false,
      },
      {
        id: 'read-session',
        icon: '🔥',
        title: 'Consistência',
        description: 'Registre uma sessão de leitura',
        xpReward: 30,
        progress: 0,
        target: 1,
        completed: false,
      },
      {
        id: 'start-book',
        icon: '📚',
        title: 'Novo começo',
        description: 'Adicione um novo livro à sua lista',
        xpReward: 40,
        progress: 0,
        target: 1,
        completed: false,
      },
    ];
  }

  private defaultAchievements(): Achievement[] {
    return [
      {
        id: 'first-book',
        icon: '🏆',
        title: 'Primeiro livro',
        description: 'Termine seu primeiro livro',
        color: '#f59e0b',
        unlocked: false,
      },
      {
        id: 'streak-7',
        icon: '🔥',
        title: '7 dias seguidos',
        description: 'Mantenha uma sequência de 7 dias',
        color: '#ef4444',
        unlocked: false,
      },
      {
        id: 'streak-30',
        icon: '💎',
        title: 'Leitor do mês',
        description: 'Leia por 30 dias consecutivos',
        color: '#3b82f6',
        unlocked: false,
      },
      {
        id: 'level-5',
        icon: '⭐',
        title: 'Nível 5',
        description: 'Alcance o nível 5',
        color: '#8b5cf6',
        unlocked: false,
      },
      {
        id: 'level-10',
        icon: '🌟',
        title: 'Nível 10',
        description: 'Alcance o nível 10',
        color: '#10b981',
        unlocked: false,
      },
      {
        id: 'night-owl',
        icon: '🦉',
        title: 'Coruja noturna',
        description: 'Leia após as 22h',
        color: '#6366f1',
        unlocked: false,
      },
    ];
  }
}
