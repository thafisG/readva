import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../dashboard/services/auth.service';
import { ChallengesService } from '../../../dashboard/services/challenges.service';

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  templateUrl: './profile-header.component.html',
  styleUrl: './profile-header.component.scss',
})
export class ProfileHeaderComponent {
  readonly auth = inject(AuthService);
  readonly challenges = inject(ChallengesService);
}
