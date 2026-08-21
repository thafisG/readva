import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ReadingActivity } from '../../../core/models/activity.model';
import type { UserSession } from '../../../core/models/user.model';
import type { StoragePort } from '../../../core/storage/storage.port';
import { STORAGE_PORT } from '../../../core/storage/storage.port';
import { StorageService } from '../../../core/storage/storage.service';
import { AuthService } from './auth.service';
import { BookCatalogService } from './book-catalog.service';
import { BookService } from './book.service';
import { ChallengesService } from './challenges.service';

class MemoryStorage implements StoragePort {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
  removeItem(key: string): void {
    this.values.delete(key);
  }
}

class AuthStub {
  readonly currentUser = signal<UserSession | null>({
    email: 'reader@example.com',
    name: 'Reader',
    avatar: 'reader.png',
  });
}

const catalogStub = {
  generateCoverFallback: vi.fn(() => 'fallback.svg'),
  fetchBookCover: vi.fn(async () => null),
};

const challengesStub = {
  onBookStarted: vi.fn(),
  onPagesRead: vi.fn(),
  onReadingSession: vi.fn(),
  onMinutesRead: vi.fn(),
  onNightReading: vi.fn(),
  onBookFinished: vi.fn(),
};

describe('BookService', () => {
  let service: BookService;
  let storage: MemoryStorage;
  let storageService: StorageService;

  beforeEach(() => {
    storage = new MemoryStorage();
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        BookService,
        StorageService,
        { provide: STORAGE_PORT, useValue: storage },
        { provide: AuthService, useClass: AuthStub },
        { provide: BookCatalogService, useValue: catalogStub },
        { provide: ChallengesService, useValue: challengesStub },
      ],
    });
    service = TestBed.inject(BookService);
    storageService = TestBed.inject(StorageService);
  });

  it('normalizes and persists a newly started book', async () => {
    await service.startNewBook('  Dom Casmurro ', ' Machado de Assis ', 256.8, '  Clássico ');

    expect(service.myCurrentBook()[0]).toMatchObject({
      title: 'Dom Casmurro',
      author: 'Machado de Assis',
      totalPages: 256,
      currentPage: 0,
      category: 'Clássico',
      status: 'reading',
    });
    expect(challengesStub.onBookStarted).toHaveBeenCalledOnce();
    expect(storage.values.has(storageService.userKey('books', 'reader@example.com'))).toBe(true);
  });

  it('rejects invalid books and reopens an existing book instead of duplicating it', async () => {
    await service.startNewBook('', 'Autor', 100, 'Ficção');
    expect(service.myBooks()).toHaveLength(0);

    await service.startNewBook('Livro', 'Autor', 100, 'Ficção');
    const id = service.myBooks()[0].id;
    service.moveToLibrary(id);
    await service.startNewBook(' livro ', ' autor ', 200, 'Outra');

    expect(service.myBooks()).toHaveLength(1);
    expect(service.myCurrentBook().map((book) => book.id)).toEqual([id]);
    expect(challengesStub.onBookStarted).toHaveBeenCalledOnce();
  });

  it('caps progress at the total and records only the pages actually read', async () => {
    await service.startNewBook('Livro', 'Autor', 100, 'Ficção', 'cover.png');
    const id = service.myBooks()[0].id;

    service.registerProgress(id, 140, '  Ótimo  ', 35);

    expect(service.myCurrentBook()[0].currentPage).toBe(100);
    expect(service.myActivities()[0]).toMatchObject({
      bookId: id,
      pagesRead: 100,
      minutesRead: 35,
      comment: 'Ótimo',
    });
    expect(challengesStub.onPagesRead).toHaveBeenCalledWith(100);
    expect(challengesStub.onMinutesRead).toHaveBeenCalledWith(35);
    expect(challengesStub.onReadingSession).toHaveBeenCalledOnce();
  });

  it('completes a book idempotently', async () => {
    await service.startNewBook('Livro', 'Autor', 100, 'Ficção', 'cover.png');
    const id = service.myBooks()[0].id;

    service.markCompleted(id);
    service.markCompleted(id);

    expect(service.myBooks()[0]).toMatchObject({ status: 'completed', currentPage: 100 });
    expect(service.myCurrentBook()).toHaveLength(0);
    expect(challengesStub.onBookFinished).toHaveBeenCalledOnce();
    expect(challengesStub.onBookFinished).toHaveBeenCalledWith(id);
  });

  it('updates likes and removes activities together with a deleted book', async () => {
    await service.startNewBook('Livro', 'Autor', 100, 'Ficção', 'cover.png');
    const id = service.myBooks()[0].id;
    service.registerProgress(id, 10, '', 0);
    const activityId = service.myActivities()[0].id;

    service.toggleActivityLike(activityId);
    expect(service.myActivities()[0]).toMatchObject({ hasLiked: true, likes: 1 });
    service.toggleActivityLike(activityId);
    expect(service.myActivities()[0]).toMatchObject({ hasLiked: false, likes: 0 });

    service.deleteBook(id);
    expect(service.myBooks()).toHaveLength(0);
    expect(service.myActivities()).toHaveLength(0);
  });

  it('loads data only from the active user namespace', () => {
    const otherActivity = { id: 'other-activity' } as ReadingActivity;
    storageService.writeUser('activities', 'other@example.com', [otherActivity]);

    expect(service.myActivities()).toEqual([]);
    expect(storage.values.has(storageService.userKey('activities', 'other@example.com'))).toBe(
      true,
    );
  });
});
