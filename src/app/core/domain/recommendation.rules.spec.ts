import type { CatalogBook } from '../models/book.model';
import { buildReaderProfile, recommendBooks } from './recommendation.rules';

const catalog: CatalogBook[] = [
  {
    id: 2,
    title: 'Fantasia B',
    author: 'B',
    coverUrl: '',
    category: 'Fantasia',
    tags: [],
    difficulty: '',
    readingLevel: '',
  },
  {
    id: 1,
    title: 'Ciência A',
    author: 'A',
    coverUrl: '',
    category: 'Ciência',
    tags: [],
    difficulty: '',
    readingLevel: '',
  },
];

describe('recommendation rules', () => {
  it('handles an empty profile without division by zero', () => {
    expect(buildReaderProfile([])).toEqual({ favoriteCategory: '', categoryScore: {} });
    expect(recommendBooks(catalog, [], [])).toHaveLength(2);
  });

  it('uses current progress and explains the preferred category', () => {
    const suggestions = recommendBooks(
      catalog,
      [{ category: 'Fantasia', progress: 50, totalPages: 100 }],
      [],
    );
    expect(suggestions[0].title).toBe('Fantasia B');
    expect(suggestions[0].explanation).toContain('Fantasia');
  });

  it('ignores invalid totals and excludes books already being read', () => {
    const profile = buildReaderProfile([{ category: 'Ciência', progress: 10, totalPages: 0 }]);
    expect(Number.isFinite(profile.categoryScore['Ciência'])).toBe(true);
    expect(recommendBooks(catalog, [], ['Ciência A']).map((book) => book.title)).toEqual([
      'Fantasia B',
    ]);
  });
});
