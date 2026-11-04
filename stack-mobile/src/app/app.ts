import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UiService } from './core/ui.service';
import { DeviceService } from './core/device.service';
import { Icon } from './shared/icon';
import { WarehousePicker } from './shared/warehouse-picker';

const NAV = [
  { path: '/overview', icon: 'overview', label: 'Overview' },
  { path: '/chambers', icon: 'chamber', label: 'Chambers' },
  { path: '/stacks', icon: 'stack', label: 'Stacks' },
  { path: '/inspect', icon: 'inspect', label: 'Inspect' },
];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, WarehousePicker],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <span class="brand-mark"><app-icon name="stack" /></span>
          <span><span class="brand-name">Stack module</span><br /><span class="brand-sub">Warehouse DMS</span></span>
        </div>
        <nav aria-label="Main">
          @for (n of nav; track n.path) {
            <a [routerLink]="n.path" routerLinkActive="active"><app-icon [name]="n.icon" />{{ n.label }}</a>
          }
        </nav>
        <button class="side-wh" (click)="ui.pickerOpen.set(true)">
          <span class="muted" style="font-size:12.5px">Current warehouse</span>
          <span class="wh-name">{{ device.currentWarehouse()?.name || 'Warehouse ' + (device.session().warehouseId ?? '') }}</span>
          <span class="wh-id">ID {{ device.session().warehouseId ?? 'not set' }} <span class="side-change">Change</span></span>
        </button>
      </aside>

      <div class="main"><router-outlet /></div>

      <nav class="tabbar" aria-label="Main">
        @for (n of nav; track n.path) {
          <a [routerLink]="n.path" routerLinkActive="active"><app-icon [name]="n.icon" />{{ n.label }}</a>
        }
      </nav>
    </div>

    @if (ui.pickerOpen()) { <app-warehouse-picker (closed)="ui.pickerOpen.set(false)" /> }

    @if (ui.toast(); as t) {
      <div class="toast" [class.error]="t.kind === 'error'" role="status">
        <app-icon [name]="t.kind === 'error' ? 'x' : 'check'" [size]="18" />{{ t.text }}
      </div>
    }
  `,
})
export class App {
  protected ui = inject(UiService);
  protected device = inject(DeviceService);
  protected nav = NAV;
}
