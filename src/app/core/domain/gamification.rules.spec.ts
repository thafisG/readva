import { calculateLevel, calculateStreak, localDateKey } from './gamification.rules';

describe('gamification rules', () => {
  it('keeps level progress within its bounds', () => {
    expect(calculateLevel(Number.NaN)).toEqual({
      level: 1,
      currentLevelXp: 0,
      xpForNextLevel: 100,
      progressPercent: 0,
    });
    expect(calculateLevel(100)).toMatchObject({ level: 2, currentLevelXp: 0, progressPercent: 0 });
  });

  it('counts consecutive days across month and year boundaries', () => {
    const today = new Date(2026, 0, 1, 12);
    expect(calculateStreak(['2025-12-30', '2025-12-31', '2026-01-01'], today)).toBe(3);
  });

  it('uses a stable local calendar key', () => {
    expect(localDateKey(new Date(2026, 7, 8, 23, 59))).toBe('2026-08-08');
  });
});
