import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ReadingTimerService {
  readonly elapsedSeconds = signal(0);
  readonly isRunning = signal(false);
  readonly isMinimized = signal(false);
  readonly activeBookId = signal<string | null>(null);
  readonly hasSession = computed(
    () => this.activeBookId() !== null && (this.isRunning() || this.elapsedSeconds() > 0),
  );
  readonly formattedTime = computed(() => this.format(this.elapsedSeconds()));

  private startedAt: number | null = null;
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearInterval());
  }

  toggle(bookId: string): void {
    if (this.isRunning()) this.pause();
    else this.start(bookId);
  }

  start(bookId: string): void {
    if (!bookId || this.isRunning()) return;
    if (this.activeBookId() !== bookId) this.reset();
    this.activeBookId.set(bookId);
    this.startedAt = Date.now() - this.elapsedSeconds() * 1000;
    this.isRunning.set(true);
    this.interval = setInterval(() => this.sync(), 250);
  }

  pause(): void {
    if (!this.isRunning()) return;
    this.sync();
    this.isRunning.set(false);
    this.startedAt = null;
    this.clearInterval();
  }

  reset(): void {
    this.pause();
    this.elapsedSeconds.set(0);
    this.activeBookId.set(null);
    this.isMinimized.set(false);
  }

  minimize(): void {
    if (this.hasSession()) this.isMinimized.set(true);
  }

  restore(): void {
    this.isMinimized.set(false);
  }

  dismiss(): void {
    this.reset();
  }
  private sync(): void {
    if (this.startedAt === null) return;
    this.elapsedSeconds.set(Math.floor((Date.now() - this.startedAt) / 1000));
  }

  private clearInterval(): void {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
  }

  private format(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
}
