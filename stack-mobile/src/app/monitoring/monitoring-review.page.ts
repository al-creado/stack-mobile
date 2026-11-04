import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MonitoringStore } from '../core/monitoring.store';
import { UiService } from '../core/ui.service';
import { Icon } from '../shared/icon';
import { MonFrame } from './mon-frame';

/** Screen 6: totals and per-chamber progress, then the final "Submit stock monitoring". */
@Component({
  selector: 'app-monitoring-review',
  imports: [MonFrame, Icon, DecimalPipe],
  template: `
    <app-mon-frame title="Review and submit" subtitle="Stock monitoring" backLink="/monitoring">
      <section class="mon-card mon-review-stats">
        <div><span>Chambers</span><b>{{ sum().chambers }}</b></div>
        <div><span>Total stacks</span><b>{{ sum().stacks }}</b></div>
        <div><span>Completed</span><b>{{ sum().done }}</b></div>
        <div><span>Total bags</span><b class="num">{{ sum().bags | number }}</b></div>
        <div class="wide"><span>Total weight</span><b class="num">{{ sum().weight | number: '1.2-2' }} MT</b></div>
      </section>

      <h3 class="mon-section">Chambers</h3>
      @for (g of mon.groups(); track g.chamber.id) {
        <section class="mon-card mon-review-row">
          <span class="mon-check" [class.on]="g.done === g.stacks.length"><app-icon name="check" [size]="22" /></span>
          <span class="mon-review-text">
            <b>{{ g.chamber.chamberName || 'Chamber ' + g.chamber.chamberNo }}</b>
            <small>{{ g.done }} / {{ g.stacks.length }} stacks completed</small>
          </span>
          @if (g.notMatched) { <span class="mon-status warn">{{ g.notMatched }} not matched</span> }
        </section>
      }

      @if (!allDone()) { <p class="mon-note">Finish every stack before submitting stock monitoring.</p> }

      <div class="mon-foot">
        <button class="mon-btn" [disabled]="!allDone()" (click)="submit()">Submit stock monitoring</button>
      </div>
    </app-mon-frame>
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
