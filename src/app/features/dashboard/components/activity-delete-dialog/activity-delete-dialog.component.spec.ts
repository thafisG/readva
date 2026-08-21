import { TestBed } from '@angular/core/testing';
import type { ReadingActivity } from '../../../../core/models/activity.model';
import { ActivityDeleteDialogComponent } from './activity-delete-dialog.component';

describe('ActivityDeleteDialogComponent', () => {
  it('emits confirmation without mutating the activity', () => {
    const activity = { id: 'activity-1', bookTitle: 'Livro' } as ReadingActivity;
    const fixture = TestBed.createComponent(ActivityDeleteDialogComponent);
    fixture.componentRef.setInput('activity', activity);
    fixture.detectChanges();
    const confirmed = vi.fn();
    fixture.componentInstance.confirmed.subscribe(confirmed);

    const button = fixture.nativeElement.querySelector('.delete-btn') as HTMLButtonElement;
    button.click();

    expect(confirmed).toHaveBeenCalledOnce();
    expect(activity).toEqual({ id: 'activity-1', bookTitle: 'Livro' });
  });
});
