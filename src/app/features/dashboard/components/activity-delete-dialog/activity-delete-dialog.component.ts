import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ReadingActivity } from '../../../../core/models/activity.model';

@Component({
  selector: 'app-activity-delete-dialog',
  standalone: true,
  imports: [A11yModule],
  templateUrl: './activity-delete-dialog.component.html',
  styleUrl: './activity-delete-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityDeleteDialogComponent {
  readonly activity = input.required<ReadingActivity>();
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
