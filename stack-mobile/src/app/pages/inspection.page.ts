import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, Location } from '@angular/common';
import { InspectionService } from '../core/inspection.service';
import { StackBlockModel, StackImageField, StackInspectionForm } from '../core/api.models';
import { DeviceService } from '../core/device.service';
import { UiService } from '../core/ui.service';
import { Topbar } from '../shared/topbar';
import { Icon } from '../shared/icon';

const PHOTO_SLOTS: { field: StackImageField; label: string }[] = [
  { field: 'FrontImage', label: 'Front' },
  { field: 'BackImage', label: 'Back' },
  { field: 'LeftImage', label: 'Left' },
  { field: 'RightImage', label: 'Right' },
  { field: 'TopImage', label: 'Top' },
  { field: 'StackCardImage', label: 'Stack card' },
  { field: 'SampleCommodityImage', label: 'Sample' },
  { field: 'LockPhoto', label: 'Lock' },
];

@Component({
  selector: 'app-inspection',
  imports: [FormsModule, DecimalPipe, Topbar, Icon],
  template: `
    <app-topbar title="Inspect a stack" [back]="!!stackNo()" [showWarehouse]="!stackNo()" />
    <main class="page has-actionbar" style="max-width: 960px">
      <div class="page-head">
        <div class="titles">
          <h1>{{ form.StackNo ? 'Inspect stack ' + form.StackNo : 'Inspect a stack' }}</h1>
          <p>Count the bags, measure the blocks and photograph each side.</p>
        </div>
      </div>

      <div class="layout-2">
        <div>
          <section class="panel">
            <div class="panel-head"><h2>Which stack</h2></div>
            <div class="panel-body form-grid cols-2">
              <label class="field span-all"><span class="label">Report type</span>
                <select [(ngModel)]="form.ReportType">
                  <option value="Inspection">Inspection</option>
                  <option value="Physical Verification">Physical verification</option>
                  <option value="Stock Audit">Stock audit</option>
                </select></label>
              <label class="field"><span class="label">Chamber no.</span><input [(ngModel)]="form.ChamberNo" /></label>
              <label class="field"><span class="label">Stack no.</span><input [(ngModel)]="form.StackNo" required /></label>
              <label class="field span-all"><span class="label">Position</span><input [(ngModel)]="form.StackPosition" placeholder="R2C3" /></label>
            </div>
          </section>

          <section class="panel">
            <div class="panel-head"><h2>Commodity and count</h2></div>
            <div class="panel-body form-grid cols-2">
              <label class="field span-all"><span class="label">Commodity</span><input [(ngModel)]="form.CommodityName" placeholder="Wheat" /></label>
              <label class="field"><span class="label">Commodity ID</span><input type="number" inputmode="numeric" [(ngModel)]="form.CommodityId" /></label>
              <label class="field"><span class="label">Bank ID</span><input type="number" inputmode="numeric" [(ngModel)]="form.BankId" /></label>
              <label class="field"><span class="label">Bags counted</span><input type="number" inputmode="numeric" [(ngModel)]="form.BagCount" /></label>
              <label class="field"><span class="label">Extra bags</span><input type="number" inputmode="numeric" [(ngModel)]="form.ExtraBags" /></label>
              <label class="field span-all"><span class="label">Net weight</span><input type="number" inputmode="decimal" [(ngModel)]="form.NetWet" /><span class="help">Metric tonnes</span></label>
            </div>
          </section>

          <section class="panel">
            <div class="panel-head">
              <h2>Blocks</h2>
              <button class="btn sm" (click)="addBlock()"><app-icon name="plus" [size]="16" />Add block</button>
            </div>
            <div class="panel-body">
              @if (blocks().length) {
                <div class="lines" style="--line-cols: 28px 1fr 1fr 1fr 40px">
                  @for (b of blocks(); track $index) {
                    <div class="line">
                      <span class="num muted" style="padding-bottom:12px">{{ $index + 1 }}</span>
                      <label class="field"><span class="label">Danda</span><input type="number" inputmode="decimal" [(ngModel)]="b.danda" (ngModelChange)="touch()" /></label>
                      <label class="field"><span class="label">Patta</span><input type="number" inputmode="decimal" [(ngModel)]="b.patta" (ngModelChange)="touch()" /></label>
                      <label class="field"><span class="label">Height</span><input type="number" inputmode="decimal" [(ngModel)]="b.height" (ngModelChange)="touch()" /></label>
                      <button class="icon-btn" (click)="removeBlock($index)" aria-label="Remove block"><app-icon name="trash" [size]="18" /></button>
                    </div>
                  }
                </div>
                <div class="line-total"><span>Bags by measurement</span><span>{{ blockBags() | number }}</span></div>
                @if (form.BagCount && blockBags() && blockBags() !== +form.BagCount) {
                  <p class="muted" style="font-size:13px; margin:8px 0 0">Differs from the counted bags by {{ blockBags() - +form.BagCount | number }}.</p>
                }
              } @else {
                <div class="empty" style="padding:16px"><p>Add one block per section of the stack: danda × patta × height.</p></div>
              }
            </div>
          </section>
        </div>

        <div>
          <section class="panel">
            <div class="panel-head"><h2>Photos</h2><span class="hint num">{{ photoCount() }} of {{ slots.length }}</span></div>
            <div class="panel-body stack-v">
              <div class="progress" aria-hidden="true"><i [style.width.%]="(photoCount() / slots.length) * 100"></i></div>
              <div class="photos">
                @for (s of slots; track s.field) {
                  <button class="photo" [class.done]="previews()[s.field]" (click)="capture(s.field)" [attr.aria-label]="'Photo: ' + s.label">
                    @if (previews()[s.field]; as src) {
                      <img [src]="src" [alt]="s.label" /><span class="cap">{{ s.label }}</span>
                    } @else {
                      <app-icon name="camera" [size]="22" />{{ s.label }}
                    }
                  </button>
                }
              </div>
            </div>
          </section>

          <section class="panel">
            <div class="panel-head"><h2>Remarks</h2></div>
            <div class="panel-body"><textarea [(ngModel)]="form.Remarks" placeholder="Damage, pests, moisture, anything unusual"></textarea></div>
          </section>
        </div>
      </div>

      <div class="actionbar">
        <button class="btn primary" [disabled]="sending() || !form.StackNo" (click)="submit()">
          <app-icon name="send" [size]="18" />{{ sending() ? 'Uploading…' : 'Submit inspection' }}
        </button>
      </div>
    </main>
  `,
})
export class InspectionPage implements OnInit {
  chamberNo = input<string>();
  stackNo = input<string>();
  position = input<string>();

