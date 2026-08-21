import { Component, input } from '@angular/core';
import type { ReadingCategoryStat } from '../../../../core/models/profile-statistics.model';

@Component({
  selector: 'app-category-breakdown',
  standalone: true,
  templateUrl: './category-breakdown.component.html',
  styleUrl: './category-breakdown.component.scss',
})
export class CategoryBreakdownComponent {
  readonly categories = input.required<readonly ReadingCategoryStat[]>();
}
