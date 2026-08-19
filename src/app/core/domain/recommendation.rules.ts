import type { CatalogBook, BookSuggestion } from '../models/book.model';

export interface ReadingPreference {
  category?: string;
  completed?: boolean;
  progress?: number;
  totalPages?: number;
  likes?: number;
}

export interface ReaderProfile {
  favoriteCategory: string;
  categoryScore: Record<string, number>;
}

export function buildReaderProfile(readings: readonly ReadingPreference[]): ReaderProfile {
  const scores: Record<string, number> = {};
  for (const reading of readings) {
    const category = reading.category?.trim() || 'Sem categoria';
    const totalPages = safePositive(reading.totalPages);
    const progress = Math.min(safeNonNegative(reading.progress), totalPages || 0);
    scores[category] =
      (scores[category] ?? 0) +
      1 +
      (reading.completed ? 2 : 0) +
      (totalPages ? (progress / totalPages) * 2 : 0) +
      safeNonNegative(reading.likes) * 0.1;
  }
  const entries = Object.entries(scores);
  if (!entries.length) return { favoriteCategory: '', categoryScore: {} };
  const maxScore = Math.max(1, ...entries.map(([, score]) => score));
  return {
    favoriteCategory: entries.reduce((best, current) => (current[1] > best[1] ? current : best))[0],
    categoryScore: Object.fromEntries(
      entries.map(([category, score]) => [category, score / maxScore]),
    ),
  };
}

export function recommendBooks(
  catalog: readonly CatalogBook[],
  readings: readonly ReadingPreference[],
  excludedTitles: readonly string[],
  limit = 3,
): BookSuggestion[] {
  const profile = buildReaderProfile(readings);
  const excluded = new Set(excludedTitles.map((title) => title.trim().toLocaleLowerCase()));
  return [...catalog]
    .filter((book) => !excluded.has(book.title.trim().toLocaleLowerCase()))
    .sort(
      (a, b) =>
        (profile.categoryScore[b.category] ?? 0) - (profile.categoryScore[a.category] ?? 0) ||
        a.id - b.id,
    )
    .slice(0, Math.max(0, limit))
    .map((book) => {
      const score = profile.categoryScore[book.category] ?? 0;
      return {
        id: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
        category: book.category,
        matchPercentage: readings.length ? Math.round(score * 100) : 0,
        explanation:
          readings.length && score > 0
            ? `Indicado porque você lê ${book.category}`
            : `Sugestão da categoria ${book.category || 'Sem categoria'}`,
      };
    });
}

function safeNonNegative(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(0, value!) : 0;
}

function safePositive(value: number | undefined): number {
  return Number.isFinite(value) && value! > 0 ? value! : 0;
}
