export interface UserSession {
  id?: string;
  email: string;
  name: string;
  avatar: string;
}

export type PublicUser = UserSession;
