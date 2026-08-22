import type { OnChanges, SimpleChanges } from '@angular/core';
import { Component, Input, Output, EventEmitter, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BOOK_CATEGORIES } from '../../../constants/book-categories';
import { A11yModule } from '@angular/cdk/a11y';
import type { Book } from '../../../core/models/book.model';
import type { BookUpdate } from '../services/book.service';
import { ReadingTimerService } from '../services/reading-timer.service';

export type PanelTab = 'progress' | 'edit' | 'manage';

export type BookActionEvent =
  | {
      type: 'post-progress';
      bookId: string;
      payload: { pages: number; comment: string; minutesRead: number };
    }
  | { type: 'save-edit'; bookId: string; payload: BookUpdate }
  | { type: 'move-to-library' | 'mark-completed' | 'delete'; bookId: string };

@Component({
  selector: 'app-book-action-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, A11yModule],
  templateUrl: './book-action-panel.component.html',
  styleUrls: ['./book-action-panel.component.scss'],
})
export class BookActionPanelComponent implements OnChanges {
  @Input() book: Book | null = null;
  @Output() action = new EventEmitter<BookActionEvent>();
  @Output() closed = new EventEmitter<void>();

  activeTab: PanelTab = 'progress';
  categories = BOOK_CATEGORIES;
  isClosing = false;
  pagesRead = 0;
  userComment = '';
  private readonly readingTimer = inject(ReadingTimerService);
  readonly readingElapsedSeconds = this.readingTimer.elapsedSeconds;
  editTitle = '';
  editAuthor = '';
  editTotalPages = 0;
  editCurrentPage = 0;
  editCategory = '';

  confirmDelete = false;

  get isReading(): boolean {
    return this.readingTimer.isRunning();
  }

  get formattedTime(): string {
    return this.readingTimer.formattedTime();
  }

  get progressPercent(): number {
    if (!this.book) return 0;
    return Math.round((this.book.currentPage / this.book.totalPages) * 100);
  }

  get footerLabel(): string | null {
    if (this.activeTab === 'progress') return 'Publicar atividade';
    if (this.activeTab === 'edit') return 'Salvar alterações';
    return null;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.close();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['book'] && this.book) {
      this.syncEditFields();
      if (this.readingTimer.activeBookId() !== this.book.id) this.resetProgressForm();
      this.confirmDelete = false;
      this.isClosing = false;
      this.activeTab = 'progress';
    }
  }

  close(): void {
    this.isClosing = true;
    setTimeout(() => {
      this.isClosing = false;
      this.closed.emit();
    }, 180);
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }

  selectTab(tab: PanelTab): void {
    this.activeTab = tab;
    this.confirmDelete = false;
  }

  toggleTimer(): void {
    if (this.book) this.readingTimer.toggle(this.book.id);
  }

  resetTimer(): void {
    this.readingTimer.reset();
  }

  onFooterAction(): void {
    if (this.activeTab === 'progress') this.postProgress();
    else if (this.activeTab === 'edit') this.saveEdit();
  }

  postProgress(): void {
    const pages = Number(this.pagesRead);
    if (!this.book || isNaN(pages) || pages <= 0) return;
    const minutesRead = Math.floor(this.readingElapsedSeconds() / 60);
    this.action.emit({
      type: 'post-progress',
      bookId: this.book.id,
      payload: { pages, comment: this.userComment, minutesRead },
    });
    this.resetProgressForm();
  }

  saveEdit(): void {
    if (!this.book || !this.editTitle.trim() || !this.editAuthor.trim()) return;
    this.action.emit({
      type: 'save-edit',
      bookId: this.book.id,
      payload: {
        title: this.editTitle,
        author: this.editAuthor,
        totalPages: Number(this.editTotalPages),
        currentPage: Number(this.editCurrentPage),
        category: this.editCategory,
      },
    });
  }

  moveToLibrary(): void {
    if (!this.book) return;
    this.action.emit({ type: 'move-to-library', bookId: this.book.id });
  }

  markCompleted(): void {
    if (!this.book) return;
    this.action.emit({ type: 'mark-completed', bookId: this.book.id });
  }

  deleteBook(): void {
    if (!this.book) return;
    this.action.emit({ type: 'delete', bookId: this.book.id });
    this.confirmDelete = false;
  }

  private syncEditFields(): void {
    if (!this.book) return;
    this.editTitle = this.book.title;
    this.editAuthor = this.book.author;
    this.editTotalPages = this.book.totalPages;
    this.editCurrentPage = this.book.currentPage;
    this.editCategory = this.book.category;
  }

  private resetProgressForm(): void {
    this.pagesRead = 0;
    this.userComment = '';
    this.resetTimer();
  }
}
