import { Component, computed, input } from '@angular/core';
import type { ReaderStatistics } from '../../../../core/models/profile-statistics.model';

@Component({
  selector: 'app-weekly-reading-chart',
  standalone: true,
  templateUrl: './weekly-reading-chart.component.html',
  styleUrl: './weekly-reading-chart.component.scss',
})
export class WeeklyReadingChartComponent {
  readonly stats = input.required<ReaderStatistics>();
  readonly activeDays = computed(() => this.stats().weekDays.filter((day) => day.active).length);
  private readonly maxMinutes = computed(() =>
    Math.max(1, ...this.stats().weekDays.map((day) => day.minutes)),
  );
  barHeight(minutes: number): number {
    return minutes ? Math.max(12, Math.round((minutes / this.maxMinutes()) * 100)) : 4;
  }
  formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return remaining ? `${hours}h ${remaining}min` : `${hours}h`;
  }
}
