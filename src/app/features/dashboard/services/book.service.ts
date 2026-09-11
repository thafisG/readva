import { Injectable, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { ReadingActivity } from '../../../core/models/activity.model';
import type { Book } from '../../../core/models/book.model';
import type { UserSession } from '../../../core/models/user.model';
import { STORAGE_KEYS } from '../../../core/storage/storage.keys';
import { StorageService } from '../../../core/storage/storage.service';
import { AuthService } from './auth.service';
import { BookCatalogService } from './book-catalog.service';
import { ChallengesService } from './challenges.service';
import { ReaderLibraryApiService } from './reader-library-api.service';
import { ReadingActivityService } from './reading-activity.service';

export type BookUpdate = Partial<
  Pick<Book, 'title' | 'author' | 'totalPages' | 'currentPage' | 'category' | 'status'>
>;

@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly auth = inject(AuthService);
  private readonly catalog = inject(BookCatalogService);
  private readonly challenges = inject(ChallengesService);
  private readonly libraryApi = inject(ReaderLibraryApiService);
  private readonly activityStore = inject(ReadingActivityService);
  private readonly storage = inject(StorageService);

  readonly myBooks = signal<Book[]>([]);
  readonly myCurrentBook = signal<Book[]>([]);
  readonly myActivities = this.activityStore.activities;
  readonly activitySyncing = this.activityStore.syncing;
  readonly activitySyncError = this.activityStore.syncError;
  readonly todayMinutesRead = this.activityStore.todayMinutesRead;
  readonly librarySyncing = signal(false);
  readonly librarySyncError = signal(false);

  private loadVersion = 0;

  constructor() {
    effect(() => this.loadUserData(this.auth.currentUser()));
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

    const now = new Date().toISOString();
    const book: Book = {
      id: this.createId(),
      title: cleanTitle,
      author: cleanAuthor,
      totalPages: pages,
      category: category.trim() || 'Sem categoria',
      currentPage: 0,
      status: 'reading',
      createdAt: now,
      updatedAt: now,
      coverUrl: coverUrl || this.catalog.generateCoverFallback(cleanTitle, cleanAuthor),
    };
    this.storeBook(book);
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
    this.updateBook(bookId, { currentPage: nextPage }, undefined, false);
    this.activityStore.recordProgress({
      book: current,
      user,
      pagesRead: actualPages,
      minutesRead: safeMinutes,
      comment,
    });
  }

  updateBook(id: string, data: BookUpdate, coverUrl?: string, synchronizeRemote = true): void {
    const book = this.myBooks().find((candidate) => candidate.id === id);
    if (!book) return;
    const totalPages =
      data.totalPages === undefined ? book.totalPages : this.positiveInteger(data.totalPages);
    const currentPage = Math.min(
      this.nonNegativeInteger(data.currentPage ?? book.currentPage),
      totalPages || book.totalPages,
    );
    const status = data.status ?? book.status ?? 'paused';
    const updated: Book = {
      ...book,
      ...data,
      ...(coverUrl ? { coverUrl } : {}),
      totalPages: totalPages || book.totalPages,
      currentPage,
      status,
      updatedAt: new Date().toISOString(),
      completedAt: status === 'completed' ? book.completedAt : undefined,
    };
    this.storeBook(updated, synchronizeRemote);
  }

  moveToLibrary(id: string): void {
    const book = this.myCurrentBook().find((candidate) => candidate.id === id);
    if (!book) return;
    this.updateBook(id, { status: 'paused' });
  }

  markCompleted(id: string): void {
    const book = this.myBooks().find((candidate) => candidate.id === id);
    if (!book || book.status === 'completed' || book.completedAt) return;
    const now = new Date().toISOString();
    this.storeBook({
      ...book,
      currentPage: book.totalPages,
      status: 'completed',
      completedAt: now,
      updatedAt: now,
    });
    this.challenges.onBookFinished(id);
  }

  deleteBook(id: string): void {
    this.myCurrentBook.update((books) => books.filter((book) => book.id !== id));
    this.myBooks.update((books) => books.filter((book) => book.id !== id));
    this.activityStore.deleteByBook(id);
    this.addPendingDeletion(id);
    this.persistBooks();
    void this.deleteBookRemotely(id);
  }

  moveToCurrentReading(bookId: string): void {
    const book = this.myBooks().find((candidate) => candidate.id === bookId);
    if (!book || this.myCurrentBook().some((candidate) => candidate.id === bookId)) return;
    this.updateBook(bookId, { status: 'reading' });
  }

  deleteActivity(activityId: string): void {
    const activity = this.activityStore.delete(activityId);
    if (!activity) return;
    const book = this.myBooks().find((candidate) => candidate.id === activity.bookId);
    if (book && book.status !== 'completed' && (activity.pagesRead ?? 0) > 0) {
      this.updateBook(
        book.id,
        { currentPage: book.currentPage - (activity.pagesRead ?? 0) },
        undefined,
        false,
      );
    }
  }

  toggleActivityLike(activityId: string): void {
    this.activityStore.toggleLike(activityId);
  }

  updateActivity(activityId: string, updatedData: Partial<ReadingActivity>): void {
    const result = this.activityStore.update(activityId, updatedData);
    if (!result?.pagesDifference) return;
    const book = this.myBooks().find((candidate) => candidate.id === result.activity.bookId);
    if (book && book.status !== 'completed') {
      this.updateBook(
        book.id,
        { currentPage: book.currentPage + result.pagesDifference },
        undefined,
        false,
      );
    }
  }

  private loadUserData(user: UserSession | null): void {
    const version = ++this.loadVersion;
    const activityVersion = this.activityStore.load(user);
    const email = user?.email ?? 'guest';
    const current = this.storage.readUser<Book[]>(
      STORAGE_KEYS.books,
      email,
      [],
      [`@readva:books:${email}`],
    );
    const history = this.storage.readUser<Book[]>(
      STORAGE_KEYS.history,
      email,
      [],
      [`@readva:history:${email}`],
    );
    this.replaceLibrary(this.normalizeLocalBooks(history, current));
    this.librarySyncError.set(false);
    if (user?.id) void this.synchronizeUserData(user, user.id, version, activityVersion);
  }
  private async synchronizeUserData(
    user: UserSession,
    readerId: string,
    version: number,
    activityVersion: number,
  ): Promise<void> {
    await this.activityStore.synchronize(user, readerId, activityVersion);
    if (version === this.loadVersion) await this.synchronizeLibrary(readerId, version);
  }

  private async synchronizeLibrary(readerId: string, version: number): Promise<void> {
    this.librarySyncing.set(true);
    try {
      const pendingDeletions = this.pendingDeletions();
      await Promise.all(
        pendingDeletions.map((bookId) => firstValueFrom(this.libraryApi.delete(readerId, bookId))),
      );
      if (version !== this.loadVersion) return;
      this.savePendingDeletions([]);

      let serverBooks = await firstValueFrom(this.libraryApi.list(readerId));
      if (version !== this.loadVersion) return;
      const serverById = new Map(serverBooks.map((book) => [book.id, book]));
      const booksToImport = this.myBooks().filter((localBook) => {
        const serverBook = serverById.get(localBook.id);
        return !serverBook || this.bookTimestamp(localBook) > this.bookTimestamp(serverBook);
      });
      if (booksToImport.length > 0) {
        serverBooks = await firstValueFrom(this.libraryApi.importBooks(readerId, booksToImport));
      }
      if (version !== this.loadVersion) return;
      this.replaceLibrary(serverBooks.map((book) => this.normalizeBook(book, false, true)));
      this.persistBooks();
      await this.challenges.refreshFromServer();
      this.librarySyncError.set(false);
    } catch {
      if (version === this.loadVersion) this.librarySyncError.set(true);
    } finally {
      if (version === this.loadVersion) this.librarySyncing.set(false);
    }
  }

  private storeBook(book: Book, synchronizeRemote = true): void {
    const normalized = this.normalizeBook(book, book.status === 'reading');
    this.myBooks.update((books) => {
      const exists = books.some((candidate) => candidate.id === normalized.id);
      return exists
        ? books.map((candidate) => (candidate.id === normalized.id ? normalized : candidate))
        : [...books, normalized];
    });
    this.myCurrentBook.set(this.myBooks().filter((candidate) => candidate.status === 'reading'));
    this.persistBooks();
    if (synchronizeRemote) void this.saveBookRemotely(normalized);
  }

  private async saveBookRemotely(book: Book): Promise<void> {
    const readerId = this.auth.currentUser()?.id;
    if (!readerId) return;
    try {
      const saved = await firstValueFrom(this.libraryApi.save(readerId, book));
      if (this.pendingDeletions().includes(book.id)) {
        await firstValueFrom(this.libraryApi.delete(readerId, book.id));
        this.removePendingDeletion(book.id);
        return;
      }
      const current = this.myBooks().find((candidate) => candidate.id === book.id);
      if (current?.updatedAt === book.updatedAt) {
        const normalized = this.normalizeBook(saved, saved.status === 'reading');
        this.myBooks.update((books) =>
          books.map((candidate) => (candidate.id === normalized.id ? normalized : candidate)),
        );
        this.myCurrentBook.set(
          this.myBooks().filter((candidate) => candidate.status === 'reading'),
        );
        this.persistBooks();
      }
      await this.challenges.refreshFromServer();
      this.librarySyncError.set(false);
    } catch {
      this.librarySyncError.set(true);
    }
  }

  private async deleteBookRemotely(bookId: string): Promise<void> {
    const readerId = this.auth.currentUser()?.id;
    if (!readerId) return;
    try {
      await firstValueFrom(this.libraryApi.delete(readerId, bookId));
      this.removePendingDeletion(bookId);
      this.librarySyncError.set(false);
    } catch {
      this.librarySyncError.set(true);
    }
  }

  private normalizeLocalBooks(history: Book[], current: Book[]): Book[] {
    const currentIds = new Set(current.map((book) => book.id));
    const merged = new Map<string, Book>();
    history.forEach((book) =>
      merged.set(book.id, this.normalizeBook(book, currentIds.has(book.id))),
    );
    current.forEach((book) => merged.set(book.id, this.normalizeBook(book, true)));
    return [...merged.values()];
  }

  private normalizeBook(book: Book, isCurrent: boolean, preserveStatus = false): Book {
    const completed = Boolean(book.completedAt) || book.status === 'completed';
    const status = completed
      ? 'completed'
      : isCurrent
        ? 'reading'
        : preserveStatus && book.status
          ? book.status
          : !book.status || book.status === 'reading'
            ? 'paused'
            : book.status;
    const normalized: Book = {
      ...book,
      status,
      currentPage: completed ? book.totalPages : Math.min(book.currentPage, book.totalPages),
      createdAt: book.createdAt ?? new Date().toISOString(),
      updatedAt: book.updatedAt ?? book.createdAt ?? new Date().toISOString(),
    };
    if (status === 'completed') return normalized;
    const { completedAt, ...activeBook } = normalized;
    void completedAt;
    return activeBook;
  }

  private replaceLibrary(books: Book[]): void {
    this.myBooks.set(books);
    this.myCurrentBook.set(books.filter((book) => book.status === 'reading'));
  }

  private persistBooks(): void {
    const email = this.auth.currentUser()?.email ?? 'guest';
    this.storage.writeUser(STORAGE_KEYS.books, email, this.myCurrentBook());
    this.storage.writeUser(STORAGE_KEYS.history, email, this.myBooks());
  }

  private pendingDeletions(): string[] {
    return this.storage.readUser(
      STORAGE_KEYS.deletedBooks,
      this.auth.currentUser()?.email ?? 'guest',
      [],
    );
  }

  private addPendingDeletion(bookId: string): void {
    this.savePendingDeletions([...new Set([...this.pendingDeletions(), bookId])]);
  }

  private removePendingDeletion(bookId: string): void {
    this.savePendingDeletions(this.pendingDeletions().filter((id) => id !== bookId));
  }

  private savePendingDeletions(bookIds: string[]): void {
    this.storage.writeUser(
      STORAGE_KEYS.deletedBooks,
      this.auth.currentUser()?.email ?? 'guest',
      bookIds,
    );
  }

  private bookTimestamp(book: Book): number {
    const timestamp = Date.parse(book.updatedAt ?? book.createdAt ?? '');
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  private nonNegativeInteger(value: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
  }

  private positiveInteger(value: number): number {
    return this.nonNegativeInteger(value);
  }

  private createId(): string {
    return (
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
  }
}
