import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookStats } from '../library-shelf.component';

@Component({
  selector: 'app-book-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './book-detail-modal.component.html',
  styleUrls: ['./book-detail-modal.component.scss'],
})
export class BookDetailModalComponent implements AfterViewInit, OnDestroy {
  @Input() book!: BookStats;
  @Output() closeModal = new EventEmitter<void>();
  @Output() deleteBook = new EventEmitter<string>();
  @Output() moveToReading = new EventEmitter<string>();

  isOpen = true;
  showDeleteConfirm = false;
  deleteInput = '';

  private panel: HTMLElement | null = null;
  private wheelHandler = (e: WheelEvent) => e.stopPropagation();

  ngAfterViewInit() {
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
    this.panel?.removeEventListener('wheel', this.wheelHandler);
  }

  toggleBook() {
    this.isOpen = !this.isOpen;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeModal.emit();
  }

  get canConfirmDelete(): boolean {
    return this.deleteInput === 'DELETAR LIVRO';
  }

  confirmDelete() {
    if (!this.canConfirmDelete) return;
    this.deleteBook.emit(this.book.id);
    this.closeModal.emit();
  }

  moveToDashboard() {
    this.moveToReading.emit(this.book.id);
    this.closeModal.emit();
  }

  formatReadingTime(minutes: number): string {
    if (minutes === 0) return '0min';
    if (minutes < 60) return `${minutes}min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  get pagesRemaining(): number {
    return Math.max(0, this.book.totalPages - this.book.currentPage);
  }

  get avgMinutesPerSession(): number {
    if (!this.book.sessions) return 0;
    return Math.round(this.book.totalMinutesRead / this.book.sessions);
  }

  get estimatedMinutesLeft(): number {
    if (!this.book.sessions || !this.book.currentPage) return 0;
    const avgPagesPerSession = this.book.currentPage / this.book.sessions;
    if (avgPagesPerSession === 0) return 0;
    const sessionsLeft = this.pagesRemaining / avgPagesPerSession;
    return Math.round(sessionsLeft * this.avgMinutesPerSession);
  }
}
