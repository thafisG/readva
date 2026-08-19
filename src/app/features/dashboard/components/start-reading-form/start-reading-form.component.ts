import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BOOK_CATEGORIES } from '../../../../constants/book-categories';
import type { BookSearchResult } from '../../../../core/models/book.model';
import { BookSearchComponent } from '../book-search/book-search.component';

export interface StartReadingRequest {
  title: string;
  author: string;
  totalPages: number;
  category: string;
}

@Component({
  selector: 'app-start-reading-form',
  standalone: true,
  imports: [FormsModule, BookSearchComponent],
  templateUrl: './start-reading-form.component.html',
  styleUrl: './start-reading-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartReadingFormComponent {
  readonly submitted = output<StartReadingRequest>();
  readonly categories = BOOK_CATEGORIES;

  title = '';
  author = '';
  totalPages = 100;
  category = 'Literatura';

  selectBook(book: BookSearchResult): void {
    this.title = book.title;
    this.author = book.author;
    this.totalPages = book.totalPages || 100;
    this.category = book.category;
  }

  submit(): void {
    const title = this.title.trim();
    const author = this.author.trim();
    if (!title || !author || this.totalPages <= 0 || !this.category) return;

    this.submitted.emit({ title, author, totalPages: this.totalPages, category: this.category });
    this.reset();
  }

  private reset(): void {
    this.title = '';
    this.author = '';
    this.totalPages = 100;
    this.category = 'Literatura';
  }
}
