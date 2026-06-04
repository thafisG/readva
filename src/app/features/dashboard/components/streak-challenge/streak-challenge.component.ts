import { Component, input } from '@angular/core';
import { UserProgress } from '../../interfaces/dashboard.interface';

@Component({
  selector: 'app-streak-challenge',
  standalone: true,
  template: `
    <div class="card streak-card">
      <div class="user-info">
        <img [src]="progress().avatar" [alt]="progress().name" class="avatar" />
        <div>
          <h2>Olá, {{ progress().name.split(' ')[0] }}! 👋</h2>
          <p class="subtitle">Pronto para a leitura de hoje?</p>
        </div>
      </div>
      <div class="divider"></div>
      <div class="streak-badge">
        <span class="fire-icon">🔥</span>
        <div class="streak-details">
          <span class="count">{{ progress().currentStreak }} Dias</span>
          <span class="label">Sequência de leitura atual</span>
        </div>
      </div>
      <div class="goal-section">
        <div class="goal-header">
          <span>Meta Diária</span>
          <span class="goal-ratio"
            >{{ progress().dailyMinutesRead }}/{{ progress().dailyGoalMinutes }} min</span
          >
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" [style.width.%]="getPercentage()"></div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .streak-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        padding: 24px;
      }
      .user-info {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
      }
      h2 {
        font-size: 1.125rem;
        font-weight: 700;
        color: #111827;
        margin: 0;
      }
      .subtitle {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 4px 0 0 0;
      }
      .divider {
        height: 1px;
        background: #e5e7eb;
        margin: 20px 0;
      }
      .streak-badge {
        display: flex;
        align-items: center;
        gap: 16px;
        background: #fff7ed;
        border: 1px solid #ffedd5;
        padding: 16px;
        border-radius: 12px;
        margin-bottom: 20px;
      }
      .fire-icon {
        font-size: 2rem;
      }
      .streak-details {
        display: flex;
        flex-direction: column;
      }
      .count {
        font-size: 1.25rem;
        font-weight: 700;
        color: #ea580c;
      }
      .label {
        font-size: 0.75rem;
        color: #9a3412;
      }
      .goal-header {
        display: flex;
        justify-content: space-between;
        font-size: 0.875rem;
        font-weight: 500;
        color: #111827;
        margin-bottom: 8px;
      }
      .goal-ratio {
        color: #6b7280;
      }
      .progress-bar-container {
        background: #f3f4f6;
        border-radius: 9999px;
        height: 8px;
        overflow: hidden;
      }
      .progress-bar {
        background: #2563eb;
        height: 100%;
        border-radius: 9999px;
        transition: width 0.4s ease;
      }
    `,
  ],
})
export class StreakChallengeComponent {
  progress = input.required<UserProgress>();
  getPercentage(): number {
    return Math.min(
      (this.progress().dailyMinutesRead / this.progress().dailyGoalMinutes) * 100,
      100,
    );
  }
}
