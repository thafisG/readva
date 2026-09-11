import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { Book } from '../../../core/models/book.model';
import { ReaderLibraryApiService } from './reader-library-api.service';

const BOOK: Book = {
  id: 'book-1',
  title: 'Duna',
  author: 'Frank Herbert',
  coverUrl: 'cover.jpg',
  totalPages: 300,
  currentPage: 20,
  category: 'Ficção Científica',
  status: 'reading',
  createdAt: '2026-08-01T12:00:00.000Z',
};

describe('ReaderLibraryApiService', () => {
  let service: ReaderLibraryApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReaderLibraryApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('persists a complete book representation', () => {
    service.save('reader-1', BOOK).subscribe();

    const request = http.expectOne('/api/readers/reader-1/books/book-1');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      ...BOOK,
      completedAt: null,
      startedOn: '2026-08-01',
      completedOn: null,
    });
    request.flush(BOOK);
  });

  it('imports the local library in one request', () => {
    service.importBooks('reader-1', [BOOK]).subscribe();

    const request = http.expectOne('/api/readers/reader-1/books/import');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toHaveLength(1);
    request.flush([BOOK]);
  });
});
