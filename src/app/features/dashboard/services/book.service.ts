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

  public myCurrentBook = signal<any | null>(null);
  public myActivities = signal<any[]>([]);

  constructor() {
    this.loadUserData();
  }

  private loadUserData() {
    const savedBook = localStorage.getItem(this.BOOKS_KEY);
    const savedActivities = localStorage.getItem(this.ACTIVITIES_KEY);
    const savedHistory = localStorage.getItem(this.HISTORY_KEY);

    if (savedBook) this.myCurrentBook.set(JSON.parse(savedBook));
    if (savedActivities) this.myActivities.set(JSON.parse(savedActivities));
    if (savedHistory) this.myBooks.set(JSON.parse(savedHistory));
  }

  startNewBook(title: string, author: string, totalPages: number, category: string) {
    const newBook = {
      title,
      author,
      totalPages,
      category,
      currentPage: 0,
      coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
    };

    this.myCurrentBook.set(newBook);
    localStorage.setItem(this.BOOKS_KEY, JSON.stringify(newBook));

    this.myBooks.update((books) => {
      const updated = [...books, newBook];
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  registerProgress(pages: number, comment: string, minutesRead: number = 0) {
    const current = this.myCurrentBook();
    const user = this.authService.currentUser();
    if (!current || !user) return;

    const updatedPage = Math.min(current.currentPage + pages, current.totalPages);
    const updatedBook = { ...current, currentPage: updatedPage };

    this.myCurrentBook.set(updatedBook);
    localStorage.setItem(this.BOOKS_KEY, JSON.stringify(updatedBook));

    const minutesLabel = minutesRead > 0 ? ` • ${minutesRead} min de leitura` : '';

    const newActivity = {
      id: Math.random().toString(36).substr(2, 9),
      userName: user.name,
      userAvatar: user.avatar,
      timestamp: 'Agora mesmo',
      bookTitle: current.title,
      bookAuthor: current.author,
      detail: comment || `Leu mais ${pages} páginas${minutesLabel}.`,
      likes: 0,
      hasLiked: false,
    };

    this.myActivities.update((list) => {
      const newList = [newActivity, ...list];
      localStorage.setItem(this.ACTIVITIES_KEY, JSON.stringify(newList));
      return newList;
    });
  }
}
