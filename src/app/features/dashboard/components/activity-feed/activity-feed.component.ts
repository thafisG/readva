import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ReadingActivity } from '../../../../core/models/activity.model';

export type FeedTab = 'meu-feed' | 'global';

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  templateUrl: './activity-feed.component.html',
  styleUrl: './activity-feed.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityFeedComponent {
  readonly activeTab = input.required<FeedTab>();
  readonly ownActivities = input.required<readonly ReadingActivity[]>();
  readonly globalActivities = input.required<readonly ReadingActivity[]>();
  readonly following = input.required<readonly string[]>();

  readonly tabChanged = output<FeedTab>();
  readonly ownActivityLiked = output<string>();
  readonly editRequested = output<ReadingActivity>();
  readonly deleteRequested = output<ReadingActivity>();
  readonly followToggled = output<string>();
  readonly globalActivityLiked = output<ReadingActivity>();

  isFollowing(userId: string): boolean {
    return this.following().includes(userId);
  }
}
