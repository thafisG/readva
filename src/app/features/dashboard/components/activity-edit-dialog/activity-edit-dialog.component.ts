import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ReadingActivity } from '../../../../core/models/activity.model';

export interface ActivityEditRequest {
  activity: ReadingActivity;
  comment: string;
  pagesRead: number;
  minutesRead: number;
}

@Component({
  selector: 'app-activity-edit-dialog',
  standalone: true,
  imports: [A11yModule, FormsModule],
  templateUrl: './activity-edit-dialog.component.html',
  styleUrl: './activity-edit-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityEditDialogComponent {
  readonly activity = input.required<ReadingActivity>();
  readonly saved = output<ActivityEditRequest>();
  readonly cancelled = output<void>();

  comment = '';
  pagesRead = 0;
  minutesRead = 0;

  constructor() {
    effect(() => {
      const activity = this.activity();
      this.comment = activity.comment ?? '';
      this.pagesRead = activity.pagesRead ?? 0;
      this.minutesRead = activity.minutesRead ?? 0;
    });
  }

  save(): void {
    this.saved.emit({
      activity: this.activity(),
      comment: this.comment.trim(),
      pagesRead: this.nonNegativeInteger(this.pagesRead),
      minutesRead: this.nonNegativeInteger(this.minutesRead),
    });
  }

  private nonNegativeInteger(value: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
  }
}
