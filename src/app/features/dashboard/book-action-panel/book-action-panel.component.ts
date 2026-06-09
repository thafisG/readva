import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  signal,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BOOK_CATEGORIES } from '../../../constants/book-categories';

export type PanelTab = 'progress' | 'edit' | 'manage';

export interface BookActionEvent {
  type: 'post-progress' | 'save-edit' | 'move-to-library' | 'mark-completed' | 'delete';
  bookId: string;
  payload?: any;
}

@Component({
  selector: 'app-book-action-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './book-action-panel.component.html',
  styleUrls: ['./book-action-panel.component.scss'],
})
export class BookActionPanelComponent implements OnDestroy, OnChanges {
  @Input() book: any | null = null;
  @Output() action = new EventEmitter<BookActionEvent>();
  @Output() closed = new EventEmitter<void>();

  activeTab: PanelTab = 'progress';
  categories = BOOK_CATEGORIES;
  isClosing = false;
  pagesRead = 0;
  userComment = '';
  isReading = false;
  readingElapsedSeconds = signal(0);
  private readingStartTime: number | null = null;
  private timerInterval: any = null;
  editTitle = '';
  editAuthor = '';
  editTotalPages = 0;
  editCurrentPage = 0;
  editCategory = '';

  confirmDelete = false;

  get formattedTime(): string {
    const total = this.readingElapsedSeconds();
    const m = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
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
      this.resetProgressForm();
      this.confirmDelete = false;
      this.isClosing = false;
      this.activeTab = 'progress';
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
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
    if (!this.isReading) {
      this.isReading = true;
      this.readingStartTime = Date.now() - this.readingElapsedSeconds() * 1000;
      this.timerInterval = setInterval(() => {
        this.readingElapsedSeconds.set(Math.floor((Date.now() - this.readingStartTime!) / 1000));
      }, 1000);
    } else {
      this.isReading = false;
      clearInterval(this.timerInterval);
    }
  }

  resetTimer(): void {
    this.isReading = false;
    clearInterval(this.timerInterval);
    this.readingElapsedSeconds.set(0);
    this.readingStartTime = null;
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
