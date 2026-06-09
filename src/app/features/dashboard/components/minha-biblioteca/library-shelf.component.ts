import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { BookDetailModalComponent } from './book-detail/book-detail-modal.component';
import { BookService } from '../../services/book.service';
import { Activity } from '../../interfaces/dashboard.interface';

export interface BookStats {
  id: string;
  title: string;
  author: string;
  category: string;
  coverUrl: string;
  currentPage: number;
  totalPages: number;
  totalMinutesRead: number;
  sessions: number;
  comments: string[];
  progressPercent: number;
  completed: boolean;
}

@Component({
  selector: 'app-library-shelf',
  standalone: true,
  imports: [CommonModule, BookDetailModalComponent],
  templateUrl: './library-shelf.component.html',
  styleUrls: ['./library-shelf.component.scss'],
})
export class LibraryShelfComponent {
  public bookService = inject(BookService);
  private location = inject(Location);

  selectedBook = signal<BookStats | null>(null);
  isModalOpen = signal(false);

  onDeleteBook(bookId: string) {
    this.bookService.deleteBook(bookId);
    this.closeModal();
  }

  booksWithStats = computed<BookStats[]>(() => {
    const books = this.bookService.myBooks();
    const activities: Activity[] = this.bookService.myActivities?.() ?? [];

    return books.map((book) => {
      const bookActivities = activities.filter((a) => a.bookId === book.id);

      const totalMinutesRead = bookActivities.reduce((sum, a) => sum + (a.minutesRead ?? 0), 0);

      const comments = bookActivities
        .map((a) => a.comment)
        .filter((c): c is string => !!c && c.trim().length > 0);

      const progressPercent =
        book.totalPages > 0
          ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100))
          : 0;

      return {
        id: book.id,
        title: book.title,
        author: book.author,
        category: book.category,
        coverUrl: book.coverUrl,
        currentPage: book.currentPage,
        totalPages: book.totalPages,
        totalMinutesRead,
        sessions: bookActivities.length,
        comments,
        progressPercent,
        completed: progressPercent >= 100,
      };
    });
  });

  openBookDetail(book: BookStats) {
    this.selectedBook.set(book);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedBook.set(null);
  }

  formatReadingTime(minutes: number): string {
    if (minutes < 60) return `${minutes}min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  goBack() {
    this.location.back();
  }
  onMoveToReading(bookId: string): void {
    this.bookService.moveToCurrentReading(bookId);
  }
}
