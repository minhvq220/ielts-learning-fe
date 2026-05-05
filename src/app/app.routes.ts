import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/writing', pathMatch: 'full' },
  { path: 'home', redirectTo: '/writing', pathMatch: 'full' },
  // { path: 'reading', loadComponent: () => import('./pages/reading/reading.component').then(m => m.ReadingComponent) },
  // { path: 'listening', loadComponent: () => import('./pages/listening/listening.component').then(m => m.ListeningComponent) },
  { path: 'writing', loadComponent: () => import('./pages/writing/writing.component').then(m => m.WritingComponent) },
  { path: 'writing/mock-test', loadComponent: () => import('./pages/writing-mock-test/writing-mock-test-landing.component').then(m => m.WritingMockTestLandingComponent) },
  { path: 'writing/mock-test/start', loadComponent: () => import('./pages/writing-mock-test/writing-mock-test.component').then(m => m.WritingMockTestComponent) },
  { path: 'writing/mock-test/history', loadComponent: () => import('./pages/writing-mock-test/writing-mock-test-history.component').then(m => m.WritingMockTestHistoryComponent) },
  { path: 'writing/history', loadComponent: () => import('./components/writing-history/writing-history.component').then(m => m.WritingHistoryComponent), canActivate: [authGuard] },
  { path: 'writing/history/:id', loadComponent: () => import('./components/writing-history-detail/writing-history-detail.component').then(m => m.WritingHistoryDetailComponent) },
  // { path: 'speaking', loadComponent: () => import('./pages/speaking/speaking.component').then(m => m.SpeakingComponent) },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: 'guide', loadComponent: () => import('./pages/guide/user-guide.component').then(m => m.UserGuideComponent) },
  { path: 'faq', loadComponent: () => import('./pages/faq/faq.component').then(m => m.FaqComponent) },
  { path: 'feedback', loadComponent: () => import('./pages/feedback/feedback.component').then(m => m.FeedbackComponent), canActivate: [authGuard] },
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'writing', pathMatch: 'full' },
      { path: 'writing', loadComponent: () => import('./pages/admin/writing-admin.component').then(m => m.WritingAdminComponent) },
      { path: 'writing-history', loadComponent: () => import('./pages/admin/admin-writing-history.component').then(m => m.AdminWritingHistoryComponent) },
      { path: 'writing-history/:id', loadComponent: () => import('./components/writing-history-detail/writing-history-detail.component').then(m => m.WritingHistoryDetailComponent) },
      { path: 'writing-self-check', loadComponent: () => import('./pages/admin/admin-self-check-list.component').then(m => m.AdminSelfCheckListComponent) },
      { path: 'writing-self-check/history/:id', loadComponent: () => import('./pages/writing-self-check/writing-self-check-history-detail.component').then(m => m.WritingSelfCheckHistoryDetailComponent) },
      { path: 'users', loadComponent: () => import('./pages/admin/admin-users.component').then(m => m.AdminUsersComponent) },
      { path: 'marquee-lines', loadComponent: () => import('./pages/admin/admin-marquee-lines.component').then(m => m.AdminMarqueeLinesComponent) },
      { path: 'contact-info', loadComponent: () => import('./pages/admin/admin-contact-info.component').then(m => m.AdminContactInfoComponent) },
      { path: 'feedback', loadComponent: () => import('./pages/admin/admin-feedback.component').then(m => m.AdminFeedbackComponent) },
    ]
  },
  { path: 'writing/self-check', loadComponent: () => import('./pages/writing-self-check/writing-self-check.component').then(m => m.WritingSelfCheckComponent) },
  { path: 'writing-self-check/history', loadComponent: () => import('./pages/writing-self-check/writing-self-check-history.component').then(m => m.WritingSelfCheckHistoryComponent), canActivate: [authGuard] },
  { path: 'writing-self-check/history/:id', loadComponent: () => import('./pages/writing-self-check/writing-self-check-history-detail.component').then(m => m.WritingSelfCheckHistoryDetailComponent) },
  { path: '**', redirectTo: '/writing' }
];
