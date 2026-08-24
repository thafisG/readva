import { TestBed } from '@angular/core/testing';
import { MokaGoalCelebrationComponent } from './moka-goal-celebration.component';

describe('MokaGoalCelebrationComponent', () => {
  it('shows Moka without a modal for goal celebrations', async () => {
    await TestBed.configureTestingModule({
      imports: [MokaGoalCelebrationComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(MokaGoalCelebrationComponent);

    fixture.componentRef.setInput('celebration', { id: 1, mood: 'mission' });
    fixture.detectChanges();

    expect(fixture.componentInstance.visible()).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.moka-goal-pop')).not.toBeNull();
  });
});
