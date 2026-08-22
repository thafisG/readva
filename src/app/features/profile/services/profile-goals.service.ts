import { Injectable, inject, signal } from '@angular/core';
import type { ReadingGoals } from '../../../core/models/profile-statistics.model';
import { DashboardPreferencesService } from '../../dashboard/services/dashboard-preferences.service';

@Injectable()
export class ProfileGoalsService {
  private readonly preferences = inject(DashboardPreferencesService);
  private readonly goalsState = signal<ReadingGoals>(this.preferences.getReadingGoals());

  readonly goals = this.goalsState.asReadonly();

  update(goals: ReadingGoals): void {
    const sanitized: ReadingGoals = {
      dailyMinutes: this.clamp(goals.dailyMinutes, 5, 600),
      monthlyBooks: this.clamp(goals.monthlyBooks, 1, 50),
    };
    this.goalsState.set(sanitized);
    this.preferences.saveReadingGoals(sanitized);
    const progress = this.preferences.loadProgress({
      name: 'Leitor',
      avatar: '',
      currentStreak: 0,
      dailyGoalMinutes: sanitized.dailyMinutes,
      dailyMinutesRead: 0,
    });
    this.preferences.saveProgress({ ...progress, dailyGoalMinutes: sanitized.dailyMinutes });
  }

  private clamp(value: number, minimum: number, maximum: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed)
      ? Math.min(maximum, Math.max(minimum, Math.trunc(parsed)))
      : minimum;
  }
}
