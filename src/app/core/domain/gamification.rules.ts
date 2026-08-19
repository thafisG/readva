import type { LevelInfo } from '../models/gamification.model';

export function xpRequiredForLevel(level: number): number {
  return 100 + Math.max(0, level - 1) * 50;
}

export function calculateLevel(totalXp: number): LevelInfo {
  let remaining = Math.max(0, Math.trunc(Number.isFinite(totalXp) ? totalXp : 0));
  let level = 1;
  while (remaining >= xpRequiredForLevel(level)) {
    remaining -= xpRequiredForLevel(level);
    level += 1;
  }
  const required = xpRequiredForLevel(level);
  return {
    level,
    currentLevelXp: remaining,
    xpForNextLevel: required,
    progressPercent: Math.min(100, (remaining / required) * 100),
  };
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateStreak(markedDays: readonly string[], today = new Date()): number {
  const marked = new Set(markedDays);
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!marked.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (marked.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
