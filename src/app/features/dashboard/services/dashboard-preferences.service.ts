import { Injectable, inject } from '@angular/core';
import { localDateKey } from '../../../core/domain/gamification.rules';
import { StorageService } from '../../../core/storage/storage.service';
import { AuthService } from './auth.service';
import type { UserProgress } from '../interfaces/dashboard.interface';

interface DailyValue<T> {
  day: string;
  value: T;
}

@Injectable({ providedIn: 'root' })
export class DashboardPreferencesService {
  private readonly auth = inject(AuthService);
  private readonly storage = inject(StorageService);
  private get email(): string {
    return this.auth.currentUser()?.email ?? 'guest';
  }

  getLastLogin(): string | null {
    return this.storage.readUser('last-login', this.email, null, [
      `@readva:last-login:${this.email}`,
    ]);
  }
  recordLogin(): void {
    this.storage.writeUser('last-login', this.email, new Date().toISOString());
  }
  wasWelcomeShownToday(): boolean {
    return this.storage.readUser('moka-welcome', this.email, '') === localDateKey(new Date());
  }
  markWelcomeShown(): void {
    this.storage.writeUser('moka-welcome', this.email, localDateKey(new Date()));
  }

  getCoffeeCount(): number {
    const daily = this.storage.readUser<DailyValue<number>>('coffee', this.email, {
      day: '',
      value: 0,
    });
    return daily.day === localDateKey(new Date()) && Number.isFinite(daily.value)
      ? Math.max(0, daily.value)
      : 0;
  }
  addCoffee(count: number): number {
    const total =
      this.getCoffeeCount() + Math.max(0, Math.trunc(Number.isFinite(count) ? count : 0));
    this.storage.writeUser('coffee', this.email, {
      day: localDateKey(new Date()),
      value: total,
    } satisfies DailyValue<number>);
    return total;
  }

  loadProgress(fallback: UserProgress): UserProgress {
    const daily = this.storage.readUser<DailyValue<UserProgress>>(
      'daily-progress',
      this.email,
      { day: '', value: fallback },
      [`@readva:daily-progress:${this.email}`],
    );
    return daily.day === localDateKey(new Date()) ? daily.value : fallback;
  }
  saveProgress(progress: UserProgress): void {
    this.storage.writeUser('daily-progress', this.email, {
      day: localDateKey(new Date()),
      value: progress,
    } satisfies DailyValue<UserProgress>);
  }
  isFirstPostToday(): boolean {
    return this.storage.readUser('first-post', this.email, '') === localDateKey(new Date());
  }
  markFirstPostToday(): void {
    this.storage.writeUser('first-post', this.email, localDateKey(new Date()));
  }
}
