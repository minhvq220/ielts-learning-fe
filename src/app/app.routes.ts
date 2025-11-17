import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  // { path: 'reading', loadComponent: () => import('./pages/reading/reading.component').then(m => m.ReadingComponent) },
  // { path: 'listening', loadComponent: () => import('./pages/listening/listening.component').then(m => m.ListeningComponent) },
  { path: 'writing', loadComponent: () => import('./pages/writing/writing.component').then(m => m.WritingComponent) },
  { path: 'writing/history', loadComponent: () => import('./components/writing-history/writing-history.component').then(m => m.WritingHistoryComponent) },
  { path: 'writing/history/:id', loadComponent: () => import('./components/writing-history-detail/writing-history-detail.component').then(m => m.WritingHistoryDetailComponent) },
  // { path: 'speaking', loadComponent: () => import('./pages/speaking/speaking.component').then(m => m.SpeakingComponent) },
  { path: 'admin/test', loadComponent: () => import('./pages/admin/admin-test.component').then(m => m.AdminTestComponent) },
  { path: 'admin/writing', loadComponent: () => import('./pages/admin/writing-admin.component').then(m => m.WritingAdminComponent) },
  { path: '**', redirectTo: '/home' }
];
