import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FooterComponent } from './components/footer/footer.component';
import { AnnouncementMarqueeComponent } from './components/announcement-marquee/announcement-marquee.component';
import { LoadingService } from './services/loading.service';
import { TranslateSelectionDirective } from './directives/translate-selection.directive';
import { validateConfig } from './config/app.config';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, HeaderComponent, SidebarComponent, FooterComponent, AnnouncementMarqueeComponent, TranslateSelectionDirective],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('EssayRater');
  readonly showMarquee = signal(false);

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor(public loadingService: LoadingService) {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((e) => this.applyRouteUiState(e.urlAfterRedirects));
  }

  ngOnInit(): void {
    validateConfig();
    this.applyRouteUiState(this.router.url);
    this.loadingService.startLoading('Đang khởi tạo ứng dụng...');
    setTimeout(() => this.loadingService.stopLoading(), 1500);
  }

  private applyRouteUiState(fullUrl: string): void {
    const [pathWithQuery] = fullUrl.split('#');
    const q = pathWithQuery.indexOf('?');
    const path = (q >= 0 ? pathWithQuery.slice(0, q) : pathWithQuery) || '/';
    const query = q >= 0 ? pathWithQuery.slice(q + 1) : '';
    const hasTaskId = query ? new URLSearchParams(query).has('taskId') : false;
    this.showMarquee.set(path === '/writing' && !hasTaskId);
  }
}
