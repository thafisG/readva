import { TestBed } from '@angular/core/testing';
import type { ReadingActivity } from '../../../../core/models/activity.model';
import { ActivityEditDialogComponent } from './activity-edit-dialog.component';

const activity = {
  id: 'activity-1',
  comment: 'Original',
  pagesRead: 10,
  minutesRead: 5,
} as ReadingActivity;

describe('ActivityEditDialogComponent', () => {
  it('normalizes values and emits the edited activity', () => {
    const fixture = TestBed.createComponent(ActivityEditDialogComponent);
    fixture.componentRef.setInput('activity', activity);
    fixture.detectChanges();
    const saved = vi.fn();
    fixture.componentInstance.saved.subscribe(saved);

    fixture.componentInstance.comment = '  Atualizado  ';
    fixture.componentInstance.pagesRead = 12.9;
    fixture.componentInstance.minutesRead = -4;
    fixture.componentInstance.save();

    expect(saved).toHaveBeenCalledWith({
      activity,
      comment: 'Atualizado',
      pagesRead: 12,
      minutesRead: 0,
    });
  });
});
