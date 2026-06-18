import { Injectable, signal, computed } from '@angular/core';
import { MokaMood } from '../../moka/moka.component';

export interface Mission {
  id: string;
  matIcon: string;
  title: string;
  description: string;
  xpReward: number;
  progress: number;
  target: number;
  completed: boolean;
}

export interface Achievement {
  id: string;
  matIcon: string;
  title: string;
  description: string;
  color: string;
  unlocked: boolean;
  mokaMood: MokaMood;
}

export interface LevelInfo {
  level: number;
  currentLevelXp: number;
  xpForNextLevel: number;
  progressPercent: number;
}

function xpRequiredForLevel(level: number): number {
  return 100 + (level - 1) * 50;
}

@Injectable({ providedIn: 'root' })
export class ChallengesService {
  private _totalXp = signal<number>(this.loadXp());
  private _missions = signal<Mission[]>(this.loadMissions());
  private _achievements = signal<Achievement[]>(this.loadAchievements());
  private _justUnlocked = signal<Achievement | null>(null);
  private _justUnlockedMood = signal<MokaMood | null>(null);

  readonly missions = this._missions.asReadonly();
  readonly achievements = this._achievements.asReadonly();
  readonly justUnlocked = this._justUnlocked.asReadonly();
  readonly justUnlockedMood = this._justUnlockedMood.asReadonly();

  readonly levelInfo = computed<LevelInfo>(() => {
    let remaining = this._totalXp();
    let level = 1;

    while (true) {
      const needed = xpRequiredForLevel(level);
      if (remaining < needed) {
        return {
          level,
          currentLevelXp: remaining,
          xpForNextLevel: needed,
          progressPercent: (remaining / needed) * 100,
        };
      }
      remaining -= needed;
      level++;
    }
  });

  readonly unlockedCount = computed(() => this._achievements().filter((a) => a.unlocked).length);

  onPagesRead(pages: number): void {
    this.updateMissionProgress('read-pages', pages);
  }

  onReadingSession(): void {
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
    this._justUnlockedMood.set(null);
  }

  resetDailyMissions(): void {
    const reset = this.defaultMissions().map((m) => ({ ...m, progress: 0, completed: false }));
    this._missions.set(reset);
    this.saveMissions(reset);
  }

  private updateMissionProgress(id: string, delta: number): void {
    this._missions.update((missions) => {
      let missionJustCompleted = false;
      let xpDelta = 0;

      const updated = missions.map((m) => {
        if (m.id !== id) return m;

        const progress = Math.max(0, Math.min(m.progress + delta, m.target));
        const completed = progress >= m.target;

        if (completed && !m.completed) {
          xpDelta += m.xpReward;
          missionJustCompleted = true;
        } else if (!completed && m.completed) {
          xpDelta -= m.xpReward;
        }

        return { ...m, progress, completed };
      });

      this.saveMissions(updated);

      if (xpDelta !== 0) {
        this.adjustXp(xpDelta);
      }

      if (missionJustCompleted) {
        const allDone = updated.every((m) => m.completed);
        if (allDone) this.checkAchievement('all-missions');
        else this.checkAchievement('first-mission');
      }

      return updated;
    });
  }

  private adjustXp(amount: number): void {
    this._totalXp.update((xp) => {
      const next = Math.max(0, xp + amount);
      localStorage.setItem('challenges_xp', String(next));
      return next;
    });

    if (amount > 0) {
      const { level } = this.levelInfo();
      if (level >= 5) this.checkAchievement('level-5');
      if (level >= 10) this.checkAchievement('level-10');
    }
  }

  private checkAchievement(id: string): void {
    this._achievements.update((list) => {
      const idx = list.findIndex((a) => a.id === id);
      if (idx === -1 || list[idx].unlocked) return list;
      const updated = list.map((a, i) => (i === idx ? { ...a, unlocked: true } : a));
      const unlocked = updated[idx];
      this._justUnlocked.set(unlocked);
      this._justUnlockedMood.set(unlocked.mokaMood);
      this.saveAchievements(updated);
      setTimeout(() => this._justUnlocked.set(null), 5000);
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
        matIcon: 'menu_book',
        title: 'Leitor do dia',
        description: 'Leia 20 páginas hoje',
        xpReward: 50,
        progress: 0,
        target: 20,
        completed: false,
      },
      {
        id: 'read-minutes',
        matIcon: 'timer',
        title: 'Maratona de leitura',
        description: 'Leia por 30 minutos',
        xpReward: 60,
        progress: 0,
        target: 30,
        completed: false,
      },
      {
        id: 'read-session',
        matIcon: 'local_fire_department',
        title: 'Consistência',
        description: 'Registre uma sessão de leitura',
        xpReward: 30,
        progress: 0,
        target: 1,
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
