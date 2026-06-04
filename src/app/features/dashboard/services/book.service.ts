import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
// Importe suas interfaces de Livro e Atividade aqui

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private authService = inject(AuthService);

  // Pega o e-mail do usuário ativo para isolar o banco
  private get userEmail() {
    return this.authService.currentUser()?.email || 'guest';
  }

  // Chaves dinâmicas por usuário
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

    if (savedBook) this.myCurrentBook.set(JSON.parse(savedBook));
    if (savedActivities) this.myActivities.set(JSON.parse(savedActivities));
  }

  startNewBook(title: string, author: string, totalPages: number, category: string) {
    const newBook = {
      title,
      author,
      totalPages,
      category,
      currentPage: 0,
      coverUrl: 'assets/default-cover.png',
    };
    this.myCurrentBook.set(newBook);
    localStorage.setItem(this.BOOKS_KEY, JSON.stringify(newBook));
  }

  registerProgress(pages: number, comment: string) {
    const current = this.myCurrentBook();
    const user = this.authService.currentUser();
    if (!current || !user) return;

    const updatedPage = Math.min(current.currentPage + pages, current.totalPages);
    const updatedBook = { ...current, currentPage: updatedPage };

    this.myCurrentBook.set(updatedBook);
    localStorage.setItem(this.BOOKS_KEY, JSON.stringify(updatedBook));

    // Salva atividade no feed privado do usuário
    const newActivity = {
      id: Math.random().toString(36).substr(2, 9),
      userName: user.name,
      userAvatar: user.avatar,
      timestamp: 'Agora mesmo',
      bookTitle: current.title,
      bookAuthor: current.author,
      detail: comment || `Leu mais ${pages} páginas.`,
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
