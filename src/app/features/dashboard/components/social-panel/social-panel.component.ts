import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { PublicUser } from '../../../../core/models/user.model';

@Component({
  selector: 'app-social-panel',
  standalone: true,
  templateUrl: './social-panel.component.html',
  styleUrl: './social-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialPanelComponent {
  readonly suggestions = input.required<readonly PublicUser[]>();
  readonly following = input.required<readonly string[]>();
  readonly users = input.required<readonly PublicUser[]>();
  readonly follow = output<string>();
  readonly unfollow = output<string>();
  userName(email: string): string {
    return this.users().find((user) => user.email === email)?.name ?? email;
  }
}
