import type { ReadingActivity } from '../models/activity.model';
import type { Book } from '../models/book.model';
import { buildReaderStatistics } from './profile-statistics.rules';

describe('profile statistics rules', () => {
  const books: Book[] = [
    {
      id: 'book-1',
      title: 'Livro um',
      author: 'Autora',
      coverUrl: '',
      totalPages: 200,
      currentPage: 200,
      category: 'Fantasia',
      status: 'completed',
      completedAt: '2026-08-19T12:00:00',
    },
    {
      id: 'book-2',
      title: 'Livro dois',
      author: 'Autor',
      coverUrl: '',
      totalPages: 300,
      currentPage: 90,
      category: 'Fantasia',
      status: 'reading',
    },
  ];

  const activities: ReadingActivity[] = [
    {
      id: 'activity-1',
      userId: 'reader@test.com',
      userName: 'Reader',
      userAvatar: '',
      actionType: 'progress',
      bookId: 'book-1',
      bookTitle: 'Livro um',
      bookAuthor: 'Autora',
      detail: 'Leu mais 40 páginas',
      timestamp: '2026-08-19T12:00:00',
      minutesRead: 30,
      pagesRead: 40,
      likes: 0,
      commentsCount: 0,
      hasLiked: false,
    },
  ];

  it('aggregates totals, periods and favorite categories', () => {
    const result = buildReaderStatistics(
      books,
      activities,
      ['2026-08-19', '2026-08-20', '2026-08-21'],
      new Date(2026, 7, 21, 12),
    );

    expect(result).toMatchObject({
      totalBooks: 2,
      completedBooks: 1,
      pagesRead: 290,
      minutesRead: 30,
      sessions: 1,
      currentStreak: 3,
    });
    expect(result.week).toMatchObject({ minutes: 30, pages: 40, completedBooks: 1 });
    expect(result.month.completedBooks).toBe(1);
    expect(result.categories[0]).toEqual({ name: 'Fantasia', books: 2, percentage: 100 });
  });

  it('returns safe empty statistics', () => {
    const result = buildReaderStatistics([], [], [], new Date(2026, 7, 21, 12));
    expect(result.minutesRead).toBe(0);
    expect(result.averageSessionMinutes).toBe(0);
    expect(result.weekDays).toHaveLength(7);
    expect(result.categories).toEqual([]);
  });
});
