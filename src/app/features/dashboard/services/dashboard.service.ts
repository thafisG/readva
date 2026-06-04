import { Injectable, signal } from '@angular/core';
import {
  UserProgress,
  Book,
  Activity,
  WeeklyStat,
  BookSuggestion,
} from '../interfaces/dashboard.interface';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  public userProgress = signal<UserProgress>({
    name: 'Alexandre Silva',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    currentStreak: 14,
    dailyGoalMinutes: 60,
    dailyMinutesRead: 45,
  });

  public currentBook = signal<Book>({
    id: '1',
    title: 'Foco Absoluto',
    author: 'Stefan Zweig',
    coverUrl:
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=300&q=80',
    totalPages: 320,
    currentPage: 208,
    category: 'Produtividade',
  });

  public activities = signal<Activity[]>([
    {
      id: 'act-1',
      userName: 'Marcos Vinícius',
      userAvatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
      actionType: 'progress',
      bookTitle: 'Cangaceiro JavaScript',
      bookAuthor: 'Flávio Almeida',
      detail: 'leu 42 páginas hoje',
      timestamp: 'Há 12 min',
      likes: 8,
      commentsCount: 2,
      hasLiked: false,
    },
    {
      id: 'act-2',
      userName: 'Beatriz Ramos',
      userAvatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
      actionType: 'finished',
      bookTitle: 'Hábitos Atômicos',
      bookAuthor: 'James Clear',
      detail: 'concluiu a leitura! ⭐⭐⭐⭐⭐',
      timestamp: 'Há 2 horas',
      likes: 24,
      commentsCount: 7,
      hasLiked: true,
    },
  ]);

  public weeklyStats = signal<WeeklyStat[]>([
    { day: 'Seg', minutes: 40 },
    { day: 'Ter', minutes: 65 },
    { day: 'Qua', minutes: 20 },
    { day: 'Qui', minutes: 45 },
    { day: 'Sex', minutes: 0 },
    { day: 'Sáb', minutes: 90 },
    { day: 'Dom', minutes: 50 },
  ]);

  public suggestions = signal<BookSuggestion[]>([
    {
      id: 'sug-1',
      title: 'Essencialismo',
      author: 'Greg McKeown',
      coverUrl:
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=80',
      matchPercentage: 98,
    },
    {
      id: 'sug-2',
      title: 'Rápido e Devagar',
      author: 'Daniel Kahneman',
      coverUrl:
        'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=300&q=80',
      matchPercentage: 92,
    },
  ]);

  toggleLike(activityId: string) {
    this.activities.update((items) =>
      items.map((item) => {
        if (item.id === activityId) {
          return {
            ...item,
            hasLiked: !item.hasLiked,
            likes: item.hasLiked ? item.likes - 1 : item.likes + 1,
          };
        }
        return item;
      }),
    );
  }
}
