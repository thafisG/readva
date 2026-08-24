import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StorageService } from '../../../core/storage/storage.service';
import { AuthService } from './auth.service';
import { ChallengesService } from './challenges.service';
import { ReadingStreakService } from './reading-streak.service';

describe('ChallengesService Moka celebrations', () => {
  let service: ChallengesService;
  let streakService: ReadingStreakService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChallengesService,
        {
          provide: AuthService,
          useValue: { currentUser: signal(null) },
        },
        {
          provide: StorageService,
          useValue: {
            readUser: vi.fn((_key: string, _email: string, fallback: unknown) => fallback),
            writeUser: vi.fn(),
          },
        },
      ],
    });

    service = TestBed.inject(ChallengesService);
    streakService = TestBed.inject(ReadingStreakService);
    TestBed.tick();
  });

  it('tracks completed missions as unseen monthly progress until the goals page is visited', () => {
    const pagesMission = service.missions().find((mission) => mission.id === 'read-pages');
    expect(pagesMission).toBeDefined();

    service.onPagesRead(pagesMission!.target);
    streakService.toggleToday();

    expect(service.hasUnseenMissions()).toBe(true);
    expect(service.unseenMissionIds()).toContain('read-pages');
    expect(service.monthlyStats().completedMissions).toBe(1);
    expect(service.monthlyStats().activeDays).toBe(1);

    service.markMissionUpdatesSeen();

    expect(service.hasUnseenMissions()).toBe(false);
  });

  it('announces every completed mission, even after the achievement was already unlocked', () => {
    const pagesTarget =
      service.missions().find((mission) => mission.id === 'read-pages')?.target ?? 1;
    service.onPagesRead(pagesTarget);
    const firstCelebration = service.celebration();

    expect(firstCelebration?.mood).toBe('mission');

    service.dismissJustUnlocked();
    service.resetDailyMissions();
    service.onPagesRead(pagesTarget);
    const repeatedCelebration = service.celebration();

    expect(repeatedCelebration?.mood).toBe('mission');
    expect(repeatedCelebration?.id).toBeGreaterThan(firstCelebration?.id ?? 0);
  });
});
