import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ContactInfoService, ContactInfo } from '../../services/contact-info.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header" [class.hidden]="!isHeaderVisible()">
      <div class="header-content">
        <!-- Hamburger Menu Button (Left) -->
        <button class="hamburger-btn" (click)="toggleMenu($event)" [class.active]="isMenuOpen()" title="Menu">
          <span class="hamburger-icon">≡</span>
        </button>

        <!-- Logo/Title (Center) -->
        <div class="logo">
          <a (click)="reloadWritingPage($event)" class="logo-link" routerLink="/writing">
            <h1>EssayRater</h1>
          </a>
        </div>

        <!-- User Actions (Right) -->
        <div class="user-actions">
          <!-- Admin link - only visible to admins -->
          <div *ngIf="authService.isAdmin()">
            <a routerLink="/admin/writing" class="btn btn-admin">Admin</a>
          </div>
          <div *ngIf="!authService.isAuthenticated()" class="auth-buttons">
            <button class="btn btn-login" (click)="goToLogin()">Đăng nhập</button>
          </div>
          <div *ngIf="authService.isAuthenticated()" class="user-info">
            <span class="user-name">{{ authService.getAuthState().user?.name }}</span>
            <button class="btn btn-logout" (click)="logout()">Đăng xuất</button>
          </div>
        </div>
      </div>

      <!-- Dropdown Menu -->
      <div class="dropdown-menu" [class.open]="isMenuOpen()" (click)="$event.stopPropagation()">
        <div class="menu-content">
          <!-- IELTS Writing Task 1 -->
          <a class="menu-item" (click)="navigateToWritingWithFilter('task1')">
            <span class="menu-icon">✎</span>
            <span>IELTS Writing Task 1</span>
          </a>

          <!-- IELTS Writing Task 2 -->
          <a class="menu-item" (click)="navigateToWritingWithFilter('task2')">
            <span class="menu-icon">✎</span>
            <span>IELTS Writing Task 2</span>
          </a>

          <!-- Mock test -->
          <a class="menu-item" routerLink="/writing/mock-test" (click)="closeMenu()">
            <span class="menu-icon">☰</span>
            <span>Mock test (Thi thử)</span>
          </a>

          <!-- Hỗ trợ (with submenu) -->
          <div class="menu-item menu-item-with-submenu" (click)="toggleSubmenu('support')">
            <span class="menu-icon">●</span>
            <span>Hỗ trợ</span>
            <span class="submenu-arrow" [class.open]="isSubmenuOpen('support')">▼</span>
          </div>
          <div class="submenu" [class.open]="isSubmenuOpen('support')">
            <a class="submenu-item" routerLink="/faq" (click)="closeMenu()">Câu hỏi thường gặp</a>
            <a class="submenu-item" routerLink="/guide" (click)="closeMenu()">Hướng dẫn sử dụng</a>
            <div class="submenu-section">
              <div class="submenu-title">Liên hệ hỗ trợ</div>
              <a *ngIf="contactInfo()?.email" 
                 class="submenu-item contact-item" 
                 [href]="'mailto:' + contactInfo()!.email" 
                 target="_blank"
                 (click)="closeMenu()">
                <span class="contact-icon">@</span>
                <span>{{ contactInfo()!.email }}</span>
              </a>
              <a *ngIf="contactInfo()?.facebookUrl" 
                 class="submenu-item contact-item" 
                 [href]="contactInfo()!.facebookUrl" 
                 target="_blank"
                 (click)="closeMenu()">
                <span class="contact-icon">f</span>
                <span>Facebook</span>
              </a>
              <a *ngIf="contactInfo()?.instagramUrl" 
                 class="submenu-item contact-item" 
                 [href]="contactInfo()!.instagramUrl" 
                 target="_blank"
                 (click)="closeMenu()">
                <span class="contact-icon">i</span>
                <span>Instagram</span>
              </a>
              <a *ngIf="contactInfo()?.telegramUrl" 
                 class="submenu-item contact-item" 
                 [href]="contactInfo()!.telegramUrl" 
                 target="_blank"
                 (click)="closeMenu()">
                <span class="contact-icon">t</span>
                <span>Telegram</span>
              </a>
              <div *ngIf="!hasContactInfo()" class="submenu-item no-contact">
                Chưa có thông tin liên hệ
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Overlay to close menu when clicking outside -->
      <div class="menu-overlay" [class.open]="isMenuOpen()" (click)="closeMenu()"></div>
    </header>
  `,
  styles: [`
    .header {
      background: linear-gradient(135deg, #0d9488 0%, #0891b2 50%, #7c3aed 100%);
      color: #fff;
      padding: 0;
      box-shadow: 0 2px 12px rgba(13, 148, 136, 0.25);
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      transition: transform 0.3s ease-in-out;
      transform: translateY(0);
    }

    .header.hidden {
      transform: translateY(-100%);
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 2rem;
      max-width: 1600px;
      margin: 0 auto;
      height: 70px;
    }

    /* Hamburger Button */
    .hamburger-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 0;
      color: white;
      cursor: pointer;
      padding: 0.75rem 1rem;
      font-size: 1.5rem;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 50px;
      height: 50px;
    }

    .hamburger-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.5);
      transform: scale(1.05);
    }

    .hamburger-btn.active {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.6);
    }

    .hamburger-icon {
      font-weight: bold;
      line-height: 1;
    }

    /* Logo */
    .logo {
      flex: 1;
      display: flex;
      justify-content: center;
    }

    .logo-link {
      text-decoration: none;
      color: white;
      transition: transform 0.3s;
    }

    .logo-link:hover {
      transform: scale(1.05);
    }

    .logo h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: 1px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }

    /* User Actions */
    .user-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .auth-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-name {
      font-size: 1rem;
      color: white;
      font-weight: 500;
    }

    .btn {
      padding: 0.6rem 1.25rem;
      border: none;
      border-radius: 0;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s, color 0.2s;
      font-size: 0.9rem;
      text-decoration: none;
      display: inline-block;
    }

    .btn-login {
      background: #fff;
      color: #0d9488;
    }

    .btn-login:hover {
      background: #f1f5f9;
      color: #0d9488;
    }

    .btn-logout {
      background: transparent;
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.4);
    }

    .btn-logout:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.6);
    }

    .btn-admin {
      background: #075985;
      color: #fff;
    }

    .btn-admin:hover {
      background: #475569;
      color: #fff;
    }

    /* Dropdown Menu */
    .dropdown-menu {
      position: fixed;
      top: 70px;
      left: 0;
      width: 320px;
      background: #fff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-radius: 0;
      max-height: calc(100vh - 70px);
      overflow-y: auto;
      transform: translateX(-100%);
      transition: transform 0.3s ease-in-out;
      z-index: 1001;
      opacity: 0;
      pointer-events: none;
    }

    .dropdown-menu.open {
      transform: translateX(0);
      opacity: 1;
      pointer-events: auto;
    }

    .menu-content {
      padding: 1rem 0;
    }

    .menu-item {
      display: flex;
      align-items: center;
      padding: 1rem 1.5rem;
      color: #333;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      border-left: 3px solid transparent;
    }

    .menu-item:hover {
      background: #f1f5f9;
      border-left-color: #0d9488;
      padding-left: 2rem;
    }

    .menu-item-with-submenu {
      justify-content: space-between;
    }

    .menu-icon {
      margin-right: 1rem;
      font-size: 1rem;
      width: 20px;
      text-align: center;
      opacity: 0.9;
      font-weight: 400;
    }

    .submenu-arrow {
      transition: transform 0.3s;
      font-size: 0.8rem;
      color: #666;
    }

    .submenu-arrow.open {
      transform: rotate(180deg);
    }

    .submenu {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-in-out;
      background: #f8fafc;
    }

    .submenu.open {
      max-height: 1000px;
    }

    .submenu-section {
      padding: 0.5rem 0;
    }

    .submenu-title {
      padding: 0.75rem 1.5rem 0.5rem 3.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .submenu-item {
      display: block;
      padding: 0.75rem 1.5rem 0.75rem 3.5rem;
      color: #555;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      font-size: 0.95rem;
    }

    .submenu-item:hover {
      background: #e2e8f0;
      padding-left: 4rem;
      color: #0d9488;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .contact-icon {
      font-size: 0.85rem;
      width: 18px;
      text-align: center;
      opacity: 0.85;
      font-weight: 500;
    }

    .no-contact {
      color: #94a3b8;
      font-style: italic;
      cursor: default;
    }

    .no-contact:hover {
      background: transparent;
      padding-left: 3.5rem;
      color: #94a3b8;
    }

    /* Menu Overlay */
    .menu-overlay {
      position: fixed;
      top: 70px;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s, visibility 0.3s;
      z-index: 1000;
      pointer-events: none;
    }

    .menu-overlay.open {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }

    @media (max-width: 768px) {
      .header-content {
        padding: 0.75rem 1rem;
        height: 60px;
      }

      .logo h1 {
        font-size: 1.5rem;
      }

      .btn {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
      }

      .user-name {
        font-size: 0.9rem;
      }

      .dropdown-menu {
        top: 60px;
        width: 280px;
      }
    }
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  isHeaderVisible = signal(true);
  isMenuOpen = signal(false);
  openSubmenus = signal<Set<string>>(new Set());
  contactInfo = signal<ContactInfo | null>(null);
  private lastScrollTop = 0;
  private scrollHandler: (() => void) | null = null;

  constructor(
    public authService: AuthService,
    private router: Router,
    private contactInfoService: ContactInfoService
  ) {}

  ngOnInit(): void {
    // Initialize header visibility
    this.handleHeaderVisibility();
    
    // Load contact info
    this.loadContactInfo();
    
    // Setup scroll listener
    let scrollUpdateFrame: number | null = null;
    this.scrollHandler = () => {
      if (scrollUpdateFrame) {
        cancelAnimationFrame(scrollUpdateFrame);
      }
      
      scrollUpdateFrame = requestAnimationFrame(() => {
        this.handleHeaderVisibility();
        scrollUpdateFrame = null;
      });
    };

    window.addEventListener('scroll', this.scrollHandler, true);

    // Close menu when clicking outside (but not on menu items)
    document.addEventListener('click', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const menu = document.querySelector('.dropdown-menu');
      const hamburger = document.querySelector('.hamburger-btn');
      
      // Don't close if clicking on menu or hamburger button
      if (menu?.contains(target) || hamburger?.contains(target)) {
        return;
      }
      
      if (this.isMenuOpen()) {
        this.closeMenu();
      }
    });
  }

  ngOnDestroy(): void {
    // Cleanup scroll listener
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler, true);
    }
  }

  private handleHeaderVisibility(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Hide header when scrolling down
    if (scrollTop > this.lastScrollTop && scrollTop > 50) {
      // Scrolling down and past 50px - hide header
      this.isHeaderVisible.set(false);
    } else if (scrollTop <= 50) {
      // Near top - always show header
      this.isHeaderVisible.set(true);
    }
    
    this.lastScrollTop = scrollTop;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  reloadWritingPage(event: Event): void {
    event.preventDefault();
    // Reload the page when clicking "Đề Writing" to reset component state
    if (this.router.url === '/writing') {
      window.location.reload();
    } else {
      window.location.href = '/writing';
    }
  }

  toggleMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isMenuOpen.update(open => !open);
    if (!this.isMenuOpen()) {
      this.openSubmenus.set(new Set());
    }
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
    this.openSubmenus.set(new Set());
  }

  toggleSubmenu(submenuName: string): void {
    event?.stopPropagation();
    const current = this.openSubmenus();
    const newSet = new Set(current);
    if (newSet.has(submenuName)) {
      newSet.delete(submenuName);
    } else {
      newSet.add(submenuName);
    }
    this.openSubmenus.set(newSet);
  }

  isSubmenuOpen(submenuName: string): boolean {
    return this.openSubmenus().has(submenuName);
  }

  navigateToWritingWithFilter(taskType: 'task1' | 'task2'): void {
    this.closeMenu();
    this.router.navigate(['/writing'], { 
      queryParams: { type: taskType },
      queryParamsHandling: 'merge'
    });
  }

  loadContactInfo(): void {
    this.contactInfoService.getContactInfo().subscribe({
      next: (info) => {
        this.contactInfo.set(info);
      },
      error: (error) => {
        console.error('Error loading contact info:', error);
        // Don't show error to user, just log it
      }
    });
  }

  hasContactInfo(): boolean {
    const info = this.contactInfo();
    return !!(info?.email || info?.facebookUrl || info?.instagramUrl || info?.telegramUrl);
  }
}
