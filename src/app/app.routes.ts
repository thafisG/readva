import type { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'biblioteca',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/components/minha-biblioteca/library-shelf.component').then(
        (m) => m.LibraryShelfComponent,
      ),
  },
  {
    path: 'desafios',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/components/challenges/challenges.component').then(
        (m) => m.ChallengesComponent,
      ),
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
