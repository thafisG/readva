import type { ReadingActivity } from '../../../core/models/activity.model';
import {
  calculateMonthlyMissionStats,
  createDailyMissions,
  inferMissionHistoryFromActivities,
  reconcileDailyMissions,
} from './challenge-progress.rules';

describe('challenge progress rules', () => {
  it('rotates mission targets deterministically between days', () => {
    const firstDay = createDailyMissions('2026-08-24');
    const nextDay = createDailyMissions('2026-08-25');

    expect(createDailyMissions('2026-08-24')).toEqual(firstDay);
    expect(nextDay).not.toEqual(firstDay);
    expect(firstDay).toHaveLength(4);
  });

  it('calculates monthly totals and the current active-day streak', () => {
    const stats = calculateMonthlyMissionStats(
      {
        '2026-08-21': ['read-pages'],
        '2026-08-22': ['read-pages', 'read-minutes'],
        '2026-08-23': ['read-session'],
        '2026-08-24': ['start-book'],
      },
      new Date(2026, 7, 24, 12),
    );

    expect(stats.completedMissions).toBe(5);
    expect(stats.activeDays).toBe(4);
    expect(stats.streakDays).toBe(4);
    expect(stats.availableMissions).toBe(96);
  });

  it('reconstructs historical goals and current progress from existing activities', () => {
    const activity = {
      id: 'existing-activity',
      userId: 'reader@example.com',
      userName: 'Leitor',
      userAvatar: '',
      actionType: 'progress',
      bookId: 'book-1',
      bookTitle: 'Livro existente',
      bookAuthor: 'Autora',
      detail: 'Leu mais 30 páginas • 30 min de leitura',
      timestamp: '2026-08-24T15:00:00',
      createdAt: '2026-08-24T15:00:00',
      pagesRead: 30,
      minutesRead: 30,
      likes: 0,
      commentsCount: 0,
      hasLiked: false,
    } satisfies ReadingActivity;

    const history = inferMissionHistoryFromActivities([activity]);
    const missions = reconcileDailyMissions(
      createDailyMissions('2026-08-24'),
      [activity],
      '2026-08-24',
    );

    expect(history['2026-08-24']).toEqual(expect.arrayContaining(['read-pages', 'read-minutes']));
    expect(missions.find((mission) => mission.id === 'read-pages')?.completed).toBe(true);
    expect(missions.find((mission) => mission.id === 'read-minutes')?.completed).toBe(true);
    expect(missions.find((mission) => mission.id === 'read-session')?.progress).toBe(1);
  });
});
