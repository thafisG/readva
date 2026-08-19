export type ActivityType = 'progress' | 'finished' | 'started';

export interface ReadingActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  actionType: ActivityType;
  bookTitle: string;
  bookAuthor: string;
  bookId: string;
  bookCategory?: string;
  category?: string;
  detail: string;
  createdAt?: string;
  timestamp: string;
  likes: number;
  commentsCount: number;
  hasLiked: boolean;
  comment?: string;
  minutesRead?: number;
  pagesRead?: number;
  progress?: number;
  totalPages?: number;
  completed?: boolean;
  isOwner?: boolean;
}
