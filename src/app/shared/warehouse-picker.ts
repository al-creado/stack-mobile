import { Component, ElementRef, afterNextRender, inject, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DeviceService, KnownWarehouse } from '../core/device.service';
import { Icon } from './icon';

/** Sheet for typing a warehouse ID (and an optional name), or picking a recent one. */
@Component({
  selector: 'app-warehouse-picker',
  imports: [FormsModule, Icon],
  template: `
    <div class="sheet-backdrop" (click)="closed.emit()">
      <div class="sheet" (click)="$event.stopPropagation()" role="dialog" aria-labelledby="wh-title">
        <div class="spread">
          <h3 id="wh-title">Open a warehouse</h3>
          <button class="icon-btn" (click)="closed.emit()" aria-label="Close"><app-icon name="x" /></button>
        </div>
        <p>Type the warehouse ID from the DMS.</p>

        <form class="form-grid" (ngSubmit)="open()">
          <label class="field"><span class="label">Warehouse ID</span>
            <input #idInput type="number" inputmode="numeric" name="id" required [(ngModel)]="id" placeholder="e.g. 1024" class="wh-id-input" />
          </label>
          <label class="field"><span class="label">Name</span>
            <input name="name" [(ngModel)]="name" placeholder="e.g. Rajkot Central" />
            <span class="help">Optional. Shown in the header and saved on this device.</span>
          </label>
          <button class="btn primary block" type="submit" [disabled]="!id()"><app-icon name="warehouse" [size]="18" />Open warehouse</button>
        </form>

        @if (device.warehouses().length) {
          <h4 class="recent-title">Recent</h4>
          <ul class="rows recent">
            @for (w of device.warehouses(); track w.id) {
              <li class="spread">
                <button class="row-link" (click)="pick(w)">
                  <span class="wh-avatar">{{ initials(w) }}</span>
                  <span class="row-main">
                    <span class="row-title">{{ w.name || 'Warehouse ' + w.id }}</span>
                    <span class="row-meta">ID {{ w.id }}</span>
                  </span>
                  @if (w.id === device.session().warehouseId) { <span class="badge ok">Open</span> }
                </button>
                <button class="icon-btn" (click)="device.forgetWarehouse(w.id)" [attr.aria-label]="'Remove ' + (w.name || w.id) + ' from recent'"><app-icon name="x" [size]="16" /></button>
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
})
export class WarehousePicker {
  closed = output<void>();
  protected device = inject(DeviceService);
  protected id = signal<number | null>(null);
  protected name = signal('');
  private idInput = viewChild<ElementRef<HTMLInputElement>>('idInput');

  constructor() {
    afterNextRender(() => this.idInput()?.nativeElement.focus());
  }

  // When an ID already in the recent list is typed, prefill its saved name.
  protected async open() {
    const id = Number(this.id());
    if (!id) return;
    await this.device.openWarehouse(id, this.name());
    this.closed.emit();
  }
  protected async pick(w: KnownWarehouse) {
    await this.device.openWarehouse(w.id);
    this.closed.emit();
  }
  protected initials(w: KnownWarehouse) {
    const n = w.name.trim();
    if (!n) return String(w.id).slice(-3);
    return n.split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  }
}
