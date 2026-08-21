import { Injectable, effect, inject, signal } from '@angular/core';
import type { ReadingActivity } from '../../../core/models/activity.model';
import type { Book } from '../../../core/models/book.model';
import { STORAGE_KEYS } from '../../../core/storage/storage.keys';
import { StorageService } from '../../../core/storage/storage.service';
import { AuthService } from './auth.service';
import { BookCatalogService } from './book-catalog.service';
import { ChallengesService } from './challenges.service';

export type BookUpdate = Partial<
  Pick<Book, 'title' | 'author' | 'totalPages' | 'currentPage' | 'category' | 'status'>
>;

@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly auth = inject(AuthService);
  private readonly catalog = inject(BookCatalogService);
  private readonly challenges = inject(ChallengesService);
  private readonly storage = inject(StorageService);

  readonly myBooks = signal<Book[]>([]);
  readonly myCurrentBook = signal<Book[]>([]);
  readonly myActivities = signal<ReadingActivity[]>([]);

  constructor() {
    effect(() => this.loadUserData(this.auth.currentUser()?.email ?? 'guest'));
  }

  async startNewBook(
    title: string,
    author: string,
    totalPages: number,
    category: string,
    coverUrl?: string,
  ): Promise<void> {
    const cleanTitle = title.trim();
    const cleanAuthor = author.trim();
    const pages = this.positiveInteger(totalPages);
    if (!cleanTitle || !cleanAuthor || pages === 0) return;

    const duplicate = this.myBooks().find(
      (book) =>
        book.title.toLocaleLowerCase() === cleanTitle.toLocaleLowerCase() &&
        book.author.toLocaleLowerCase() === cleanAuthor.toLocaleLowerCase(),
    );
    if (duplicate) {
      this.moveToCurrentReading(duplicate.id);
      return;
    }

    const book: Book = {
      id: this.createId(),
      title: cleanTitle,
      author: cleanAuthor,
      totalPages: pages,
      category: category.trim() || 'Sem categoria',
      currentPage: 0,
      status: 'reading',
      createdAt: new Date().toISOString(),
      coverUrl: coverUrl || this.catalog.generateCoverFallback(cleanTitle, cleanAuthor),
    };
    this.myCurrentBook.update((books) => [...books, book]);
    this.myBooks.update((books) => [...books, book]);
    this.persistBooks();
    this.challenges.onBookStarted();

    if (!coverUrl) {
      const cover = await this.catalog.fetchBookCover(cleanTitle, cleanAuthor);
      if (cover && !cover.startsWith('data:image/svg+xml')) this.updateBook(book.id, {}, cover);
    }
  }

  registerProgress(bookId: string, pages: number, comment: string, minutesRead = 0): void {
    const current = this.myCurrentBook().find((book) => book.id === bookId);
    const user = this.auth.currentUser();
    const safePages = this.nonNegativeInteger(pages);
    const safeMinutes = this.nonNegativeInteger(minutesRead);
    if (!current || !user || (safePages === 0 && safeMinutes === 0)) return;

    const nextPage = Math.min(current.currentPage + safePages, current.totalPages);
    const actualPages = nextPage - current.currentPage;
    this.updateBook(bookId, { currentPage: nextPage });
    const activity: ReadingActivity = {
      id: this.createId(),
      userId: user.email,
      userName: user.name,
      userAvatar: user.avatar,
      actionType: 'progress',
      bookId,
      bookTitle: current.title,
      bookAuthor: current.author,
      bookCategory: current.category,
      detail: `Leu mais ${actualPages} páginas${safeMinutes ? ` • ${safeMinutes} min de leitura` : ''}`,
      comment: comment.trim(),
      minutesRead: safeMinutes,
      pagesRead: actualPages,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      likes: 0,
      commentsCount: 0,
      hasLiked: false,
      isOwner: true,
    };
    this.myActivities.update((activities) => [activity, ...activities]);
    this.persistActivities();
    if (actualPages > 0) this.challenges.onPagesRead(actualPages);
    this.challenges.onReadingSession();
    if (safeMinutes > 0) this.challenges.onMinutesRead(safeMinutes);
    if (new Date().getHours() >= 22) this.challenges.onNightReading();
  }

  updateBook(id: string, data: BookUpdate, coverUrl?: string): void {
    const update = (book: Book): Book => {
      if (book.id !== id) return book;
      const totalPages =
        data.totalPages === undefined ? book.totalPages : this.positiveInteger(data.totalPages);
      const currentPage = Math.min(
        this.nonNegativeInteger(data.currentPage ?? book.currentPage),
        totalPages || book.totalPages,
      );
      return {
        ...book,
        ...data,
        ...(coverUrl ? { coverUrl } : {}),
        totalPages: totalPages || book.totalPages,
        currentPage,
      };
    };
    this.myCurrentBook.update((books) => books.map(update));
    this.myBooks.update((books) => books.map(update));
    this.persistBooks();
  }

  moveToLibrary(id: string): void {
    const book = this.myCurrentBook().find((candidate) => candidate.id === id);
    if (!book) return;
    this.myCurrentBook.update((books) => books.filter((candidate) => candidate.id !== id));
    if (!this.myBooks().some((candidate) => candidate.id === id))
      this.myBooks.update((books) => [...books, book]);
    this.persistBooks();
  }

  markCompleted(id: string): void {
    const book = this.myBooks().find((candidate) => candidate.id === id);
    if (!book || book.status === 'completed' || book.completedAt) return;
    const completed: Book = {
      ...book,
      currentPage: book.totalPages,
      status: 'completed',
      completedAt: new Date().toISOString(),
    };
    this.myBooks.update((books) =>
      books.map((candidate) => (candidate.id === id ? completed : candidate)),
    );
    this.myCurrentBook.update((books) => books.filter((candidate) => candidate.id !== id));
    this.persistBooks();
    this.challenges.onBookFinished(id);
  }

  deleteBook(id: string): void {
    this.myCurrentBook.update((books) => books.filter((book) => book.id !== id));
    this.myBooks.update((books) => books.filter((book) => book.id !== id));
    this.myActivities.update((activities) =>
      activities.filter((activity) => activity.bookId !== id),
    );
    this.persistBooks();
    this.persistActivities();
  }

  moveToCurrentReading(bookId: string): void {
    const book = this.myBooks().find((candidate) => candidate.id === bookId);
    if (!book || this.myCurrentBook().some((candidate) => candidate.id === bookId)) return;
    const { completedAt, ...stored } = book;
    void completedAt;
    const reading: Book = { ...stored, status: 'reading' };
    this.myCurrentBook.update((books) => [...books, reading]);
    this.myBooks.update((books) =>
      books.map((candidate) => (candidate.id === bookId ? reading : candidate)),
    );
    this.persistBooks();
  }

  deleteActivity(activityId: string): void {
    this.myActivities.update((activities) =>
      activities.filter((activity) => activity.id !== activityId),
    );
    this.persistActivities();
  }

  toggleActivityLike(activityId: string): void {
    this.myActivities.update((activities) =>
      activities.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              hasLiked: !activity.hasLiked,
              likes: Math.max(0, activity.likes + (activity.hasLiked ? -1 : 1)),
            }
          : activity,
      ),
    );
    this.persistActivities();
  }

  updateActivity(activityId: string, updatedData: Partial<ReadingActivity>): void {
    const existing = this.myActivities().find((activity) => activity.id === activityId);
    if (!existing) return;
    this.myActivities.update((activities) =>
      activities.map((activity) =>
        activity.id === activityId
          ? { ...activity, ...updatedData, createdAt: new Date().toISOString() }
          : activity,
      ),
    );
    this.persistActivities();
    if (updatedData.detail === undefined) return;
    const difference = this.parsePages(updatedData.detail) - this.parsePages(existing.detail);
    const book = this.myCurrentBook().find((candidate) => candidate.id === existing.bookId);
    if (difference && book)
      this.updateBook(book.id, { currentPage: book.currentPage + difference });
  }

  private loadUserData(email: string): void {
    this.myCurrentBook.set(
      this.storage.readUser(STORAGE_KEYS.books, email, [], [`@readva:books:${email}`]),
    );
    this.myBooks.set(
      this.storage.readUser(STORAGE_KEYS.history, email, [], [`@readva:history:${email}`]),
    );
    this.myActivities.set(
      this.storage.readUser(STORAGE_KEYS.activities, email, [], [`@readva:activities:${email}`]),
    );
  }
  private persistBooks(): void {
    const email = this.auth.currentUser()?.email ?? 'guest';
    this.storage.writeUser(STORAGE_KEYS.books, email, this.myCurrentBook());
    this.storage.writeUser(STORAGE_KEYS.history, email, this.myBooks());
  }
  private persistActivities(): void {
    this.storage.writeUser(
      STORAGE_KEYS.activities,
      this.auth.currentUser()?.email ?? 'guest',
      this.myActivities(),
    );
  }
  private nonNegativeInteger(value: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
  }
  private positiveInteger(value: number): number {
    return this.nonNegativeInteger(value);
  }
  private parsePages(detail: string): number {
    const match = detail.match(/(\d+)\s*p[áa]g/i);
    return match ? Number.parseInt(match[1], 10) : 0;
  }
  private createId(): string {
    return (
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
  }
}
