import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ReadingGoals } from '../../../core/models/profile-statistics.model';

export interface ReaderMissionProgress {
  id: string;
  progress: number;
  target: number;
  xpReward: number;
  completed: boolean;
}

export interface ReaderGamificationState {
  goals: ReadingGoals;
  timeZone: string;
  localMigrationCompleted: boolean;
  totalXp: number;
  missionsDay: string;
  missions: ReaderMissionProgress[];
  markedDays: string[];
  missionHistory: Record<string, string[]>;
  unseenMissionKeys: string[];
  achievementIds: string[];
  rewardedBookIds: string[];
}

export interface LegacyGamificationState {
  goals: ReadingGoals;
  timeZone: string;
  totalXp: number;
  markedDays: string[];
  missionHistory: Record<string, string[]>;
  unseenMissionKeys: string[];
  achievementIds: string[];
  rewardedBookIds: string[];
}

@Injectable({ providedIn: 'root' })
export class ReaderGamificationApiService {
  private readonly http = inject(HttpClient);

  get(readerId: string): Observable<ReaderGamificationState> {
    return this.http.get<ReaderGamificationState>(this.baseUrl(readerId));
  }

  importLegacy(
    readerId: string,
    state: LegacyGamificationState,
  ): Observable<ReaderGamificationState> {
    return this.http.post<ReaderGamificationState>(`${this.baseUrl(readerId)}/import`, state);
  }

  saveGoals(
    readerId: string,
    goals: ReadingGoals,
    timeZone: string,
  ): Observable<ReaderGamificationState> {
    return this.http.put<ReaderGamificationState>(`${this.baseUrl(readerId)}/goals`, {
      ...goals,
      timeZone,
    });
  }

  markDay(readerId: string, date: string): Observable<ReaderGamificationState> {
    return this.http.put<ReaderGamificationState>(
      `${this.baseUrl(readerId)}/streak-days/${encodeURIComponent(date)}`,
      null,
    );
  }

  unmarkDay(readerId: string, date: string): Observable<ReaderGamificationState> {
    return this.http.delete<ReaderGamificationState>(
      `${this.baseUrl(readerId)}/streak-days/${encodeURIComponent(date)}`,
    );
  }

  markMissionsSeen(readerId: string, keys: readonly string[]): Observable<ReaderGamificationState> {
    return this.http.post<ReaderGamificationState>(`${this.baseUrl(readerId)}/missions/seen`, {
      keys,
    });
  }

  private baseUrl(readerId: string): string {
    return `/api/readers/${encodeURIComponent(readerId)}/gamification`;
  }
}
