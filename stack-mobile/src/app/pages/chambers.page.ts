import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WarehouseStore } from '../core/warehouse.store';
import { DeviceService } from '../core/device.service';
import { Topbar } from '../shared/topbar';
import { Icon } from '../shared/icon';
import { MiniPlan, StatusBadge } from '../shared/ui-bits';

@Component({
  selector: 'app-chambers',
  imports: [Topbar, Icon, RouterLink, DecimalPipe, FormsModule, MiniPlan, StatusBadge],
  template: `
    <app-topbar title="Chambers" />
    <main class="page">
      <div class="page-head">
        <div class="titles">
          <h1>Chambers</h1>
          <p>{{ store.chambers().length }} in {{ whLabel() }}</p>
        </div>
        <div class="actions">
          <a class="btn primary desk-only" routerLink="/chambers/new"><app-icon name="plus" [size]="18" />New chamber</a>
        </div>
      </div>

      <section class="panel">
        <div class="panel-head">
          <label class="search" style="flex:1">
            <app-icon name="search" [size]="18" />
            <input type="search" placeholder="Search by name or number" [ngModel]="q()" (ngModelChange)="q.set($event)" />
          </label>
        </div>

        @if (store.loading()) {
          @for (i of [1, 2, 3, 4]; track i) { <div class="skeleton"><i></i><i></i></div> }
        } @else {
          <ul class="rows table" style="--cols: 56px 2fr 1fr 1fr 1fr 1.2fr 20px">
            <li class="rows-head"><span></span><span>Chamber</span><span>Stacks</span><span>Capacity</span><span>Floors</span><span>Status</span><span></span></li>
            @for (c of list(); track c.id) {
              <li>
                <a class="row-link" [routerLink]="['/chambers', c.id]">
                  <app-mini-plan [stacks]="store.stacksByChamber().get(c.id) ?? []" />
                  <div class="row-main">
                    <div class="row-title">{{ c.chamberName || 'Chamber' }} <span class="muted" style="font-weight:500">No. {{ c.chamberNo }}</span></div>
                    <div class="row-meta">
                      <span class="num"><span class="lbl">Stacks </span><b>{{ store.stacksByChamber().get(c.id)?.length ?? 0 }}</b></span>
                      <span class="num"><span class="lbl">Capacity </span><b>{{ c.capacity != null ? (c.capacity | number) + ' MT' : '—' }}</b></span>
                      <span class="num"><span class="lbl">Floors </span><b>{{ c.totalFloors ?? '—' }}</b></span>
                      <span><app-status [value]="c.approvalStatus || c.status || 'Draft'" /></span>
                    </div>
                  </div>
                  <span class="row-end"><app-icon name="next" [size]="18" /></span>
                </a>
              </li>
            } @empty {
              <li class="empty">
                <app-icon name="chamber" [size]="36" />
                @if (q()) {
                  <h3>No match for “{{ q() }}”</h3><p>Try a chamber number instead.</p>
                } @else {
                  <h3>No chambers yet</h3><p>Add a chamber, then mark its boundary and lay out the stacks.</p>
                  <a class="btn primary" routerLink="/chambers/new">New chamber</a>
                }
              </li>
            }
          </ul>
        }
      </section>
    </main>
    <a class="fab" routerLink="/chambers/new"><app-icon name="plus" />New chamber</a>
  `,
})
export class ChambersPage {
  protected store = inject(WarehouseStore);
  private wh = inject(DeviceService).currentWarehouse;
  protected whLabel = computed(() => { const w = this.wh(); return w?.name ? `${w.name} (ID ${w.id})` : `warehouse ${w?.id ?? ''}`; });
  protected q = signal('');
  protected list = computed(() => {
    const q = this.q().trim().toLowerCase();
    return this.store.chambers().filter((c) => !q || `${c.chamberName} ${c.chamberNo}`.toLowerCase().includes(q));
  });
}
