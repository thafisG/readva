import { Injectable, inject } from '@angular/core';
import { calculateStreak, localDateKey } from '../../../core/domain/gamification.rules';
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

  getMarkedDays(): string[] {
    const email = this.auth.currentUser()?.email ?? 'guest';
    const state = this.storage.readUser<StreakState>(
      STORAGE_KEYS.streak,
      email,
      { markedDays: [] },
      ['@readva:streak_data'],
    );
    return Array.isArray(state.markedDays)
      ? [...new Set(state.markedDays.filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day)))]
      : [];
  }

  toggleToday(): { marked: boolean; streak: number } {
    const today = localDateKey(new Date());
    const days = this.getMarkedDays();
    const marked = !days.includes(today);
    const updated = marked ? [...days, today] : days.filter((day) => day !== today);
    this.storage.writeUser(STORAGE_KEYS.streak, this.auth.currentUser()?.email ?? 'guest', {
      markedDays: updated,
    } satisfies StreakState);
    return { marked, streak: calculateStreak(updated) };
  }

  currentStreak(): number {
    return calculateStreak(this.getMarkedDays());
  }
  isTodayMarked(): boolean {
    return this.getMarkedDays().includes(localDateKey(new Date()));
  }
}
