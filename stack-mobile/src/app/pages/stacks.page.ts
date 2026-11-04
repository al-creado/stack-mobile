import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WarehouseStore } from '../core/warehouse.store';
import { DeviceService } from '../core/device.service';
import { Topbar } from '../shared/topbar';
import { Icon } from '../shared/icon';

type Filter = 'all' | 'placed' | 'unplaced';

@Component({
  selector: 'app-stacks',
  imports: [Topbar, Icon, RouterLink, DecimalPipe, FormsModule],
  template: `
    <app-topbar title="Stacks" />
    <main class="page">
      <div class="page-head">
        <div class="titles">
          <h1>Stacks</h1>
          <p>Every stack in {{ whLabel() }}, across all chambers.</p>
        </div>
      </div>

      <section class="summary" aria-label="Totals for this list">
        <div><div class="k">Stacks</div><div class="v">{{ list().length }}</div></div>
        <div><div class="k">Bags</div><div class="v">{{ sum().bags | number }}</div></div>
        <div><div class="k">Net weight</div><div class="v">{{ sum().wt | number: '1.0-2' }}<small>MT</small></div></div>
        <div><div class="k">Not placed</div><div class="v">{{ store.totals().unplaced }}</div></div>
      </section>

      <div class="tabs" role="tablist">
        <button [class.on]="filter() === 'all'" (click)="filter.set('all')">All <span class="count">{{ store.stacks().length }}</span></button>
        <button [class.on]="filter() === 'placed'" (click)="filter.set('placed')">Placed <span class="count">{{ store.stacks().length - store.totals().unplaced }}</span></button>
        <button [class.on]="filter() === 'unplaced'" (click)="filter.set('unplaced')">Not placed <span class="count">{{ store.totals().unplaced }}</span></button>
      </div>

      <section class="panel">
        <div class="panel-head">
          <label class="search" style="flex:1">
            <app-icon name="search" [size]="18" />
            <input type="search" placeholder="Search stack, chamber or WRS no." [ngModel]="q()" (ngModelChange)="q.set($event)" />
          </label>
        </div>
        @if (store.loading()) {
          @for (i of [1, 2, 3, 4]; track i) { <div class="skeleton"><i></i><i></i></div> }
        } @else {
          <ul class="rows table" style="--cols: 1.4fr 1.4fr 1fr 1fr 0.8fr 1fr 20px">
            <li class="rows-head"><span>Stack</span><span>Chamber</span><span>Bags</span><span>Net weight</span><span>WRS</span><span>Position</span><span></span></li>
            @for (s of list(); track s.id) {
              <li>
                <a class="row-link" [routerLink]="['/chambers', s.chamberId, 'stacks', s.id]">
                  <div class="row-main">
                    <div class="row-title"><app-icon name="bag" [size]="18" class="phone-only" style="color:var(--jute-deep)" />{{ s.stackName }}</div>
                    <div class="row-meta">
                      <span><span class="lbl">In </span><b>{{ s.chamberName || 'Chamber ' + s.chamberId }}</b></span>
                      <span class="num"><b>{{ s.totalBags | number }}</b><span class="lbl"> bags</span></span>
                      <span class="num"><b>{{ s.totalNetWeight | number: '1.0-3' }}</b> MT</span>
                      <span class="num"><b>{{ s.wrsAllocations?.length ?? 0 }}</b><span class="lbl"> WRS</span></span>
                      <span>
                        @if (s.isPositioned) { <span class="badge ok">Row {{ s.positionRow }}, col {{ s.positionCol }}</span> }
                        @else { <span class="badge warn">Not placed</span> }
                      </span>
                    </div>
                  </div>
                  <span class="row-end"><app-icon name="next" [size]="18" /></span>
                </a>
              </li>
            } @empty {
              <li class="empty">
                <app-icon name="stack" [size]="36" />
                <h3>No stacks to show</h3>
                <p>{{ q() || filter() !== 'all' ? 'Clear the search or filter to see more.' : 'Open a chamber and add stacks to it.' }}</p>
              </li>
            }
          </ul>
        }
      </section>
    </main>
  `,
})
export class StacksPage {
  protected store = inject(WarehouseStore);
  private wh = inject(DeviceService).currentWarehouse;
  protected whLabel = computed(() => { const w = this.wh(); return w?.name ? `${w.name} (ID ${w.id})` : `warehouse ${w?.id ?? ''}`; });
  protected q = signal('');
  protected filter = signal<Filter>('all');

  protected list = computed(() => {
    const q = this.q().trim().toLowerCase();
    const f = this.filter();
    return this.store.stacks().filter((s) => {
      if (f === 'placed' && !s.isPositioned) return false;
      if (f === 'unplaced' && s.isPositioned) return false;
      if (!q) return true;
      const hay = `${s.stackName} ${s.chamberName} ${(s.wrsAllocations ?? []).map((w) => w.wrsNo).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  });
  protected sum = computed(() => this.list().reduce((t, s) => ({ bags: t.bags + (s.totalBags || 0), wt: t.wt + (s.totalNetWeight || 0) }), { bags: 0, wt: 0 }));
}
