import { TestBed } from '@angular/core/testing';
import { ReadingTimerService } from './reading-timer.service';

describe('ReadingTimerService', () => {
  afterEach(() => vi.useRealTimers());

  it('keeps an accurate active session', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T10:00:00'));
    const timer = TestBed.inject(ReadingTimerService);

    timer.start('book-1');
    vi.advanceTimersByTime(6500);

    expect(timer.elapsedSeconds()).toBe(6);
    expect(timer.formattedTime()).toBe('00:06');

    timer.pause();
    vi.advanceTimersByTime(3000);
    expect(timer.elapsedSeconds()).toBe(6);
  });

  it('only exposes the clock after an active session is minimized', () => {
    const timer = TestBed.inject(ReadingTimerService);

    timer.minimize();
    expect(timer.isMinimized()).toBe(false);

    timer.start('book-1');
    expect(timer.isMinimized()).toBe(false);

    timer.minimize();
    expect(timer.isMinimized()).toBe(true);

    timer.restore();
    expect(timer.isMinimized()).toBe(false);
    timer.reset();
  });

  it('ends and clears the session when the manager is dismissed', () => {
    const timer = TestBed.inject(ReadingTimerService);
    timer.start('book-1');
    timer.minimize();

    timer.dismiss();

    expect(timer.isRunning()).toBe(false);
    expect(timer.isMinimized()).toBe(false);
    expect(timer.activeBookId()).toBeNull();
    expect(timer.elapsedSeconds()).toBe(0);
  });

  it('resets when a different book starts a session', () => {
    const timer = TestBed.inject(ReadingTimerService);
    timer.elapsedSeconds.set(90);
    timer.activeBookId.set('book-1');

    timer.start('book-2');

    expect(timer.activeBookId()).toBe('book-2');
    expect(timer.elapsedSeconds()).toBe(0);
    timer.reset();
  });
});
