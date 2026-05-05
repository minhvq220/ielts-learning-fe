import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, merge, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MarqueeAnnouncementsService,
  MarqueeLinePublic,
} from '../../services/marquee-announcements.service';

const POLL_MS = 90_000;

@Component({
  selector: 'app-announcement-marquee',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (lines().length > 0) {
      <section class="marquee-wrap" role="region" aria-label="Thông báo">
        @for (line of lines(); track $index) {
          <div class="marquee-row">
            <div class="marquee-track" [style.animationDuration.s]="durationSec(line.message)">
              <span class="segment">{{ line.message }}</span>
              <span class="segment">{{ line.message }}</span>
            </div>
          </div>
        }
      </section>
    }
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
      z-index: 2;
      margin-top: 70px;
    }

    .marquee-wrap {
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
    }

    .marquee-row {
      height: 36px;
      overflow: hidden;
      background: linear-gradient(90deg, #0f766e 0%, #0d9488 35%, #7c3aed 100%);
      color: #f8fafc;
      font-size: 0.8125rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      align-items: center;
    }

    .marquee-row:last-child {
      border-bottom: none;
    }

    .marquee-track {
      display: flex;
      flex-wrap: nowrap;
      width: max-content;
      animation: marquee 45s linear infinite;
      will-change: transform;
    }

    .segment {
      flex: 0 0 auto;
      padding: 0 3rem;
      white-space: nowrap;
    }

    .marquee-row:hover .marquee-track {
      animation-play-state: paused;
    }

    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    @media (max-width: 768px) {
      :host {
        margin-top: 60px;
      }
      .marquee-row {
        font-size: 0.75rem;
      }
      .segment {
        padding: 0 2rem;
      }
    }
  `],
})
export class AnnouncementMarqueeComponent implements OnInit {
  private readonly marqueeService = inject(MarqueeAnnouncementsService);
  private readonly destroyRef = inject(DestroyRef);
  readonly lines = signal<MarqueeLinePublic[]>([]);

  ngOnInit(): void {
    merge(of(0), interval(POLL_MS))
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() =>
          this.marqueeService.getActive().pipe(
            catchError(() => of({ lines: [] as MarqueeLinePublic[] }))
          )
        )
      )
      .subscribe((res) => this.lines.set(res.lines ?? []));
  }

  durationSec(message: string): number {
    const len = message?.length ?? 0;
    const base = 35;
    const extra = Math.min(40, Math.floor(len / 12));
    return base + extra;
  }
}