  private api = inject(InspectionService);
  private device = inject(DeviceService);
  private ui = inject(UiService);
  private location = inject(Location);

  slots = PHOTO_SLOTS;
  sending = signal(false);
  blocks = signal<StackBlockModel[]>([]);
  previews = signal<Partial<Record<StackImageField, string>>>({});
  photoCount = computed(() => Object.keys(this.previews()).length);
  private tick = signal(0);
  blockBags = computed(() => { this.tick(); return this.blocks().reduce((t, b) => t + (+b.danda || 0) * (+b.patta || 0) * (+b.height || 0), 0); });
  private files: Partial<Record<StackImageField, Blob>> = {};
  form: StackInspectionForm = { ReportType: 'Inspection' };

  ngOnInit() {
    const s = this.device.session();
    this.form = {
      ...this.form,
      WarehouseId: s.warehouseId ?? undefined,
      EntBy: s.userId ?? undefined,
      ChamberNo: this.chamberNo() ?? '',
      StackNo: this.stackNo() ?? '',
      StackPosition: this.position() ?? '',
    };
  }

  touch() { this.tick.update((n) => n + 1); }
  addBlock() { this.blocks.update((a) => [...a, { blockNo: a.length + 1, danda: 0, patta: 0, height: 0 }]); }
  removeBlock(i: number) { this.blocks.update((a) => a.filter((_, j) => j !== i).map((b, j) => ({ ...b, blockNo: j + 1 }))); }

  async capture(field: StackImageField) {
    const shot = await this.device.takePhoto();
    if (!shot) return;
    this.files[field] = shot.blob;
    this.previews.update((p) => ({ ...p, [field]: shot.preview }));
  }

  submit() {
    this.sending.set(true);
    const payload: StackInspectionForm = {
      ...this.form,
      Blocks: this.blocks().map((b) => ({ blockNo: b.blockNo, danda: +b.danda || 0, patta: +b.patta || 0, height: +b.height || 0 })),
      ...this.files,
    };
    this.api.submitInspection(payload).subscribe({
      next: () => { this.ui.show('Inspection submitted'); this.sending.set(false); if (this.stackNo()) this.location.back(); },
      error: () => this.sending.set(false),
    });
  }
}
