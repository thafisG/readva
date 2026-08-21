import { Injectable, computed, inject, signal } from '@angular/core';
import type { ReadingActivity } from '../../../core/models/activity.model';
import type { PublicUser } from '../../../core/models/user.model';
import { STORAGE_KEYS } from '../../../core/storage/storage.keys';
import { StorageService } from '../../../core/storage/storage.service';

const SEED_USERS: PublicUser[] = [
  { email: 'ana@readva.com', name: 'Ana Lima', avatar: 'https://i.pravatar.cc/32?u=ana' },
  { email: 'pedro@readva.com', name: 'Pedro Souza', avatar: 'https://i.pravatar.cc/32?u=pedro' },
  { email: 'julia@readva.com', name: 'Julia Ferreira', avatar: 'https://i.pravatar.cc/32?u=julia' },
  { email: 'marcos@readva.com', name: 'Marcos Costa', avatar: 'https://i.pravatar.cc/32?u=marcos' },
];

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly storage = inject(StorageService);
  private readonly currentUserEmail = signal('guest');
  readonly following = signal<string[]>([]);
  readonly allUsers = signal<PublicUser[]>(SEED_USERS);
  readonly suggestions = computed(() =>
    this.allUsers().filter(
      (user) => user.email !== this.currentUserEmail() && !this.following().includes(user.email),
    ),
  );

  init(email: string): void {
    const owner = email.trim().toLowerCase() || 'guest';
    this.currentUserEmail.set(owner);
    const following = this.storage.readUser<unknown>(
      STORAGE_KEYS.following,
      owner,
      [],
      [`@readva:following:${owner}`],
    );
    this.following.set(
      Array.isArray(following)
        ? [...new Set(following.filter((item): item is string => typeof item === 'string'))]
        : [],
    );
    this.seedActivities();
  }

  follow(email: string): void {
    const normalized = email.trim().toLowerCase();
    if (!normalized || this.following().includes(normalized)) return;
    this.following.update((items) => [...items, normalized]);
    this.persistFollowing();
  }

  unfollow(email: string): void {
    this.following.update((items) => items.filter((item) => item !== email));
    this.persistFollowing();
  }

  isFollowing(email: string): boolean {
    return this.following().includes(email);
  }
  getUserName(email: string): string {
    return this.allUsers().find((user) => user.email === email)?.name ?? email;
  }

  getFollowingActivities(): ReadingActivity[] {
    return this.following()
      .flatMap((email) => this.loadActivities(email))
      .sort((a, b) => Date.parse(b.createdAt ?? '') - Date.parse(a.createdAt ?? ''));
  }

  private loadActivities(email: string): ReadingActivity[] {
    const value = this.storage.readUser<unknown>(
      STORAGE_KEYS.activities,
      email,
      [],
      [`@readva:activities:${email}`],
    );
    return Array.isArray(value) ? value.filter(this.isActivity) : [];
  }

  private seedActivities(): void {
    const seeds: Array<{
      user: PublicUser;
      activities: Array<
        Pick<ReadingActivity, 'bookTitle' | 'bookAuthor' | 'detail'> & {
          comment?: string;
          createdAt: string;
        }
      >;
    }> = [
      {
        user: SEED_USERS[0],
        activities: [
          {
            bookTitle: 'O Senhor dos Anéis',
            bookAuthor: 'J.R.R. Tolkien',
            detail: 'Leu mais 42 páginas',
            comment: 'A Sociedade do Anel é incrível.',
            createdAt: '2026-06-01T12:00:00.000Z',
          },
          {
            bookTitle: 'Sapiens',
            bookAuthor: 'Yuval Noah Harari',
            detail: 'Leu mais 80 páginas',
            comment: 'Muda muito a perspectiva sobre história.',
            createdAt: '2026-05-31T12:00:00.000Z',
          },
        ],
      },
      {
        user: SEED_USERS[1],
        activities: [
          {
            bookTitle: '1984',
            bookAuthor: 'George Orwell',
            detail: 'Leu mais 60 páginas',
            comment: 'Assustadoramente atual.',
            createdAt: '2026-06-01T10:00:00.000Z',
          },
        ],
      },
      {
        user: SEED_USERS[2],
        activities: [
          {
            bookTitle: 'Duna',
            bookAuthor: 'Frank Herbert',
            detail: 'Leu mais 100 páginas',
            comment: 'Worldbuilding impressionante.',
            createdAt: '2026-06-01T13:00:00.000Z',
          },
          {
            bookTitle: 'A Revolução dos Bichos',
            bookAuthor: 'George Orwell',
            detail: 'Leu mais 30 páginas',
            createdAt: '2026-05-29T12:00:00.000Z',
          },
        ],
      },
      {
        user: SEED_USERS[3],
        activities: [
          {
            bookTitle: 'Clean Code',
            bookAuthor: 'Robert C. Martin',
            detail: 'Leu mais 25 páginas',
            comment: 'Leitura obrigatória pra dev.',
            createdAt: '2026-06-01T08:00:00.000Z',
          },
        ],
      },
    ];
    for (const { user, activities } of seeds) {
      if (this.loadActivities(user.email).length) continue;
      this.storage.writeUser(
        STORAGE_KEYS.activities,
        user.email,
        activities.map(
          (activity, index): ReadingActivity => ({
            ...activity,
            id: `${user.email}-seed-${index}`,
            userId: user.email,
            userName: user.name,
            userAvatar: user.avatar,
            actionType: 'progress',
            bookId: `${user.email}-book-${index}`,
            timestamp: activity.createdAt,
            likes: ((index + user.name.length) % 12) + 1,
            hasLiked: false,
            isOwner: false,
            commentsCount: 0,
          }),
        ),
      );
    }
  }

  private persistFollowing(): void {
    this.storage.writeUser(STORAGE_KEYS.following, this.currentUserEmail(), this.following());
  }
  private readonly isActivity = (value: unknown): value is ReadingActivity => {
    if (typeof value !== 'object' || value === null) return false;
    const item = value as Record<string, unknown>;
    return (
      typeof item['id'] === 'string' &&
      typeof item['bookTitle'] === 'string' &&
      typeof item['detail'] === 'string'
    );
  };
}
