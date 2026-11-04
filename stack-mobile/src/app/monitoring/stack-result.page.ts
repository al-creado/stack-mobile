import { Component, OnInit, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { MonitoringStore } from '../core/monitoring.store';
import { Icon } from '../shared/icon';

/** Screen 5: shown right after a stack is submitted: "Stack not matched" (red) or "Stack matched" (green). */
@Component({
  selector: 'app-stack-result',
  imports: [Icon],
  template: `
    @if (result(); as r) {
      <div class="mon-result" [class.ok]="r.matched">
        <div class="mon-result-body">
          <span class="mon-result-badge"><app-icon [name]="r.matched ? 'check' : 'alert'" [size]="76" /></span>
          @if (r.matched) {
            <h1>Stack matched</h1>
            <p>Your stack matches the warehouse record.</p>
            <small>{{ name() }} has been saved and matched.</small>
          } @else {
            <h1>Stack not matched</h1>
            <p>Your stack has not matched. Please talk to your senior.</p>
            <small>{{ name() }} has been saved, but it could not be matched.</small>
          }
        </div>
        <div class="mon-result-foot"><button class="mon-btn" (click)="next()">Continue</button></div>
      </div>
    }
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
