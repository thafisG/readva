import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChallengesService } from '../../services/challenges.service';

@Component({
  selector: 'app-challenges',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './challenges.component.html',
  styleUrls: ['./challenges.component.scss'],
})
export class ChallengesComponent {
  readonly challengesService = inject(ChallengesService);
  private readonly router = inject(Router);

  goBack(): void {
    this.router.navigate(['/']);
  }

  dismissUnlockToast(): void {
    this.challengesService.dismissJustUnlocked();
  }
}
