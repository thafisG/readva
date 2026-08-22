import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { ChallengesService } from './challenges.service';
import { StorageService } from '../../../core/storage/storage.service';

describe('ChallengesService Moka celebrations', () => {
  let service: ChallengesService;

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
    TestBed.tick();
  });

  it('announces every completed mission, even after the achievement was already unlocked', () => {
    service.onPagesRead(20);
    const firstCelebration = service.celebration();

    expect(firstCelebration?.mood).toBe('mission');

    service.dismissJustUnlocked();
    service.resetDailyMissions();
    service.onPagesRead(20);
    const repeatedCelebration = service.celebration();

    expect(repeatedCelebration?.mood).toBe('mission');
    expect(repeatedCelebration?.id).toBeGreaterThan(firstCelebration?.id ?? 0);
  });
});
