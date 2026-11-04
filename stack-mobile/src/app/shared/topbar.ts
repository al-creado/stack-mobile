import { Component, inject, input } from '@angular/core';
import { Location } from '@angular/common';
import { Icon } from './icon';
import { DeviceService } from '../core/device.service';
import { WarehouseStore } from '../core/warehouse.store';
import { UiService } from '../core/ui.service';

/** Page header: back button on nested pages, title, refresh, and the current warehouse (tap to change). */
@Component({
  selector: 'app-topbar',
  imports: [Icon],
  template: `
    <header class="appbar">
      <div class="crumb">
        @if (back()) {
          <button class="icon-btn" (click)="location.back()" aria-label="Back"><app-icon name="back" /></button>
          <span class="crumb-title">{{ title() }}</span>
        } @else {
          <span class="brand-mobile"><app-icon name="stack" /> Stack module</span>
          <span class="crumb-title desk-only">{{ title() }}</span>
        }
      </div>
      @if (showWarehouse()) {
        <button class="icon-btn" (click)="store.reload()" aria-label="Refresh" title="Refresh"><app-icon name="refresh" /></button>
        <button class="wh-switch" (click)="ui.pickerOpen.set(true)" aria-label="Change warehouse">
          <app-icon name="warehouse" [size]="18" />
          <span class="wh-text">
            <span class="wh-name">{{ wh()?.name || 'Warehouse ' + (wh()?.id ?? '') }}</span>
            <span class="wh-id">ID {{ wh()?.id ?? 'not set' }}</span>
          </span>
          <app-icon name="next" [size]="16" class="wh-chev" />
        </button>
      }
    </header>
  `,
})
export class Topbar {
  title = input('');
  back = input(false);
  showWarehouse = input(true);
  protected location = inject(Location);
  protected store = inject(WarehouseStore);
  protected ui = inject(UiService);
  protected wh = inject(DeviceService).currentWarehouse;
}
