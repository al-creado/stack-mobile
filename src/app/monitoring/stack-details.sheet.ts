import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { StackResponseDto } from '../core/api.models';
import { BANKS, COMMODITY_CATEGORIES } from '../core/lookups';
import { MonitoringStore, bagsOf } from '../core/monitoring.store';
import { Icon } from '../shared/icon';

interface BlockRow { danda: number | null; patta: number | null; height: number | null; }

/**
 * "<stack> details" sheet: bags (auto from blocks), net weight, bank, commodity category,
 * remark and the stack measurement blocks. Saves into MonitoringStore, then emits `saved`.
 */
@Component({
  selector: 'app-stack-details-sheet',
  imports: [FormsModule, DecimalPipe, Icon],
  template: `
    <div class="sheet-backdrop" (click)="closed.emit()">
      <div class="sheet tall" (click)="$event.stopPropagation()" role="dialog" [attr.aria-label]="stack().stackName + ' details'">
        <div class="spread">
          <h3 id="sd-title">{{ stack().stackName }} details</h3>
          <button class="icon-btn" (click)="closed.emit()" aria-label="Close"><app-icon name="x" /></button>
        </div>
        <p>{{ where() }}</p>

        <div class="form-grid">
          <div class="form-grid cols-2">
            <div class="field"><span class="label">Bags (auto)</span>
              <div class="static-value num">{{ bags() | number }} <small class="muted">bags</small></div></div>
            <label class="field"><span class="label">Net weight (MT)</span>
              <input type="number" inputmode="decimal" step="any" min="0" [(ngModel)]="netWeight" name="nw" placeholder="0.0" /></label>
          </div>

          <label class="field"><span class="label">Bank</span>
            <select [ngModel]="bankId()" (ngModelChange)="bankId.set($event)" name="bank">
              <option [ngValue]="null">Select bank</option>
              @for (b of banks; track b.id) { <option [ngValue]="b.id">{{ b.name }}</option> }
            </select></label>
          <label class="field"><span class="label">Commodity category</span>
            <select [ngModel]="commodityId()" (ngModelChange)="commodityId.set($event)" name="cat">
              <option [ngValue]="null">Select category</option>
              @for (c of categories; track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
            </select></label>
          <label class="field"><span class="label">Remark (optional)</span>
            <input [(ngModel)]="remark" name="remark" placeholder="Add remark" /></label>

          <div class="field">
            <span class="label">Stack measurement · number of blocks</span>
            <div class="stepper">
              <button type="button" class="btn" (click)="setBlockCount(blocks().length - 1)" [disabled]="blocks().length <= 1" aria-label="Fewer blocks"><app-icon name="minus" [size]="18" /></button>
              <span class="num">{{ blocks().length }}</span>
              <button type="button" class="btn" (click)="setBlockCount(blocks().length + 1)" aria-label="More blocks"><app-icon name="plus" [size]="18" /></button>
            </div>
          </div>

          <div class="lines" style="--line-cols: 28px 1fr 1fr 1fr">
            @for (b of blocks(); track $index) {
              <div class="line">
                <span class="num muted" style="padding-bottom:12px">{{ $index + 1 }}</span>
                <label class="field"><span class="label">Danda</span><input type="number" inputmode="decimal" step="any" min="0" [(ngModel)]="b.danda" [name]="'d' + $index" (ngModelChange)="touch()" /></label>
                <label class="field"><span class="label">Patta</span><input type="number" inputmode="decimal" step="any" min="0" [(ngModel)]="b.patta" [name]="'p' + $index" (ngModelChange)="touch()" /></label>
                <label class="field"><span class="label">Height</span><input type="number" inputmode="decimal" step="any" min="0" [(ngModel)]="b.height" [name]="'h' + $index" (ngModelChange)="touch()" /></label>
              </div>
            }
          </div>
          <div class="line-total"><span>Bags by measurement</span><span>{{ bags() | number }}</span></div>
        </div>

        <div class="sheet-foot">
          <button class="btn primary block" [disabled]="!valid()" (click)="save()">{{ actionLabel() }}</button>
        </div>
      </div>
    </div>
  `,
})
export class StackDetailsSheet implements OnInit {
  stack = input.required<StackResponseDto>();
  actionLabel = input('Continue to photos');
  closed = output<void>();
  saved = output<void>();

  private store = inject(MonitoringStore);
  protected banks = BANKS;
  protected categories = COMMODITY_CATEGORIES;

  protected blocks = signal<BlockRow[]>([{ danda: null, patta: null, height: null }]);
  protected netWeight: number | null = null;
  protected bankId = signal<number | null>(null);
  protected commodityId = signal<number | null>(null);
  protected remark = '';

  private tick = signal(0);
  protected bags = computed(() => { this.tick(); return bagsOf(this.blocks()); });
  protected valid = computed(() => this.bags() > 0 && !!this.bankId() && !!this.commodityId() && +(this.netWeight ?? 0) > 0);

  protected where = computed(() => {
    const s = this.stack();
    const place = s.isPositioned ? `row ${s.positionRow}, col ${s.positionCol}` : 'not placed on the layout';
    return `${this.store.chamberNameOf(s)}, ${place}`;
  });

  ngOnInit() {
    // Re-opening a stack (or editing from the preview) starts from what was entered before.
    const d = this.store.draftFor(this.stack().id);
    if (!d) return;
    this.blocks.set(d.blocks.map((b) => ({ danda: b.danda, patta: b.patta, height: b.height })));
    this.netWeight = d.netWeight;
    this.bankId.set(d.bankId);
    this.commodityId.set(d.commodityId);
    this.remark = d.remark;
  }

  protected touch() { this.tick.update((n) => n + 1); }

  protected setBlockCount(n: number) {
    n = Math.max(1, n);
    this.blocks.update((a) => (n < a.length ? a.slice(0, n) : [...a, ...Array.from({ length: n - a.length }, () => ({ danda: null, patta: null, height: null }))]));
    this.touch();
  }

  protected save() {
    if (!this.valid()) return;
    this.store.saveDetails(this.stack().id, {
      blocks: this.blocks().map((b, i) => ({ blockNo: i + 1, danda: +(b.danda ?? 0), patta: +(b.patta ?? 0), height: +(b.height ?? 0) })),
      netWeight: +(this.netWeight ?? 0),
      bankId: this.bankId(),
      commodityId: this.commodityId(),
      commodityName: this.categories.find((c) => c.id === this.commodityId())?.name ?? '',
      remark: this.remark.trim(),
    });
    this.saved.emit();
  }
}
