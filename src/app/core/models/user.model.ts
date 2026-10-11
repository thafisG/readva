import type { AvatarConfig } from './avatar.model';

export interface UserSession {
  id?: string;
  email: string;
  name: string;
  avatar: string;
  avatarConfig?: AvatarConfig | null;
  bio?: string;
}

export type PublicUser = UserSession;
