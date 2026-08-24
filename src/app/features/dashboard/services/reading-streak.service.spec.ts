import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ReadingActivity } from '../../../core/models/activity.model';
import { StorageService } from '../../../core/storage/storage.service';
import { AuthService } from './auth.service';
import { ReadingStreakService } from './reading-streak.service';

describe('ReadingStreakService synchronization', () => {
  it('merges stored streak days with dates from existing activities', () => {
    const existingActivity = {
      id: 'activity-1',
      userId: 'reader@example.com',
      userName: 'Leitor',
      userAvatar: '',
      actionType: 'progress',
      bookId: 'book-1',
      bookTitle: 'Livro',
      bookAuthor: 'Autora',
      detail: 'Leu mais 10 páginas',
      timestamp: '2026-08-23T14:00:00',
      pagesRead: 10,
      likes: 0,
      commentsCount: 0,
      hasLiked: false,
    } satisfies ReadingActivity;
    const writeUser = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        ReadingStreakService,
        {
          provide: AuthService,
          useValue: { currentUser: signal({ email: 'reader@example.com' }) },
        },
        {
          provide: StorageService,
          useValue: {
            readUser: vi.fn((key: string, _email: string, fallback: unknown) => {
              if (key === 'streak') return { markedDays: ['2026-08-22'] };
              if (key === 'activities') return [existingActivity];
              return fallback;
            }),
            writeUser,
          },
        },
      ],
    });

    const service = TestBed.inject(ReadingStreakService);
    TestBed.tick();

    expect(service.markedDays()).toEqual(['2026-08-22', '2026-08-23']);
    expect(writeUser).toHaveBeenCalledWith('streak', 'reader@example.com', {
      markedDays: ['2026-08-22', '2026-08-23'],
    });
  });
});
