import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ActivityType, ReadingActivity } from '../../../core/models/activity.model';

export interface ReaderActivityRecord {
  id: string;
  readerId: string;
  bookReference: string;
  bookTitle: string;
  bookAuthor: string;
  bookCategory?: string | null;
  actionType: ActivityType;
  pagesRead: number;
  minutesRead: number;
  note?: string | null;
  occurredOn: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ReaderActivityApiService {
  private readonly http = inject(HttpClient);

  list(readerId: string): Observable<ReaderActivityRecord[]> {
    return this.http.get<ReaderActivityRecord[]>(this.collectionUrl(readerId));
  }

  save(readerId: string, activity: ReadingActivity): Observable<ReaderActivityRecord> {
    return this.http.put<ReaderActivityRecord>(
      `${this.collectionUrl(readerId)}/${encodeURIComponent(activity.id)}`,
      this.toRequest(activity),
    );
  }

  importActivities(
    readerId: string,
    activities: ReadingActivity[],
  ): Observable<ReaderActivityRecord[]> {
    return this.http.post<ReaderActivityRecord[]>(
      `${this.collectionUrl(readerId)}/import`,
      activities.map((activity) => this.toRequest(activity)),
    );
  }

  delete(readerId: string, activityId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.collectionUrl(readerId)}/${encodeURIComponent(activityId)}`,
    );
  }

  private collectionUrl(readerId: string): string {
    return `/api/readers/${encodeURIComponent(readerId)}/activities`;
  }

  private toRequest(activity: ReadingActivity) {
    const createdAt = activity.createdAt ?? activity.timestamp ?? new Date().toISOString();
    return {
      id: activity.id,
      bookReference: activity.bookId,
      bookTitle: activity.bookTitle,
      bookAuthor: activity.bookAuthor || 'Autor desconhecido',
      bookCategory: activity.bookCategory || activity.category || null,
      actionType: activity.actionType,
      pagesRead: this.nonNegativeInteger(activity.pagesRead),
      minutesRead: this.nonNegativeInteger(activity.minutesRead),
      note: activity.comment?.trim() || null,
      occurredOn: activity.occurredOn ?? this.localDateKey(createdAt),
      createdAt,
      updatedAt: activity.updatedAt ?? createdAt,
    };
  }

  private localDateKey(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private nonNegativeInteger(value: number | undefined): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
  }
}
