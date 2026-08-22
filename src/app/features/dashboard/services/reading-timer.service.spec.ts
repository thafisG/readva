import { TestBed } from '@angular/core/testing';
import { ReadingTimerService } from './reading-timer.service';

describe('ReadingTimerService', () => {
  afterEach(() => vi.useRealTimers());

  it('keeps an accurate session while the manager is closed', () => {
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
