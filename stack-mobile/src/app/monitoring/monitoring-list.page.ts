import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { StackResponseDto } from '../core/api.models';
import { MonitoringStore, StackStatus } from '../core/monitoring.store';
import { WarehouseStore } from '../core/warehouse.store';
import { Icon } from '../shared/icon';
import { MonFrame } from './mon-frame';
import { StackDetailsSheet } from './stack-details.sheet';

const STATUS_LABEL: Record<StackStatus, string> = {
  not_started: 'Not started', in_progress: 'In progress', matched: 'Matched', not_matched: 'Not matched',
};

/** Screen 1: every chamber and stack to monitor. Tap a stack to open its details sheet. */
@Component({
  selector: 'app-monitoring-list',
  imports: [MonFrame, Icon, StackDetailsSheet],
  template: `
    <app-mon-frame title="Stock monitoring" subtitle="Count and photograph each stack" backLink="/overview">
      <section class="mon-card mon-stats">
        <div><span>Chambers</span><b>{{ mon.summary().chambers }}</b></div>
        <div class="mid"><span>Stacks</span><b>{{ mon.summary().stacks }}</b></div>
        <div class="end"><span>Done</span><b>{{ mon.summary().done }}</b></div>
      </section>

      @if (mon.loading()) {
        <section class="mon-card"><p class="mon-note dark">Loading chambers and stacks…</p></section>
      } @else if (mon.failed()) {
        <section class="mon-card">
          <p class="mon-note dark">Couldn't load this warehouse's stacks.</p>
          <button class="mon-btn small" (click)="wh.reload()">Try again</button>
        </section>
      } @else {
        @for (g of mon.groups(); track g.chamber.id) {
          <section class="mon-card">
            <div class="mon-chamber">
              <h2>{{ g.chamber.chamberName || 'Chamber ' + g.chamber.chamberNo }}</h2>
              <span>Stacks ({{ g.stacks.length - g.done }}/{{ g.stacks.length }})</span>
            </div>
            @for (s of g.stacks; track s.id) {
              <button class="mon-stack" [disabled]="isLocked(s)" (click)="open(s)">
                <span class="mon-stack-icon"><app-icon name="layers" [size]="24" /></span>
                <span class="mon-stack-text"><b>{{ s.stackName }}</b><small>Bags, photos and position</small></span>
                <span class="mon-status" [class]="'mon-status ' + mon.statusOf(s.id)">{{ label(mon.statusOf(s.id)) }}</span>
              </button>
            }
          </section>
        } @empty {
          <section class="mon-card"><p class="mon-note dark">No stacks to monitor in this warehouse yet.</p></section>
        }
      }

      <p class="mon-note">Open a stack, enter blocks, take 7 photos and submit it. When all stacks are done, submit stock monitoring.</p>

      <div class="mon-foot">
        <button class="mon-btn" (click)="review()">Review and submit</button>
      </div>
    </app-mon-frame>

    @if (selected(); as s) {
      <app-stack-details-sheet [stack]="s" (closed)="selected.set(null)" (saved)="toPhotos(s)" />
    }
  `,
})
export class MonitoringListPage {
  protected mon = inject(MonitoringStore);
  protected wh = inject(WarehouseStore);
  private router = inject(Router);
  protected selected = signal<StackResponseDto | null>(null);

  protected label(s: StackStatus) { return STATUS_LABEL[s]; }
  /** A submitted stack is final; a senior handles mismatches. */
  protected isLocked(s: StackResponseDto) { const st = this.mon.statusOf(s.id); return st === 'matched' || st === 'not_matched'; }
  protected open(s: StackResponseDto) { this.selected.set(s); }
  protected toPhotos(s: StackResponseDto) { this.selected.set(null); this.router.navigate(['/monitoring/stack', s.id, 'photos']); }
  protected review() { this.router.navigate(['/monitoring/review']); }
}
