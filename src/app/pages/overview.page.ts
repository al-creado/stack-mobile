import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WarehouseStore } from '../core/warehouse.store';
import { DeviceService } from '../core/device.service';
import { UiService } from '../core/ui.service';
import { Topbar } from '../shared/topbar';
import { Icon } from '../shared/icon';
import { MiniPlan, StatusBadge } from '../shared/ui-bits';

@Component({
  selector: 'app-overview',
  imports: [Topbar, Icon, RouterLink, DecimalPipe, MiniPlan, StatusBadge],
  template: `
    <app-topbar title="Overview" />
    <main class="page">
      <div class="page-head">
        <div class="titles">
          <h1>{{ wh()?.name || 'Warehouse ' + store.warehouseId() }}</h1>
          <p>Warehouse ID {{ store.warehouseId() }}
            <button class="link-btn" (click)="ui.pickerOpen.set(true)">Change</button></p>
        </div>
        <div class="actions">
          <a class="btn" routerLink="/monitoring"><app-icon name="monitor" [size]="18" />Stock monitoring</a>
          <a class="btn" routerLink="/inspect"><app-icon name="inspect" [size]="18" />Inspect a stack</a>
          <a class="btn primary" routerLink="/chambers/new"><app-icon name="plus" [size]="18" />New chamber</a>
        </div>
      </div>

      @if (store.failed() && !store.loading()) {
        <div class="notice" role="alert" style="margin-bottom:16px">
          <app-icon name="alert" [size]="20" />
          <span style="flex:1">Couldn't load this warehouse. Check the connection and try again.</span>
          <button class="btn sm" (click)="store.reload()"><app-icon name="refresh" [size]="16" />Try again</button>
        </div>
      }

      <section class="summary" aria-label="Totals">
        <div><div class="k">Chambers</div><div class="v">{{ t().chambers }}</div></div>
        <div><div class="k">Stacks</div><div class="v">{{ t().stacks }}</div></div>
        <div><div class="k">Bags stored</div><div class="v">{{ t().bags | number }}</div></div>
        <div><div class="k">Net weight</div><div class="v">{{ t().weight | number: '1.0-2' }}<small>MT</small></div></div>
      </section>

      <div class="layout-2">
        <section class="panel">
          <div class="panel-head">
            <h2>Chambers</h2>
            <a class="btn sm ghost" routerLink="/chambers">See all</a>
          </div>
          @if (store.loading()) {
            @for (i of [1, 2, 3]; track i) { <div class="skeleton"><i></i><i></i></div> }
          } @else {
            <ul class="rows">
              @for (c of store.chambers().slice(0, 6); track c.id) {
                <li>
                  <a class="row-link" [routerLink]="['/chambers', c.id]">
                    <app-mini-plan [stacks]="store.stacksByChamber().get(c.id) ?? []" />
                    <div class="row-main">
                      <div class="row-title">{{ c.chamberName || 'Chamber ' + c.chamberNo }}</div>
                      <div class="row-meta">
                        <span>No. <b>{{ c.chamberNo }}</b></span>
                        <span><b>{{ store.stacksByChamber().get(c.id)?.length ?? 0 }}</b> stacks</span>
                        @if (c.capacity != null) { <span><b>{{ c.capacity | number }}</b> MT capacity</span> }
                      </div>
                    </div>
                    <app-status [value]="c.approvalStatus || c.status" />
                  </a>
                </li>
              } @empty {
                <li class="empty">
                  <app-icon name="chamber" [size]="36" />
                  <h3>No chambers yet</h3>
                  <p>Add the first chamber in warehouse {{ store.warehouseId() }} to start placing stacks.</p>
                  <a class="btn primary" routerLink="/chambers/new">New chamber</a>
                </li>
              }
            </ul>
          }
        </section>

        <section class="panel">
          <div class="panel-head"><h2>Needs attention</h2><span class="hint num">{{ todo().length }}</span></div>
          <ul class="rows">
            @for (item of todo(); track item.key) {
              <li>
                <a class="row-link" [routerLink]="item.link">
                  <span class="badge plain" [class]="'badge plain ' + item.tone"><app-icon [name]="item.icon" [size]="14" /></span>
                  <div class="row-main">
                    <div class="row-title" style="font-weight:500">{{ item.text }}</div>
                    <div class="row-meta">{{ item.sub }}</div>
                  </div>
                  <app-icon name="next" [size]="18" />
                </a>
              </li>
            } @empty {
              <li class="empty"><h3>All set</h3><p>Every chamber has a boundary and every stack is placed.</p></li>
            }
          </ul>
        </section>
      </div>
    </main>
  `,
})
export class OverviewPage {
  protected store = inject(WarehouseStore);
  protected t = this.store.totals;
  protected wh = inject(DeviceService).currentWarehouse;
  protected ui = inject(UiService);

  protected todo = computed(() => {
    const items: { key: string; icon: string; tone: string; text: string; sub: string; link: unknown[] }[] = [];
    for (const c of this.store.chambers()) {
      const name = c.chamberName || `Chamber ${c.chamberNo}`;
      if (!c.latLng?.length) items.push({ key: `b${c.id}`, icon: 'pin', tone: 'warn', text: `${name} has no boundary`, sub: 'Walk the corners with GPS', link: ['/chambers', c.id] });
    }
    for (const s of this.store.stacks().filter((x) => !x.isPositioned)) {
      items.push({ key: `s${s.id}`, icon: 'grid', tone: 'info', text: `Stack ${s.stackName} isn't placed`, sub: s.chamberName ? `In ${s.chamberName}` : 'Place it on the floor plan', link: ['/chambers', s.chamberId] });
    }
    return items.slice(0, 8);
  });
}
