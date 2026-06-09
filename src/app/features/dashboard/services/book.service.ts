import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private get HISTORY_KEY() {
    return `@readva:history:${this.userEmail}`;
  }

  public myBooks = signal<any[]>([]);

  private authService = inject(AuthService);

  private get userEmail() {
    return this.authService.currentUser()?.email || 'guest';
  }

  private get BOOKS_KEY() {
    return `@readva:books:${this.userEmail}`;
  }
  private get ACTIVITIES_KEY() {
    return `@readva:activities:${this.userEmail}`;
  }

  public myCurrentBook = signal<any[]>([]);
  public myActivities = signal<any[]>([]);

  constructor() {
    this.loadUserData();
  }

  private loadUserData() {
    const savedBooks = localStorage.getItem(this.BOOKS_KEY);
    const savedActivities = localStorage.getItem(this.ACTIVITIES_KEY);
    const savedHistory = localStorage.getItem(this.HISTORY_KEY);

    if (savedBooks) {
      const parsed = JSON.parse(savedBooks);
      this.myCurrentBook.set(Array.isArray(parsed) ? parsed : [parsed]);
    }
    if (savedActivities) this.myActivities.set(JSON.parse(savedActivities));
    if (savedHistory) this.myBooks.set(JSON.parse(savedHistory));
  }

  startNewBook(title: string, author: string, totalPages: number, category: string) {
    const newBook = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      author,
      totalPages,
      category,
      currentPage: 0,
      coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
    };

    this.myCurrentBook.update((books) => {
      const updated = [...books, newBook];
      localStorage.setItem(this.BOOKS_KEY, JSON.stringify(updated));
      return updated;
    });

    this.myBooks.update((books) => {
      const updated = [...books, newBook];
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  registerProgress(bookId: string, pages: number, comment: string, minutesRead: number = 0) {
    const current = this.myCurrentBook().find((b) => b.id === bookId);
    const user = this.authService.currentUser();
    if (!current || !user) return;

    const safePages = Number(pages);
    const updatedPage = Math.min(current.currentPage + safePages, current.totalPages);
    const updatedBook = { ...current, currentPage: updatedPage };

    this.myCurrentBook.update((books) => {
      const updated = books.map((b) => (b.id === bookId ? updatedBook : b));
      localStorage.setItem(this.BOOKS_KEY, JSON.stringify(updated));
      return updated;
    });

    const minutesLabel = minutesRead > 0 ? ` • ${minutesRead} min de leitura` : '';

    const newActivity = {
      id: Math.random().toString(36).substr(2, 9),
      userName: user.name,
      userAvatar: user.avatar,
      timestamp: 'Agora mesmo',
      bookId: bookId,
      bookTitle: current.title,
      bookAuthor: current.author,
      detail: `Leu mais ${safePages} páginas${minutesLabel}`,
      comment: comment || '',
      minutesRead: minutesRead,
      pagesRead: safePages,
      likes: 0,
      hasLiked: false,
    };

    this.myActivities.update((list) => {
      const newList = [newActivity, ...list];
      localStorage.setItem(this.ACTIVITIES_KEY, JSON.stringify(newList));
      return newList;
    });
  }

  updateBook(
    id: string,
    data: {
      title?: string;
      author?: string;
      totalPages?: number;
      currentPage?: number;
      category?: string;
    },
  ) {
    this.myCurrentBook.update((books) => {
      const updated = books.map((b) => (b.id === id ? { ...b, ...data } : b));
      localStorage.setItem(this.BOOKS_KEY, JSON.stringify(updated));
      return updated;
    });

    this.myBooks.update((books) => {
      const updated = books.map((b) => (b.id === id ? { ...b, ...data } : b));
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  moveToLibrary(id: string) {
    const book = this.myCurrentBook().find((b) => b.id === id);
    if (!book) return;

    this.myCurrentBook.update((books) => {
      const updated = books.filter((b) => b.id !== id);
      localStorage.setItem(this.BOOKS_KEY, JSON.stringify(updated));
      return updated;
    });

    this.myBooks.update((books) => {
      const alreadyExists = books.some((b) => b.id === id);
      if (alreadyExists) return books;
      const updated = [...books, book];
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  markCompleted(id: string) {
    const book = this.myCurrentBook().find((b) => b.id === id);
    if (!book) return;

    const completedBook = {
      ...book,
      currentPage: book.totalPages,
      completedAt: new Date().toISOString(),
    };

    this.myBooks.update((books) => {
      const updated = books.map((b) => (b.id === id ? completedBook : b));
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });

    this.myCurrentBook.update((books) => {
      const updated = books.filter((b) => b.id !== id);
      localStorage.setItem(this.BOOKS_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  deleteBook(id: string) {
    this.myCurrentBook.update((books) => {
      const updated = books.filter((b) => b.id !== id);
      localStorage.setItem(this.BOOKS_KEY, JSON.stringify(updated));
      return updated;
    });

    this.myBooks.update((books) => {
      const updated = books.filter((b) => b.id !== id);
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });

    this.myActivities.update((list) => {
      const updated = list.filter((a) => a.bookId !== id);
      localStorage.setItem(this.ACTIVITIES_KEY, JSON.stringify(updated));
      return updated;
    });
  }
}
