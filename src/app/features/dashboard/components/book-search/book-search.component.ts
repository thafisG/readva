import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, catchError, debounceTime, of, switchMap, tap } from 'rxjs';
import type { BookSearchResult } from '../../../../core/models/book.model';
import { BookSearchService } from '../../services/book-search.service';

export type SearchState = 'idle' | 'loading' | 'success' | 'empty' | 'error';

@Component({
  selector: 'app-book-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './book-search.component.html',
  styleUrl: './book-search.component.scss',
})
export class BookSearchComponent {
  @Output() bookSelected = new EventEmitter<BookSearchResult>();

  private readonly searchService = inject(BookSearchService);
  private readonly queryChanges = new Subject<string>();

  readonly query = signal('');
  readonly results = signal<BookSearchResult[]>([]);
  readonly state = signal<SearchState>('idle');
  readonly isLoading = computed(() => this.state() === 'loading');
  readonly noResults = computed(() => this.state() === 'empty');
  readonly hasError = computed(() => this.state() === 'error');

  constructor() {
    this.queryChanges
      .pipe(
        debounceTime(350),
        switchMap((query) => {
          if (query.length < 2) {
            this.resetResults();
            return of([]);
          }
          this.state.set('loading');
          return this.searchService.search(query).pipe(
            tap((books) => this.state.set(books.length ? 'success' : 'empty')),
            catchError(() => {
              this.state.set('error');
              return of([]);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((books) => this.results.set(books));
  }

  onQueryChange(value: string): void {
    const normalized = value.trimStart();
    this.query.set(value);
    this.queryChanges.next(normalized);
  }

  selectBook(book: BookSearchResult): void {
    this.bookSelected.emit(book);
    this.clear();
  }
  clear(): void {
    this.query.set('');
    this.resetResults();
  }
  retry(): void {
    this.queryChanges.next(this.query().trim());
  }
  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/no-cover.png';
  }

  private resetResults(): void {
    this.results.set([]);
    this.state.set('idle');
  }
}
