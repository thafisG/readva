import { Injectable, signal, computed } from '@angular/core';

export interface PublicUser {
  email: string;
  name: string;
  avatar: string;
}

const SEED_USERS: PublicUser[] = [
  { email: 'ana@readva.com', name: 'Ana Lima', avatar: 'https://i.pravatar.cc/32?u=ana' },
  { email: 'pedro@readva.com', name: 'Pedro Souza', avatar: 'https://i.pravatar.cc/32?u=pedro' },
  { email: 'julia@readva.com', name: 'Julia Ferreira', avatar: 'https://i.pravatar.cc/32?u=julia' },
  { email: 'marcos@readva.com', name: 'Marcos Costa', avatar: 'https://i.pravatar.cc/32?u=marcos' },
];

@Injectable({ providedIn: 'root' })
export class UserService {
  private currentUserEmail = signal<string>('');
  following = signal<string[]>([]);
  allUsers = signal<PublicUser[]>(SEED_USERS);
  suggestions = computed(() =>
    this.allUsers().filter(
      (u) => u.email !== this.currentUserEmail() && !this.following().includes(u.email),
    ),
  );

  private get storageKey() {
    return `@readva:following:${this.currentUserEmail()}`;
  }

  init(email: string): void {
    this.currentUserEmail.set(email);
    const saved = localStorage.getItem(this.storageKey);
    this.following.set(saved ? JSON.parse(saved) : []);
    this.seedOtherUsersActivities();
  }

  follow(email: string): void {
    this.following.update((list) => {
      const next = [...list, email];
      localStorage.setItem(this.storageKey, JSON.stringify(next));
      return next;
    });
  }

  unfollow(email: string): void {
    this.following.update((list) => {
      const next = list.filter((e) => e !== email);
      localStorage.setItem(this.storageKey, JSON.stringify(next));
      return next;
    });
  }

  isFollowing(email: string): boolean {
    return this.following().includes(email);
  }

  getUserName(email: string): string {
    return this.allUsers().find((u) => u.email === email)?.name ?? email;
  }

  getFollowingActivities(): any[] {
    return this.following()
      .flatMap((email) => {
        const raw = localStorage.getItem(`@readva:activities:${email}`);
        return raw ? JSON.parse(raw) : [];
      })
      .sort((a, b) => {
        return 0;
      });
  }

  private seedOtherUsersActivities(): void {
    const seeds = [
      {
        email: 'ana@readva.com',
        name: 'Ana Lima',
        avatar: 'https://i.pravatar.cc/32?u=ana',
        activities: [
          {
            bookTitle: 'O Senhor dos Anéis',
            bookAuthor: 'J.R.R. Tolkien',
            detail: 'Leu mais 42 páginas',
            comment: 'A Sociedade do Anel é incrível.',
            timestamp: '2h atrás',
          },
          {
            bookTitle: 'Sapiens',
            bookAuthor: 'Yuval Noah Harari',
            detail: 'Leu mais 80 páginas',
            comment: 'Muda muito a perspectiva sobre história.',
            timestamp: 'ontem',
          },
        ],
      },
      {
        email: 'pedro@readva.com',
        name: 'Pedro Souza',
        avatar: 'https://i.pravatar.cc/32?u=pedro',
        activities: [
          {
            bookTitle: '1984',
            bookAuthor: 'George Orwell',
            detail: 'Leu mais 60 páginas',
            comment: 'Assustadoramente atual.',
            timestamp: '4h atrás',
          },
        ],
      },
      {
        email: 'julia@readva.com',
        name: 'Julia Ferreira',
        avatar: 'https://i.pravatar.cc/32?u=julia',
        activities: [
          {
            bookTitle: 'Duna',
            bookAuthor: 'Frank Herbert',
            detail: 'Leu mais 100 páginas',
            comment: 'Worldbuilding impressionante.',
            timestamp: '1h atrás',
          },
          {
            bookTitle: 'A Revolução dos Bichos',
            bookAuthor: 'George Orwell',
            detail: 'Leu mais 30 páginas',
            comment: null,
            timestamp: '3 dias atrás',
          },
        ],
      },
      {
        email: 'marcos@readva.com',
        name: 'Marcos Costa',
        avatar: 'https://i.pravatar.cc/32?u=marcos',
        activities: [
          {
            bookTitle: 'Clean Code',
            bookAuthor: 'Robert C. Martin',
            detail: 'Leu mais 25 páginas',
            comment: 'Leitura obrigatória pra dev.',
            timestamp: '6h atrás',
          },
        ],
      },
    ];

    seeds.forEach(({ email, name, avatar, activities }) => {
      const key = `@readva:activities:${email}`;
      if (localStorage.getItem(key)) return;
      const seeded = activities.map((a, i) => ({
        id: `${email}-seed-${i}`,
        userId: email,
        userName: name,
        userAvatar: avatar,
        bookTitle: a.bookTitle,
        bookAuthor: a.bookAuthor,
        detail: a.detail,
        comment: a.comment,
        timestamp: a.timestamp,
        likes: Math.floor(Math.random() * 12) + 1,
        hasLiked: false,
        isOwner: false,
      }));
      localStorage.setItem(key, JSON.stringify(seeded));
    });
  }
}
