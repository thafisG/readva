export interface UserProgress {
  name: string;
  avatar: string;
  currentStreak: number;
  dailyGoalMinutes: number;
  dailyMinutesRead: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  totalPages: number;
  currentPage: number;
  category: string;
}

export interface Activity {
  id: string;
  userName: string;
  userAvatar: string;
  actionType: 'progress' | 'finished' | 'started';
  bookTitle: string;
  bookAuthor: string;
  detail: string;
  timestamp: string;
  likes: number;
  commentsCount: number;
  hasLiked: boolean;
}

export interface WeeklyStat {
  day: string;
  minutes: number;
}

export interface BookSuggestion {
  id: number;
  title: string;
  author: string;
  coverUrl: string;
  category?: string;
  matchPercentage?: number;
}
