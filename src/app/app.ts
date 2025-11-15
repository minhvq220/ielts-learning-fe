import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { LoadingService } from './services/loading.service';
import { TranslateSelectionDirective } from './directives/translate-selection.directive';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, HeaderComponent, SidebarComponent, TranslateSelectionDirective],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('YouPassCopy');

  constructor(public loadingService: LoadingService) {}

  ngOnInit(): void {
    // Initial loading
    this.loadingService.startLoading('Đang khởi tạo ứng dụng...');
    
    // Hide loading after initial load
    setTimeout(() => {
      this.loadingService.stopLoading();
    }, 1500);
  }
}
