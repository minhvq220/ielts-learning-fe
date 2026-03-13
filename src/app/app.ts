import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FooterComponent } from './components/footer/footer.component';
import { LoadingService } from './services/loading.service';
import { TranslateSelectionDirective } from './directives/translate-selection.directive';
import { validateConfig } from './config/app.config';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, HeaderComponent, SidebarComponent, FooterComponent, TranslateSelectionDirective],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('EssayRater');

  constructor(public loadingService: LoadingService) {}

  ngOnInit(): void {
    validateConfig();
    this.loadingService.startLoading('Đang khởi tạo ứng dụng...');
    setTimeout(() => this.loadingService.stopLoading(), 1500);
  }
}
