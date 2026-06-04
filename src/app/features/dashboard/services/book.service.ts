import { Injectable, signal, effect } from '@angular/core';
import { Activity, Book } from '../interfaces/dashboard.interface';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  public myCurrentBook = signal<Book | null>(null);
  public myActivities = signal<Activity[]>([]);

  constructor() {
    const savedBook = localStorage.getItem('@readva:currentBook');
    const savedActivities = localStorage.getItem('@readva:activities');

    if (savedBook) this.myCurrentBook.set(JSON.parse(savedBook));
    if (savedActivities) this.myActivities.set(JSON.parse(savedActivities));

    effect(() => {
      localStorage.setItem('@readva:currentBook', JSON.stringify(this.myCurrentBook()));
    });

    effect(() => {
      localStorage.setItem('@readva:activities', JSON.stringify(this.myActivities()));
    });
  }

  startNewBook(title: string, author: string, totalPages: number, category: string) {
    const newBook: Book = {
      id: Math.random().toString(36).substring(2),
      title,
      author,
      category,
      totalPages,
      currentPage: 0,
      coverUrl:
        'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80',
    };
    this.myCurrentBook.set(newBook);
  }

  registerProgress(pagesRead: number, comment: string) {
    const book = this.myCurrentBook();
    if (!book) return;

    const updatedPage = Math.min(book.currentPage + pagesRead, book.totalPages);
    this.myCurrentBook.set({ ...book, currentPage: updatedPage });

    const newActivity: Activity = {
      id: Math.random().toString(36).substring(2),
      userName: 'Você (Leitor)',
      userAvatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
      actionType: updatedPage >= book.totalPages ? 'finished' : 'progress',
      bookTitle: book.title,
      bookAuthor: book.author,
      detail:
        updatedPage >= book.totalPages
          ? `Concluiu a leitura! 🎉 "${comment}"`
          : `leu mais ${pagesRead} páginas hoje e comentou: "${comment}"`,
      timestamp: 'Agora mesmo',
      likes: 0,
      commentsCount: 0,
      hasLiked: false,
    };

    this.myActivities.update((list) => [newActivity, ...list]);
  }
}
