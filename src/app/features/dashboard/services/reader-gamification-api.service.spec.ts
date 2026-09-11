import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ReaderGamificationApiService } from './reader-gamification-api.service';

describe('ReaderGamificationApiService', () => {
  let service: ReaderGamificationApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReaderGamificationApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the reader gamification aggregate', () => {
    service.get('reader 1').subscribe();

    const request = http.expectOne('/api/readers/reader%201/gamification');
    expect(request.request.method).toBe('GET');
    request.flush({});
  });

  it('imports the legacy cache with the browser time zone in both contracts', () => {
    service
      .importLegacy('reader-1', {
        goals: { dailyMinutes: 45, monthlyBooks: 3 },
        timeZone: 'America/Fortaleza',
        totalXp: 80,
        markedDays: ['2026-08-20'],
        missionHistory: { '2026-08-20': ['read-pages'] },
        unseenMissionKeys: ['2026-08-20:read-pages'],
        achievementIds: ['first-mission'],
        rewardedBookIds: [],
      })
      .subscribe();

    const request = http.expectOne('/api/readers/reader-1/gamification/import');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toMatchObject({
      goals: { dailyMinutes: 45, monthlyBooks: 3 },
      timeZone: 'America/Fortaleza',
      totalXp: 80,
    });
    request.flush({});
  });

  it('persists goal and streak changes', () => {
    service.saveGoals('reader-1', { dailyMinutes: 30, monthlyBooks: 2 }, 'UTC').subscribe();
    const goals = http.expectOne('/api/readers/reader-1/gamification/goals');
    expect(goals.request.method).toBe('PUT');
    expect(goals.request.body).toEqual({ dailyMinutes: 30, monthlyBooks: 2, timeZone: 'UTC' });
    goals.flush({});

    service.markDay('reader-1', '2026-08-20').subscribe();
    const streak = http.expectOne('/api/readers/reader-1/gamification/streak-days/2026-08-20');
    expect(streak.request.method).toBe('PUT');
    streak.flush({});
  });
});
