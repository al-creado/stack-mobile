import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { StackResponseDto } from '../core/api.models';
import { DeviceService } from '../core/device.service';
import { MonitoringStore, StackStatus } from '../core/monitoring.store';
import { WarehouseStore } from '../core/warehouse.store';
import { Icon } from '../shared/icon';
import { Topbar } from '../shared/topbar';
import { StackDetailsSheet } from './stack-details.sheet';

const STATUS: Record<StackStatus, { label: string; tone: string }> = {
  not_started: { label: 'Not started', tone: '' },
  in_progress: { label: 'In progress', tone: 'info' },
  matched: { label: 'Matched', tone: 'ok' },
  not_matched: { label: 'Not matched', tone: 'warn' },
};

/** Stock monitoring home: every chamber and stack to count. Tap a stack to enter its details. */
@Component({
  selector: 'app-monitoring-list',
  imports: [Topbar, Icon, RouterLink, DecimalPipe, StackDetailsSheet],
  template: `
    <app-topbar title="Stock monitoring" />
    <main class="page has-actionbar">
      <div class="page-head">
        <div class="titles">
          <h1>Stock monitoring</h1>
          <p>Count and photograph each stack in {{ whLabel() }}.</p>
        </div>
      </div>

      <section class="summary" aria-label="Progress">
        <div><div class="k">Chambers</div><div class="v">{{ mon.summary().chambers }}</div></div>
        <div><div class="k">Stacks</div><div class="v">{{ mon.summary().stacks }}</div></div>
        <div><div class="k">Done</div><div class="v">{{ mon.summary().done }}</div></div>
        <div><div class="k">Not matched</div><div class="v">{{ mon.summary().notMatched }}</div></div>
      </section>

      @if (mon.loading()) {
        <section class="panel">
          @for (i of [1, 2, 3]; track i) { <div class="skeleton"><i></i><i></i></div> }
        </section>
      } @else if (mon.failed()) {
        <section class="panel">
          <div class="empty">
            <app-icon name="alert" [size]="36" />
            <h3>Couldn't load this warehouse</h3>
            <p>Check the connection and try again.</p>
            <button class="btn primary" (click)="wh.reload()"><app-icon name="refresh" [size]="18" />Try again</button>
          </div>
        </section>
      } @else {
        @for (g of mon.groups(); track g.chamber.id) {
          <section class="panel">
            <div class="panel-head">
              <h2>{{ g.chamber.chamberName || 'Chamber ' + g.chamber.chamberNo }}
                <span class="muted" style="font-weight:500">No. {{ g.chamber.chamberNo }}</span></h2>
              <span class="hint num">{{ g.done }} of {{ g.stacks.length }} done</span>
              <a class="btn sm ghost" [routerLink]="['/chambers', g.chamber.id]" aria-label="Open chamber layout"><app-icon name="grid" [size]="16" />Layout</a>
            </div>
            <ul class="rows">
              @for (s of g.stacks; track s.id) {
                <li>
                  <button class="row-link" [disabled]="isLocked(s)" (click)="open(s)">
                    <span class="wh-avatar"><app-icon name="stack" [size]="20" /></span>
                    <span class="row-main">
                      <span class="row-title">{{ s.stackName }}</span>
                      <span class="row-meta">
                        @if (s.isPositioned) { <span>Row <b>{{ s.positionRow }}</b>, col <b>{{ s.positionCol }}</b></span> }
                        @else { <span>Not placed</span> }
                        <span><b>{{ s.totalBags | number }}</b> bags on record</span>
                      </span>
                    </span>
                    <span class="badge" [class]="'badge ' + status(s).tone">{{ status(s).label }}</span>
                    @if (!isLocked(s)) { <app-icon name="next" [size]="18" /> }
                  </button>
                </li>
              }
            </ul>
          </section>
        } @empty {
          <section class="panel">
            <div class="empty">
              <app-icon name="stack" [size]="36" />
              <h3>No stacks to monitor</h3>
              <p>Add stacks to a chamber first, then come back to count them.</p>
              <a class="btn primary" routerLink="/chambers">Open chambers</a>
            </div>
          </section>
        }
      }

      <p class="muted" style="text-align:center">Open a stack, enter blocks, take 7 photos and submit it. When all stacks are done, submit stock monitoring.</p>

      <div class="actionbar">
        <button class="btn primary" (click)="review()"><app-icon name="check" [size]="18" />Review and submit</button>
      </div>
    </main>

    @if (selected(); as s) {
      <app-stack-details-sheet [stack]="s" (closed)="selected.set(null)" (saved)="toPhotos(s)" />
    }
  `,
})
export class MonitoringListPage {
  protected mon = inject(MonitoringStore);
  protected wh = inject(WarehouseStore);
  private device = inject(DeviceService);
  private router = inject(Router);
  protected selected = signal<StackResponseDto | null>(null);

  protected whLabel = computed(() => {
    const w = this.device.currentWarehouse();
    return w?.name ? `${w.name} (ID ${w.id})` : `warehouse ${w?.id ?? ''}`;
  });

  protected status(s: StackResponseDto) { return STATUS[this.mon.statusOf(s.id)]; }
  /** A submitted stack is final; a senior handles mismatches. */
  protected isLocked(s: StackResponseDto) { const st = this.mon.statusOf(s.id); return st === 'matched' || st === 'not_matched'; }
  protected open(s: StackResponseDto) { this.selected.set(s); }
  protected toPhotos(s: StackResponseDto) { this.selected.set(null); this.router.navigate(['/monitoring/stack', s.id, 'photos']); }
  protected review() { this.router.navigate(['/monitoring/review']); }
}
