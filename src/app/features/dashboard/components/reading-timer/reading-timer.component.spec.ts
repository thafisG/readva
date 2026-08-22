import { TestBed } from '@angular/core/testing';
import { ReadingTimerService } from '../../services/reading-timer.service';
import { ReadingTimerComponent } from './reading-timer.component';

describe('ReadingTimerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ReadingTimerComponent] }).compileComponents();
  });

  it('stays hidden before a reading session is minimized', () => {
    const fixture = TestBed.createComponent(ReadingTimerComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.reading-clock')).toBeNull();
  });

  it('renders the compact clock only for a minimized session', () => {
    const fixture = TestBed.createComponent(ReadingTimerComponent);
    const timer = TestBed.inject(ReadingTimerService);
    timer.start('book-1');
    timer.minimize();
    fixture.componentRef.setInput('hasActiveBook', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.flip-card')).toHaveLength(4);
    expect(fixture.nativeElement.querySelector('.timer-dialog')).toBeNull();
    timer.reset();
  });

  it('requests the existing manager when the minimized clock is clicked', () => {
    const fixture = TestBed.createComponent(ReadingTimerComponent);
    const timer = TestBed.inject(ReadingTimerService);
    const requested = vi.fn();
    timer.start('book-1');
    timer.minimize();
    fixture.componentRef.setInput('hasActiveBook', true);
    fixture.componentInstance.manageRequested.subscribe(requested);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.clock-shell').click();

    expect(requested).toHaveBeenCalledOnce();
    timer.reset();
  });

  it('reflects the shared reading time in its cards', () => {
    const fixture = TestBed.createComponent(ReadingTimerComponent);
    const timer = TestBed.inject(ReadingTimerService);
    timer.activeBookId.set('book-1');
    timer.elapsedSeconds.set(65);
    timer.minimize();
    fixture.detectChanges();

    const digits = [...fixture.nativeElement.querySelectorAll('.flip-card')].map(
      (card: HTMLElement) => card.textContent?.trim(),
    );

    expect(digits).toEqual(['0', '1', '0', '5']);
    timer.reset();
  });
});
