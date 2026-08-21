import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BookSearchService } from './book-search.service';

describe('BookSearchService', () => {
  let service: BookSearchService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BookSearchService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('maps incomplete external results safely', () => {
    let resultCount = -1;
    service.search('Duna').subscribe((results) => (resultCount = results.length));
    http
      .expectOne((request) => request.url.includes('openlibrary.org'))
      .flush({
        docs: [
          { title: 'Duna', author_name: ['Frank Herbert'], cover_i: 42 },
          { title: 'Sem autor' },
        ],
      });
    expect(resultCount).toBe(1);
  });

  it('propagates API failures for the component to distinguish from an empty result', () => {
    let failed = false;
    service.search('Duna').subscribe({ error: () => (failed = true) });
    http
      .expectOne((request) => request.url.includes('openlibrary.org'))
      .flush('erro', { status: 503, statusText: 'Unavailable' });
    expect(failed).toBe(true);
  });
});
