import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { AvatarConfig } from '../../../core/models/avatar.model';

export interface ReaderProfileState {
  readerId: string;
  displayName: string;
  email: string;
  bio: string | null;
  avatar: AvatarConfig | null;
  localMigrationCompleted: boolean;
  updatedAt: string;
}

export interface SaveReaderProfile {
  displayName: string;
  bio: string;
  avatar: AvatarConfig | null;
}

@Injectable({ providedIn: 'root' })
export class ReaderProfileApiService {
  private readonly http = inject(HttpClient);

  get(readerId: string): Observable<ReaderProfileState> {
    return this.http.get<ReaderProfileState>(this.baseUrl(readerId));
  }

  save(readerId: string, profile: SaveReaderProfile): Observable<ReaderProfileState> {
    return this.http.put<ReaderProfileState>(this.baseUrl(readerId), profile);
  }

  importLegacy(
    readerId: string,
    profile: Pick<SaveReaderProfile, 'bio' | 'avatar'>,
  ): Observable<ReaderProfileState> {
    return this.http.post<ReaderProfileState>(`${this.baseUrl(readerId)}/import`, profile);
  }

  private baseUrl(readerId: string): string {
    return `/api/readers/${encodeURIComponent(readerId)}/profile`;
  }
}
