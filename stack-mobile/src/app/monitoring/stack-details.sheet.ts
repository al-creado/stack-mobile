import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { StackResponseDto } from '../core/api.models';
import { BANKS, COMMODITY_CATEGORIES } from '../core/lookups';
import { MonitoringStore, bagsOf } from '../core/monitoring.store';
import { Icon } from '../shared/icon';

interface BlockRow { danda: number | null; patta: number | null; height: number | null; }

/**
 * "<stack> Details" bottom sheet: bags (auto from blocks), net weight, bank, commodity category,
 * remark and the stack measurement blocks. Saves into MonitoringStore, then emits `saved`.
 */
@Component({
  selector: 'app-stack-details-sheet',
  imports: [FormsModule, DecimalPipe, Icon],
  template: `
    <div class="mon-backdrop" (click)="closed.emit()">
      <div class="mon-sheet" (click)="$event.stopPropagation()" role="dialog" [attr.aria-label]="stack().stackName + ' details'">
        <div class="mon-sheet-head">
          <span class="mon-sheet-icon"><app-icon name="layers" [size]="24" /></span>
          <h2>{{ stack().stackName }} Details</h2>
          <button class="mon-x" (click)="closed.emit()" aria-label="Close"><app-icon name="x" [size]="24" /></button>
        </div>

        <div class="mon-sheet-body">
          <div class="mon-two">
            <label class="mon-field"><span>Bags (auto)</span>
              <span class="mon-input readonly"><b class="num">{{ bags() | number }}</b><small>bags</small></span></label>
            <label class="mon-field"><span>Net weight (MT)</span>
              <span class="mon-input"><input type="number" inputmode="decimal" step="any" min="0" [(ngModel)]="netWeight" placeholder="0.0" /><small>MT</small></span></label>
          </div>

          <fieldset class="mon-group">
            <legend>Commodity and bank</legend>
            <label class="mon-field"><span>Bank</span>
              <select class="mon-select" [ngModel]="bankId()" (ngModelChange)="bankId.set($event)">
                <option [ngValue]="null">Select bank</option>
                @for (b of banks; track b.id) { <option [ngValue]="b.id">{{ b.name }}</option> }
              </select></label>
            <label class="mon-field"><span>Commodity category</span>
              <select class="mon-select" [ngModel]="commodityId()" (ngModelChange)="commodityId.set($event)">
                <option [ngValue]="null">Select category</option>
                @for (c of categories; track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
              </select></label>
          </fieldset>

          <label class="mon-field"><span>Remark (optional)</span>
            <input class="mon-text" [(ngModel)]="remark" placeholder="Add remark" /></label>

          <fieldset class="mon-group">
            <legend>Stack measurement</legend>
            <div class="mon-field center"><span>Number of blocks</span></div>
            <div class="mon-stepper">
              <button type="button" (click)="setBlockCount(blocks().length - 1)" [disabled]="blocks().length <= 1" aria-label="Fewer blocks"><app-icon name="minus" /></button>
              <span class="num">{{ blocks().length }}</span>
              <button type="button" (click)="setBlockCount(blocks().length + 1)" aria-label="More blocks"><app-icon name="plus" /></button>
            </div>
            @for (b of blocks(); track $index) {
              <div class="mon-block">
                <b>Block {{ $index + 1 }}</b>
                <label class="mon-field"><span>Danda</span><input class="mon-text" type="number" inputmode="decimal" step="any" min="0" [(ngModel)]="b.danda" (ngModelChange)="touch()" /></label>
                <label class="mon-field"><span>Patta</span><input class="mon-text" type="number" inputmode="decimal" step="any" min="0" [(ngModel)]="b.patta" (ngModelChange)="touch()" /></label>
                <label class="mon-field"><span>Height</span><input class="mon-text" type="number" inputmode="decimal" step="any" min="0" [(ngModel)]="b.height" (ngModelChange)="touch()" /></label>
              </div>
            }
          </fieldset>
        </div>

        <div class="mon-sheet-foot">
          <button class="mon-btn" [disabled]="!valid()" (click)="save()">{{ actionLabel() }}</button>
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
