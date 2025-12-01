import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  // { path: 'reading', loadComponent: () => import('./pages/reading/reading.component').then(m => m.ReadingComponent) },
  // { path: 'listening', loadComponent: () => import('./pages/listening/listening.component').then(m => m.ListeningComponent) },
  { path: 'writing', loadComponent: () => import('./pages/writing/writing.component').then(m => m.WritingComponent) },
  { path: 'writing/history', loadComponent: () => import('./components/writing-history/writing-history.component').then(m => m.WritingHistoryComponent), canActivate: [authGuard] },
  { path: 'writing/history/:id', loadComponent: () => import('./components/writing-history-detail/writing-history-detail.component').then(m => m.WritingHistoryDetailComponent) },
  // { path: 'speaking', loadComponent: () => import('./pages/speaking/speaking.component').then(m => m.SpeakingComponent) },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: 'admin/test', loadComponent: () => import('./pages/admin/admin-test.component').then(m => m.AdminTestComponent), canActivate: [adminGuard] },
  { path: 'admin/writing', loadComponent: () => import('./pages/admin/writing-admin.component').then(m => m.WritingAdminComponent), canActivate: [adminGuard] },
  { path: 'admin/writing-self-check', loadComponent: () => import('./pages/admin/admin-self-check-list.component').then(m => m.AdminSelfCheckListComponent), canActivate: [adminGuard] },
  { path: 'admin/writing-self-check/history/:id', loadComponent: () => import('./pages/writing-self-check/writing-self-check-history-detail.component').then(m => m.WritingSelfCheckHistoryDetailComponent), canActivate: [adminGuard] },
  { path: 'writing/self-check', loadComponent: () => import('./pages/writing-self-check/writing-self-check.component').then(m => m.WritingSelfCheckComponent) },
  { path: 'writing-self-check/history', loadComponent: () => import('./pages/writing-self-check/writing-self-check-history.component').then(m => m.WritingSelfCheckHistoryComponent), canActivate: [authGuard] },
  { path: 'writing-self-check/history/:id', loadComponent: () => import('./pages/writing-self-check/writing-self-check-history-detail.component').then(m => m.WritingSelfCheckHistoryDetailComponent) },
  { path: '**', redirectTo: '/home' }
];
