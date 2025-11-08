import { Injectable, signal } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private _isLoading = signal(false);
  private _progress = signal(0);
  private _message = signal('Đang tải...');

  constructor(private router: Router) {
    this.setupRouterLoading();
  }

  private setupRouterLoading(): void {
    this.router.events
      .pipe(
        filter(event => 
          event instanceof NavigationStart ||
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        )
      )
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          this.startLoading();
        } else {
          this.stopLoading();
        }
      });
  }

  get isLoading() {
    return this._isLoading.asReadonly();
  }

  get progress() {
    return this._progress.asReadonly();
  }

  get message() {
    return this._message.asReadonly();
  }

  startLoading(message: string = 'Đang tải...'): void {
    this._isLoading.set(true);
    this._message.set(message);
    this._progress.set(0);
    
    // Simulate progress
    this.simulateProgress();
  }

  stopLoading(): void {
    this._isLoading.set(false);
    this._progress.set(100);
  }

  setProgress(value: number): void {
    this._progress.set(Math.min(100, Math.max(0, value)));
  }

  setMessage(message: string): void {
    this._message.set(message);
  }

  private simulateProgress(): void {
    let progress = 0;
    const interval = setInterval(() => {
      if (!this._isLoading()) {
        clearInterval(interval);
        return;
      }
      
      progress += Math.random() * 15;
      if (progress >= 90) {
        progress = 90; // Don't complete until actually loaded
      }
      this._progress.set(progress);
    }, 200);
  }
}
