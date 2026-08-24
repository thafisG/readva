import { TestBed } from '@angular/core/testing';
import type { Book } from '../../../core/models/book.model';
import { ReadingTimerService } from '../services/reading-timer.service';
import { BookActionPanelComponent } from './book-action-panel.component';

describe('BookActionPanelComponent accessibility', () => {
  const book: Book = {
    id: 'book-1',
    title: 'Livro acessível',
    author: 'Autora',
    coverUrl: '',
    totalPages: 200,
    currentPage: 40,
    category: 'Ficção',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookActionPanelComponent],
    }).compileComponents();
  });

  it('keeps the dialog semantics and focus trap on the modal card', () => {
    const fixture = TestBed.createComponent(BookActionPanelComponent);
    fixture.componentRef.setInput('book', book);
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.modal-overlay') as HTMLElement;
    const dialog = fixture.nativeElement.querySelector('.book-modal') as HTMLElement;
    const title = fixture.nativeElement.querySelector('#book-action-title') as HTMLElement;

    expect(overlay.getAttribute('role')).toBe('presentation');
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);
    expect(dialog.hasAttribute('cdktrapfocus')).toBe(true);
    expect(overlay.hasAttribute('cdktrapfocus')).toBe(false);
  });

  it('pauses the timer and resumes it when closing is cancelled', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(BookActionPanelComponent);
    fixture.componentRef.setInput('book', book);
    fixture.detectChanges();
    const timer = TestBed.inject(ReadingTimerService);
    timer.start(book.id);
    vi.advanceTimersByTime(65_000);
    fixture.detectChanges();

    const closeButton = fixture.nativeElement.querySelector('.close-x') as HTMLButtonElement;
    closeButton.click();
    fixture.detectChanges();

    const confirmation = fixture.nativeElement.querySelector(
      '.timer-close-confirmation',
    ) as HTMLElement;
    expect(confirmation.getAttribute('role')).toBe('alertdialog');
    expect(confirmation.textContent).toContain('01:05');
    expect(timer.isRunning()).toBe(false);

    const continueButton = confirmation.querySelector(
      '.timer-close-secondary',
    ) as HTMLButtonElement;
    continueButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.timer-close-confirmation')).toBeNull();
    expect(timer.isRunning()).toBe(true);
    expect(timer.elapsedSeconds()).toBe(65);
    timer.reset();
    vi.useRealTimers();
  });

  it('only clears and closes the timer after destructive confirmation', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(BookActionPanelComponent);
    fixture.componentRef.setInput('book', book);
    fixture.detectChanges();
    const timer = TestBed.inject(ReadingTimerService);
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    timer.activeBookId.set(book.id);
    timer.elapsedSeconds.set(90);
    fixture.detectChanges();

    const closeButton = fixture.nativeElement.querySelector('.close-x') as HTMLButtonElement;
    closeButton.click();
    fixture.detectChanges();

    expect(timer.elapsedSeconds()).toBe(90);
    const confirmButton = fixture.nativeElement.querySelector(
      '.timer-close-danger',
    ) as HTMLButtonElement;
    confirmButton.click();

    expect(timer.elapsedSeconds()).toBe(0);
    expect(timer.activeBookId()).toBeNull();
    expect(closed).not.toHaveBeenCalled();

    vi.advanceTimersByTime(180);
    expect(closed).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('moves between tabs with arrow keys and updates the roving tabindex', () => {
    const fixture = TestBed.createComponent(BookActionPanelComponent);
    fixture.componentRef.setInput('book', book);
    fixture.detectChanges();

    const tabs = fixture.nativeElement.querySelectorAll(
      '[role="tab"]',
    ) as NodeListOf<HTMLButtonElement>;
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });

    tabs[0].dispatchEvent(event);
    fixture.detectChanges();

    expect(event.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.activeTab).toBe('edit');
    expect(tabs[0].getAttribute('tabindex')).toBe('-1');
    expect(tabs[1].getAttribute('tabindex')).toBe('0');
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tabs[1]);
  });
});
