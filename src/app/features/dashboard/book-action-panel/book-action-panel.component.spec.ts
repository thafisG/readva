import { TestBed } from '@angular/core/testing';
import type { Book } from '../../../core/models/book.model';
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
