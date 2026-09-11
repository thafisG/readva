import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { ReadingActivity } from '../../../core/models/activity.model';
import type { Book } from '../../../core/models/book.model';
import type { UserSession } from '../../../core/models/user.model';
import { STORAGE_KEYS } from '../../../core/storage/storage.keys';
import { StorageService } from '../../../core/storage/storage.service';
import { AuthService } from './auth.service';
import { ChallengesService } from './challenges.service';
import { ReaderActivityApiService, type ReaderActivityRecord } from './reader-activity-api.service';

interface ProgressActivityInput {
  book: Pick<Book, 'id' | 'title' | 'author' | 'category'>;
  user: UserSession;
  pagesRead: number;
  minutesRead: number;
  comment: string;
}

export interface ActivityUpdateResult {
  activity: ReadingActivity;
  pagesDifference: number;
}

@Injectable({ providedIn: 'root' })
export class ReadingActivityService {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ReaderActivityApiService);
  private readonly challenges = inject(ChallengesService);
  private readonly storage = inject(StorageService);

  private readonly activityState = signal<ReadingActivity[]>([]);
  private readonly syncingState = signal(false);
  private readonly syncErrorState = signal(false);
  private loadVersion = 0;

  readonly activities = this.activityState.asReadonly();
  readonly syncing = this.syncingState.asReadonly();
  readonly syncError = this.syncErrorState.asReadonly();
  readonly todayMinutesRead = computed(() => {
    const today = this.localDateKey(new Date());
    return this.activityState().reduce(
      (total, activity) =>
        this.activityDateKey(activity) === today ? total + (activity.minutesRead ?? 0) : total,
      0,
    );
  });

  load(user: UserSession | null): number {
    const version = ++this.loadVersion;
    const email = user?.email ?? 'guest';
    const localActivities = this.storage.readUser<ReadingActivity[]>(
      STORAGE_KEYS.activities,
      email,
      [],
      [`@readva:activities:${email}`],
    );
    this.activityState.set(
      localActivities.map((activity) => this.normalizeLocalActivity(activity, user)),
    );
    this.syncErrorState.set(false);
    return version;
  }

  async synchronize(user: UserSession, readerId: string, version: number): Promise<void> {
    this.syncingState.set(true);
    try {
      const pendingDeletions = this.pendingDeletions();
      await Promise.all(
        pendingDeletions.map((activityId) => firstValueFrom(this.api.delete(readerId, activityId))),
      );
      if (version !== this.loadVersion) return;
      this.savePendingDeletions([]);

      let serverActivities = await firstValueFrom(this.api.list(readerId));
      if (version !== this.loadVersion) return;
      let serverById = new Map(serverActivities.map((activity) => [activity.id, activity]));
      const activitiesToImport = this.activityState().filter((localActivity) => {
        if (!this.isPersistable(localActivity)) return false;
        const serverActivity = serverById.get(localActivity.id);
        return !serverActivity || this.isLocalNewer(localActivity, serverActivity);
      });
      for (let index = 0; index < activitiesToImport.length; index += 500) {
        serverActivities = await firstValueFrom(
          this.api.importActivities(readerId, activitiesToImport.slice(index, index + 500)),
        );
      }
      if (version !== this.loadVersion) return;
      serverById = new Map(serverActivities.map((activity) => [activity.id, activity]));

      const localActivities = this.activityState();
      const localById = new Map(localActivities.map((activity) => [activity.id, activity]));
      const merged = new Map(
        serverActivities.map((record) => [
          record.id,
          this.fromRecord(record, user, localById.get(record.id)),
        ]),
      );
      localActivities.forEach((localActivity) => {
        if (!this.isPersistable(localActivity)) return;
        const serverActivity = serverById.get(localActivity.id);
        if (!serverActivity || this.isLocalNewer(localActivity, serverActivity)) {
          merged.set(localActivity.id, localActivity);
        }
      });
      this.activityState.set(this.sortByNewest([...merged.values()]));
      this.persist();
      this.challenges.reconcilePersistedActivities();
      await this.challenges.refreshFromServer();
      this.syncErrorState.set(false);
    } catch {
      if (version === this.loadVersion) this.syncErrorState.set(true);
    } finally {
      if (version === this.loadVersion) this.syncingState.set(false);
    }
  }

  recordProgress(input: ProgressActivityInput): ReadingActivity {
    const now = new Date().toISOString();
    const activity: ReadingActivity = {
      id: this.createId(),
      userId: input.user.email,
      userName: input.user.name,
      userAvatar: input.user.avatar,
      actionType: 'progress',
      occurredOn: this.localDateKey(new Date(now)),
      bookId: input.book.id,
      bookTitle: input.book.title,
      bookAuthor: input.book.author,
      bookCategory: input.book.category,
      detail: this.detail('progress', input.pagesRead, input.minutesRead),
      comment: input.comment.trim(),
      minutesRead: input.minutesRead,
      pagesRead: input.pagesRead,
      createdAt: now,
      updatedAt: now,
      timestamp: now,
      likes: 0,
      commentsCount: 0,
      hasLiked: false,
      isOwner: true,
    };
    this.activityState.update((activities) => [activity, ...activities]);
    this.persist();
    void this.saveRemotely(activity);

    if (input.pagesRead > 0) this.challenges.onPagesRead(input.pagesRead);
    this.challenges.onReadingSession();
    if (input.minutesRead > 0) this.challenges.onMinutesRead(input.minutesRead);
    if (new Date().getHours() >= 22) this.challenges.onNightReading();
    return activity;
  }

  update(activityId: string, changes: Partial<ReadingActivity>): ActivityUpdateResult | null {
    const existing = this.activityState().find((activity) => activity.id === activityId);
    if (!existing) return null;
    const pagesRead = this.nonNegativeInteger(changes.pagesRead ?? existing.pagesRead ?? 0);
    const minutesRead = this.nonNegativeInteger(changes.minutesRead ?? existing.minutesRead ?? 0);
    if (pagesRead === 0 && minutesRead === 0) return null;

    const updated: ReadingActivity = {
      ...existing,
      ...changes,
      pagesRead,
      minutesRead,
      detail: this.detail(existing.actionType, pagesRead, minutesRead),
      createdAt: existing.createdAt ?? existing.timestamp,
      timestamp: existing.timestamp,
      updatedAt: new Date().toISOString(),
    };
    this.activityState.update((activities) =>
      activities.map((activity) => (activity.id === activityId ? updated : activity)),
    );
    this.persist();
    this.challenges.reconcilePersistedActivities();
    void this.saveRemotely(updated);
    return { activity: updated, pagesDifference: pagesRead - (existing.pagesRead ?? 0) };
  }

  delete(activityId: string): ReadingActivity | null {
    const activity = this.activityState().find((candidate) => candidate.id === activityId);
    if (!activity) return null;
    this.activityState.update((activities) =>
      activities.filter((candidate) => candidate.id !== activityId),
    );
    this.addPendingDeletion(activityId);
    this.persist();
    this.challenges.reconcilePersistedActivities();
    void this.deleteRemotely(activityId);
    return activity;
  }

  deleteByBook(bookId: string): void {
    const removed = this.activityState().filter((activity) => activity.bookId === bookId);
    if (removed.length === 0) return;
    this.activityState.update((activities) =>
      activities.filter((activity) => activity.bookId !== bookId),
    );
    removed.forEach((activity) => {
      this.addPendingDeletion(activity.id);
      void this.deleteRemotely(activity.id);
    });
    this.persist();
    this.challenges.reconcilePersistedActivities();
  }

  toggleLike(activityId: string): void {
    this.activityState.update((activities) =>
      activities.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              hasLiked: !activity.hasLiked,
              likes: Math.max(0, activity.likes + (activity.hasLiked ? -1 : 1)),
            }
          : activity,
      ),
    );
    this.persist();
  }

  private async saveRemotely(activity: ReadingActivity): Promise<void> {
    const user = this.auth.currentUser();
    if (!user?.id) return;
    try {
      const saved = await firstValueFrom(this.api.save(user.id, activity));
      if (this.pendingDeletions().includes(activity.id)) {
        await firstValueFrom(this.api.delete(user.id, activity.id));
        this.removePendingDeletion(activity.id);
        return;
      }
      const current = this.activityState().find((candidate) => candidate.id === activity.id);
      if (current?.updatedAt === activity.updatedAt) {
        const normalized = this.fromRecord(saved, user, current);
        this.activityState.update((activities) =>
          activities.map((candidate) => (candidate.id === normalized.id ? normalized : candidate)),
        );
        this.persist();
      }
      await this.challenges.refreshFromServer();
      this.syncErrorState.set(false);
    } catch {
      this.syncErrorState.set(true);
    }
  }

  private async deleteRemotely(activityId: string): Promise<void> {
    const readerId = this.auth.currentUser()?.id;
    if (!readerId) return;
    try {
      await firstValueFrom(this.api.delete(readerId, activityId));
      this.removePendingDeletion(activityId);
      await this.challenges.refreshFromServer();
      this.syncErrorState.set(false);
    } catch {
      this.syncErrorState.set(true);
    }
  }

  private normalizeLocalActivity(
    activity: ReadingActivity,
    user: UserSession | null,
  ): ReadingActivity {
    const createdAt = activity.createdAt ?? activity.timestamp ?? new Date().toISOString();
    const pagesRead = this.nonNegativeInteger(activity.pagesRead ?? 0);
    const minutesRead = this.nonNegativeInteger(activity.minutesRead ?? 0);
    return {
      ...activity,
      id: String(activity.id),
      userId: activity.userId || user?.email || 'guest',
      userName: activity.userName || user?.name || 'Leitor',
      userAvatar: activity.userAvatar || user?.avatar || '',
      actionType: activity.actionType ?? 'progress',
      bookAuthor: activity.bookAuthor || 'Autor desconhecido',
      detail: this.detail(activity.actionType ?? 'progress', pagesRead, minutesRead),
      occurredOn: activity.occurredOn ?? this.localDateKey(new Date(createdAt)),
      createdAt,
      updatedAt: activity.updatedAt ?? createdAt,
      timestamp: activity.timestamp ?? createdAt,
      pagesRead,
      minutesRead,
      likes: this.nonNegativeInteger(activity.likes),
      commentsCount: this.nonNegativeInteger(activity.commentsCount),
      hasLiked: Boolean(activity.hasLiked),
      isOwner: true,
    };
  }

  private fromRecord(
    record: ReaderActivityRecord,
    user: UserSession,
    local?: ReadingActivity,
  ): ReadingActivity {
    return {
      ...local,
      id: record.id,
      userId: user.email,
      userName: user.name,
      userAvatar: user.avatar,
      actionType: record.actionType,
      bookId: record.bookReference,
      bookTitle: record.bookTitle,
      bookAuthor: record.bookAuthor,
      bookCategory: record.bookCategory ?? undefined,
      detail: this.detail(record.actionType, record.pagesRead, record.minutesRead),
      comment: record.note ?? '',
      pagesRead: record.pagesRead,
      minutesRead: record.minutesRead,
      occurredOn: record.occurredOn,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      timestamp: record.createdAt,
      likes: local?.likes ?? 0,
      commentsCount: local?.commentsCount ?? 0,
      hasLiked: local?.hasLiked ?? false,
      isOwner: true,
    };
  }

  private persist(): void {
    this.storage.writeUser(
      STORAGE_KEYS.activities,
      this.auth.currentUser()?.email ?? 'guest',
      this.activityState(),
    );
  }

  private pendingDeletions(): string[] {
    return this.storage.readUser(
      STORAGE_KEYS.deletedActivities,
      this.auth.currentUser()?.email ?? 'guest',
      [],
    );
  }

  private addPendingDeletion(activityId: string): void {
    this.savePendingDeletions([...new Set([...this.pendingDeletions(), activityId])]);
  }

  private removePendingDeletion(activityId: string): void {
    this.savePendingDeletions(this.pendingDeletions().filter((id) => id !== activityId));
  }

  private savePendingDeletions(activityIds: string[]): void {
    this.storage.writeUser(
      STORAGE_KEYS.deletedActivities,
      this.auth.currentUser()?.email ?? 'guest',
      activityIds,
    );
  }

  private isPersistable(activity: ReadingActivity): boolean {
    return (activity.pagesRead ?? 0) > 0 || (activity.minutesRead ?? 0) > 0;
  }

  private isLocalNewer(local: ReadingActivity, server: ReaderActivityRecord): boolean {
    return (
      this.timestamp(local.updatedAt ?? local.createdAt) >
      this.timestamp(server.updatedAt ?? server.createdAt)
    );
  }

  private timestamp(value?: string): number {
    const timestamp = Date.parse(value ?? '');
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  private detail(
    actionType: ReadingActivity['actionType'],
    pagesRead: number,
    minutesRead: number,
  ): string {
    if (actionType === 'finished') return 'Concluiu a leitura';
    if (actionType === 'started') return 'Começou a ler';
    return `Leu mais ${pagesRead} páginas${minutesRead ? ` • ${minutesRead} min de leitura` : ''}`;
  }

  private sortByNewest(activities: ReadingActivity[]): ReadingActivity[] {
    return activities.sort((left, right) =>
      (right.createdAt ?? right.timestamp).localeCompare(left.createdAt ?? left.timestamp),
    );
  }

  private activityDateKey(activity: ReadingActivity): string {
    if (activity.occurredOn && /^\d{4}-\d{2}-\d{2}$/.test(activity.occurredOn)) {
      return activity.occurredOn;
    }
    return this.localDateKey(new Date(activity.createdAt ?? activity.timestamp));
  }

  private localDateKey(date: Date): string {
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private nonNegativeInteger(value: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
  }

  private createId(): string {
    return (
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
  }
}
