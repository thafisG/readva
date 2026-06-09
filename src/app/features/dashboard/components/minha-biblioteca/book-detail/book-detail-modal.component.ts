import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookStats } from '../library-shelf.component';

@Component({
  selector: 'app-book-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './book-detail-modal.component.html',
  styleUrls: ['./book-detail-modal.component.scss'],
})
export class BookDetailModalComponent {
  @Input() book!: BookStats;
  @Output() closeModal = new EventEmitter<void>();

  isOpen = true;

  toggleBook() {
    this.isOpen = !this.isOpen;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
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
