import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import type { BookSearchResult } from '../../../../core/models/book.model';
import { BookSearchService } from '../../services/book-search.service';
import { BookSearchComponent } from './book-search.component';

describe('BookSearchComponent', () => {
  it('retries the same query after a transient API failure', async () => {
    vi.useFakeTimers();
    const result: BookSearchResult = {
      title: 'Duna',
      author: 'Frank Herbert',
      totalPages: 680,
      coverUrl: 'assets/no-cover.png',
      category: 'Ficção Científica',
    };
    let attempts = 0;
    const searchService = {
      search: () => {
        attempts += 1;
        return attempts === 1 ? throwError(() => new Error('temporary failure')) : of([result]);
      },
    };

    TestBed.configureTestingModule({
      imports: [BookSearchComponent],
      providers: [{ provide: BookSearchService, useValue: searchService }],
    });
    const fixture = TestBed.createComponent(BookSearchComponent);
    const component = fixture.componentInstance;

    component.onQueryChange('Duna');
    await vi.advanceTimersByTimeAsync(350);
    expect(component.state()).toBe('error');

    component.retry();
    await vi.advanceTimersByTimeAsync(350);

    expect(attempts).toBe(2);
    expect(component.state()).toBe('success');
    expect(component.results()).toEqual([result]);
    vi.useRealTimers();
  });
});
