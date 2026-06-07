import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

export interface UserSession {
  email: string;
  name: string;
  avatar: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);
  private currentUserSignal = signal<UserSession | null>(null);

  public currentUser = computed(() => this.currentUserSignal());
  public isLoggedIn = computed(() => this.currentUserSignal() !== null);

  constructor() {
    const savedUser = localStorage.getItem('@readva:active_session');
    if (savedUser) {
      this.currentUserSignal.set(JSON.parse(savedUser));
    }
  }

  authenticate(email: string, name: string): boolean {
    if (!email.trim() || !name.trim()) return false;

    const cleanedEmail = email.trim().toLowerCase();

    const usersList = JSON.parse(localStorage.getItem('@readva:users_db') || '[]');

    let user = usersList.find((u: any) => u.email === cleanedEmail);

    if (!user) {
      user = {
        email: cleanedEmail,
        name: name.trim(),
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=111827,6b7280`,
      };
      usersList.push(user);
      localStorage.setItem('@readva:users_db', JSON.stringify(usersList));
    }

    localStorage.setItem('@readva:active_session', JSON.stringify(user));
    this.currentUserSignal.set(user);

    this.router.navigate(['/']);
    return true;
  }

  logout() {
    localStorage.removeItem('@readva:active_session');
    this.currentUserSignal.set(null);
    this.router.navigate(['/']);
  }
}
