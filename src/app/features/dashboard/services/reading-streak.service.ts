import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { calculateStreak, localDateKey } from '../../../core/domain/gamification.rules';
import type { ReadingActivity } from '../../../core/models/activity.model';
import { STORAGE_KEYS } from '../../../core/storage/storage.keys';
import { StorageService } from '../../../core/storage/storage.service';
import { AuthService } from './auth.service';

interface StreakState {
  markedDays: string[];
}

@Injectable({ providedIn: 'root' })
export class ReadingStreakService {
  private readonly auth = inject(AuthService);
  private readonly storage = inject(StorageService);
  private readonly markedDaysState = signal<string[]>([]);

  readonly markedDays = this.markedDaysState.asReadonly();

  constructor() {
    effect(() => {
      const email = this.auth.currentUser()?.email ?? 'guest';
      untracked(() => this.loadForUser(email));
    });
  }

  getMarkedDays(): string[] {
    return [...this.markedDaysState()];
  }

  toggleToday(): { marked: boolean; streak: number } {
    const today = localDateKey(new Date());
    const days = this.getMarkedDays();
    const marked = !days.includes(today);
    const updated = marked ? [...days, today] : days.filter((day) => day !== today);
    this.save(updated);
    return { marked, streak: calculateStreak(updated) };
  }

  currentStreak(): number {
    return calculateStreak(this.markedDaysState());
  }

  isTodayMarked(): boolean {
    return this.markedDaysState().includes(localDateKey(new Date()));
  }

  private loadForUser(email: string): void {
    const state = this.storage.readUser<StreakState>(
      STORAGE_KEYS.streak,
      email,
      { markedDays: [] },
      ['@readva:streak_data'],
    );
    const storedDays = this.validDays(state.markedDays);
    const activities = this.storage.readUser<ReadingActivity[]>(
      STORAGE_KEYS.activities,
      email,
      [],
      [`@readva:activities:${email}`],
    );
    const activityDays = activities.flatMap((activity) => {
      const date = new Date(activity.createdAt || activity.timestamp);
      return Number.isNaN(date.getTime()) ? [] : [localDateKey(date)];
    });
    const reconciledDays = [...new Set([...storedDays, ...activityDays])].sort();

    this.markedDaysState.set(reconciledDays);
    if (!this.sameDays(storedDays, reconciledDays)) {
      this.storage.writeUser(STORAGE_KEYS.streak, email, {
        markedDays: reconciledDays,
      } satisfies StreakState);
    }
  }

  private save(days: readonly string[]): void {
    const normalized = this.validDays(days);
    this.markedDaysState.set(normalized);
    this.storage.writeUser(STORAGE_KEYS.streak, this.auth.currentUser()?.email ?? 'guest', {
      markedDays: normalized,
    } satisfies StreakState);
  }

  private validDays(value: unknown): string[] {
    return Array.isArray(value)
      ? [...new Set(value.filter((day): day is string => /^\d{4}-\d{2}-\d{2}$/.test(day)))].sort()
      : [];
  }

  private sameDays(left: readonly string[], right: readonly string[]): boolean {
    return left.length === right.length && left.every((day, index) => day === right[index]);
  }
}
