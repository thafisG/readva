import { InjectionToken } from '@angular/core';

export interface BooksApiConfig {
  openLibraryUrl: string;
  openLibraryCoversUrl: string;
  googleBooksUrl: string;
  requestTimeoutMs: number;
}

export const BOOKS_API_CONFIG = new InjectionToken<BooksApiConfig>('BOOKS_API_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    openLibraryUrl: 'https://openlibrary.org/search.json',
    openLibraryCoversUrl: 'https://covers.openlibrary.org/b/id',
    googleBooksUrl: 'https://www.googleapis.com/books/v1/volumes',
    requestTimeoutMs: 8000,
  }),
});
