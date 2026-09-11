import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map, timeout } from 'rxjs';
import { BOOKS_API_CONFIG } from '../../../core/api/books-api.config';
import type { BookSearchResult } from '../../../core/models/book.model';
import type {
  OpenLibraryDoc,
  OpenLibrarySearchResponse,
} from '../../../core/models/external-api.model';

const CATEGORY_MAP: ReadonlyArray<readonly [string, string]> = [
  ['science fiction', 'Ficção Científica'],
  ['fantasy', 'Fantasia'],
  ['romance', 'Romance'],
  ['history', 'História'],
  ['biography', 'Biografia'],
  ['psychology', 'Psicologia'],
  ['business', 'Negócios'],
  ['programming', 'Programação'],
  ['science', 'Ciência'],
  ['mystery', 'Mistério'],
  ['thriller', 'Suspense'],
  ['self-help', 'Autoajuda'],
];

@Injectable({ providedIn: 'root' })
export class BookSearchService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(BOOKS_API_CONFIG);

  search(query: string): Observable<BookSearchResult[]> {
    const params = new HttpParams()
      .set('q', query.trim())
      .set('fields', 'title,author_name,number_of_pages_median,subject,cover_i')
      .set('limit', 7);
    return this.http.get<OpenLibrarySearchResponse>(this.config.openLibraryUrl, { params }).pipe(
      timeout(this.config.requestTimeoutMs),
      map((response) =>
        (Array.isArray(response.docs) ? response.docs : [])
          .filter(this.isValidDoc)
          .map((doc) => this.toResult(doc)),
      ),
    );
  }

  private toResult(doc: OpenLibraryDoc): BookSearchResult {
    return {
      title: doc.title!,
      author: doc.author_name![0],
      totalPages: this.safePages(doc.number_of_pages_median),
      coverUrl: doc.cover_i
        ? `${this.config.openLibraryCoversUrl}/${doc.cover_i}-M.jpg`
        : 'assets/no-cover.png',
      category: this.mapCategory(doc.subject),
    };
  }

  private readonly isValidDoc = (doc: OpenLibraryDoc): boolean =>
    typeof doc.title === 'string' &&
    doc.title.trim().length > 0 &&
    Array.isArray(doc.author_name) &&
    typeof doc.author_name[0] === 'string';

  private mapCategory(subjects: string[] | undefined): string {
    const normalized = Array.isArray(subjects)
      ? subjects
          .filter((subject) => typeof subject === 'string')
          .map((subject) => subject.toLowerCase())
      : [];
    return (
      CATEGORY_MAP.find(([key]) => normalized.some((subject) => subject.includes(key)))?.[1] ??
      'Ficção'
    );
  }

  private safePages(value: number | undefined): number {
    return Number.isFinite(value) ? Math.max(0, Math.trunc(value!)) : 0;
  }
}
