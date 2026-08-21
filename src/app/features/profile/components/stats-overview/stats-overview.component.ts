import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import type { ReaderStatistics } from '../../../../core/models/profile-statistics.model';

@Component({
  selector: 'app-stats-overview',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './stats-overview.component.html',
  styleUrl: './stats-overview.component.scss',
})
export class StatsOverviewComponent {
  readonly stats = input.required<ReaderStatistics>();
  formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return remaining ? `${hours}h ${remaining}min` : `${hours}h`;
  }
}
