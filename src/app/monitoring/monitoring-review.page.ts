import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MonitoringStore } from '../core/monitoring.store';
import { UiService } from '../core/ui.service';
import { Icon } from '../shared/icon';
import { Topbar } from '../shared/topbar';

/** Totals and per-chamber progress, then the final "Submit stock monitoring". */
@Component({
  selector: 'app-monitoring-review',
  imports: [Topbar, Icon, DecimalPipe],
  template: `
    <app-topbar title="Review and submit" [back]="true" [showWarehouse]="false" />
    <main class="page has-actionbar">
      <div class="page-head">
        <div class="titles">
          <h1>Review and submit</h1>
          <p>Stock monitoring</p>
        </div>
      </div>

      <section class="summary" aria-label="Totals">
        <div><div class="k">Chambers</div><div class="v">{{ sum().chambers }}</div></div>
        <div><div class="k">Stacks completed</div><div class="v">{{ sum().done }}<small>of {{ sum().stacks }}</small></div></div>
        <div><div class="k">Total bags</div><div class="v">{{ sum().bags | number }}</div></div>
        <div><div class="k">Total weight</div><div class="v">{{ sum().weight | number: '1.0-2' }}<small>MT</small></div></div>
      </section>

      <section class="panel">
        <div class="panel-head"><h2>Chambers</h2></div>
        <ul class="rows">
          @for (g of mon.groups(); track g.chamber.id) {
            <li>
              <div class="row-link" style="cursor:default">
                <span class="badge plain" [class]="'badge plain ' + (g.done === g.stacks.length ? 'ok' : '')"><app-icon name="check" [size]="14" /></span>
                <div class="row-main">
                  <div class="row-title">{{ g.chamber.chamberName || 'Chamber ' + g.chamber.chamberNo }}</div>
                  <div class="row-meta">{{ g.done }} / {{ g.stacks.length }} stacks completed</div>
                </div>
                @if (g.notMatched) { <span class="badge warn">{{ g.notMatched }} not matched</span> }
              </div>
            </li>
          } @empty {
            <li class="empty"><h3>Nothing to review</h3><p>There are no stacks in this warehouse yet.</p></li>
          }
        </ul>
      </section>

      @if (!allDone()) { <p class="muted" style="text-align:center">Finish every stack before submitting stock monitoring.</p> }

      <div class="actionbar">
        <button class="btn primary" [disabled]="!allDone()" (click)="submit()"><app-icon name="send" [size]="18" />Submit stock monitoring</button>
      </div>
    </main>
  `,
})
export class MonitoringReviewPage {
  protected mon = inject(MonitoringStore);
  private ui = inject(UiService);
  private router = inject(Router);

  protected sum = this.mon.summary;
  protected allDone = computed(() => this.sum().stacks > 0 && this.sum().done === this.sum().stacks);

  /**
   * Every stack was already saved to StackApi when it was submitted, and the API has no separate
   * "close the round" endpoint, so this confirms and starts a clean round.
   */
  protected submit() {
    if (!this.allDone()) return;
    this.mon.reset();
    this.ui.show('Stock monitoring submitted');
    this.router.navigate(['/monitoring'], { replaceUrl: true });
  }
}
