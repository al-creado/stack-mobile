import { Component, OnInit, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { MonitoringStore } from '../core/monitoring.store';
import { Icon } from '../shared/icon';
import { Topbar } from '../shared/topbar';

/** Shown right after a stack is submitted: "Stack matched" or "Stack not matched". */
@Component({
  selector: 'app-stack-result',
  imports: [Topbar, Icon],
  template: `
    <app-topbar title="Stack result" [showWarehouse]="false" />
    <main class="page has-actionbar" style="max-width: 560px">
      @if (result(); as r) {
        <section class="panel">
          <div class="result">
            <span class="result-badge" [class.ok]="r.matched"><app-icon [name]="r.matched ? 'check' : 'alert'" [size]="44" /></span>
            @if (r.matched) {
              <h2>Stack matched</h2>
              <p>Your count matches the warehouse record.</p>
              <small class="muted">{{ name() }} has been saved and matched.</small>
            } @else {
              <h2>Stack not matched</h2>
              <p>Your stack has not matched. Please talk to your senior.</p>
              <small class="muted">{{ name() }} has been saved, but it could not be matched.</small>
            }
          </div>
        </section>
        <div class="actionbar">
          <button class="btn primary" (click)="next()">Continue</button>
        </div>
      }
    </main>
  `,
})
export class StackResultPage implements OnInit {
  stackId = input.required<string>();
  private mon = inject(MonitoringStore);
  private router = inject(Router);

  protected result = computed(() => this.mon.results()[+this.stackId()]);
  protected name = computed(() => this.mon.stackById(+this.stackId())?.stackName ?? 'Stack');

  ngOnInit() { if (!this.result()) this.router.navigate(['/monitoring'], { replaceUrl: true }); }
  protected next() { this.router.navigate(['/monitoring'], { replaceUrl: true }); }
}
