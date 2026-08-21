import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { BookSuggestion } from '../../../../core/models/book.model';

@Component({
  selector: 'app-recommendations',
  standalone: true,
  templateUrl: './recommendations.component.html',
  styleUrl: './recommendations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecommendationsComponent {
  readonly suggestions = input.required<readonly BookSuggestion[]>();
}
