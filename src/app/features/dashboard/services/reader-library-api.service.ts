import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Book } from '../../../core/models/book.model';

@Injectable({ providedIn: 'root' })
export class ReaderLibraryApiService {
  private readonly http = inject(HttpClient);

  list(readerId: string): Observable<Book[]> {
    return this.http.get<Book[]>(this.collectionUrl(readerId));
  }

  save(readerId: string, book: Book): Observable<Book> {
    return this.http.put<Book>(
      `${this.collectionUrl(readerId)}/${encodeURIComponent(book.id)}`,
      this.toRequest(book),
    );
  }

  importBooks(readerId: string, books: Book[]): Observable<Book[]> {
    return this.http.post<Book[]>(
      `${this.collectionUrl(readerId)}/import`,
      books.map((book) => this.toRequest(book)),
    );
  }

  delete(readerId: string, bookId: string): Observable<void> {
    return this.http.delete<void>(`${this.collectionUrl(readerId)}/${encodeURIComponent(bookId)}`);
  }

  private collectionUrl(readerId: string): string {
    return `/api/readers/${encodeURIComponent(readerId)}/books`;
  }

  private toRequest(book: Book) {
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
      totalPages: book.totalPages,
      currentPage: book.currentPage,
      category: book.category,
      status: book.status ?? 'paused',
      createdAt: book.createdAt ?? new Date().toISOString(),
      completedAt: book.completedAt ?? null,
      startedOn: this.localDateKey(book.createdAt),
      completedOn: book.completedAt ? this.localDateKey(book.completedAt) : null,
    };
  }

  private localDateKey(value?: string): string {
    const date = new Date(value ?? Date.now());
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
