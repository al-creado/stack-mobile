import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { ChambersService } from '../core/chambers.service';
import { UpdateChamberDto } from '../core/api.models';
import { DeviceService } from '../core/device.service';
import { UiService } from '../core/ui.service';
import { WarehouseStore } from '../core/warehouse.store';
import { Topbar } from '../shared/topbar';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-chamber-form',
  imports: [FormsModule, Topbar, Icon],
  template: `
    <app-topbar [title]="id() ? 'Edit chamber' : 'New chamber'" [back]="true" [showWarehouse]="false" />
    <main class="page has-actionbar" style="max-width: 760px">
      <div class="page-head">
        <div class="titles">
          <h1>{{ id() ? 'Edit chamber' : 'New chamber' }}</h1>
          <p>{{ id() ? 'Update the chamber’s details.' : 'Adds a chamber to warehouse ' + warehouseId + '. You can mark its boundary and lay out stacks next.' }}</p>
        </div>
      </div>

      <form #f="ngForm" (ngSubmit)="save()">
        <section class="panel">
          <div class="panel-head"><h2>Identification</h2></div>
          <div class="panel-body form-grid cols-2">
            <label class="field"><span class="label">Chamber name</span>
              <input name="chamberName" required [(ngModel)]="model.chamberName" placeholder="Chamber A" /></label>
            <label class="field"><span class="label">Chamber no.</span>
              <input name="chamberNo" required [(ngModel)]="model.chamberNo" placeholder="CH-01" /></label>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head"><h2>Size</h2></div>
          <div class="panel-body form-grid cols-3">
            <label class="field"><span class="label">Capacity</span>
              <input name="capacity" type="number" inputmode="decimal" [(ngModel)]="model.capacity" />
              <span class="help">Metric tonnes</span></label>
            <label class="field"><span class="label">Floors</span>
              <input name="totalFloors" type="number" inputmode="numeric" [(ngModel)]="model.totalFloors" /></label>
            <label class="field"><span class="label">Area</span>
              <input name="area" [(ngModel)]="model.area" placeholder="40 × 25 m" /></label>
            <label class="field span-all"><span class="label">Remarks</span>
              <textarea name="remarks" [(ngModel)]="model.remarks" placeholder="Anything the approver should know"></textarea></label>
          </div>
        </section>

        <div class="actionbar">
          <button type="button" class="btn ghost" (click)="location.back()">Cancel</button>
          <button class="btn primary" type="submit" [disabled]="f.invalid || saving()">
            <app-icon name="check" [size]="18" />{{ saving() ? 'Saving…' : id() ? 'Save changes' : 'Create chamber' }}
          </button>
        </div>
      </form>
    </main>
  `,
})
export class ChamberFormPage implements OnInit {
  id = input<string>();
  private api = inject(ChambersService);
  private device = inject(DeviceService);
  private ui = inject(UiService);
  private store = inject(WarehouseStore);
  private router = inject(Router);
  protected location = inject(Location);
  protected warehouseId = this.device.session().warehouseId;
  saving = signal(false);
  model: UpdateChamberDto = {};

  ngOnInit() {
    const id = Number(this.id());
    if (id) {
      this.api.get(id).subscribe((c) => {
        this.model = { chamberName: c.chamberName, chamberNo: c.chamberNo, totalFloors: c.totalFloors, capacity: c.capacity, area: c.area, remarks: c.remarks };
      });
    }
  }

  save() {
    this.saving.set(true);
    const id = Number(this.id());
    const fail = { error: () => this.saving.set(false) };
    if (id) {
      this.api.update(id, this.model).subscribe({ ...fail, next: () => { this.ui.show('Changes saved'); this.store.reload(); this.location.back(); } });
    } else {
      this.api.create({ ...this.model, warehouseId: this.device.session().warehouseId! }).subscribe({
        ...fail,
        next: (c) => { this.ui.show('Chamber created'); this.store.reload(); this.router.navigate(['/chambers', c.id], { replaceUrl: true }); },
      });
    }
  }
}
