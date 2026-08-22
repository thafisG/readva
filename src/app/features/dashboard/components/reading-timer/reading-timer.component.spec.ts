import { TestBed } from '@angular/core/testing';
import { ReadingTimerService } from '../../services/reading-timer.service';
import { ReadingTimerComponent } from './reading-timer.component';

describe('ReadingTimerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ReadingTimerComponent] }).compileComponents();
  });

  it('renders a compact flip clock without creating another dialog', () => {
    const fixture = TestBed.createComponent(ReadingTimerComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.flip-card')).toHaveLength(4);
    expect(fixture.nativeElement.querySelector('.timer-dialog')).toBeNull();
    expect(fixture.nativeElement.querySelector('.clock-shell').disabled).toBe(true);
  });

  it('requests the existing manager when an active book is available', () => {
    const fixture = TestBed.createComponent(ReadingTimerComponent);
    const requested = vi.fn();
    fixture.componentRef.setInput('hasActiveBook', true);
    fixture.componentInstance.manageRequested.subscribe(requested);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.clock-shell').click();

    expect(requested).toHaveBeenCalledOnce();
  });

  it('reflects the shared reading time in its cards', () => {
    const fixture = TestBed.createComponent(ReadingTimerComponent);
    const timer = TestBed.inject(ReadingTimerService);
    timer.elapsedSeconds.set(65);
    fixture.detectChanges();

    const digits = [...fixture.nativeElement.querySelectorAll('.flip-card')].map(
      (card: HTMLElement) => card.textContent?.trim(),
    );

    expect(digits).toEqual(['0', '1', '0', '5']);
  });
});
