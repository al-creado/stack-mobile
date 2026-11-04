import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, Location } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { StacksService } from '../core/stacks.service';
import { SaveStackDto, StackResponseDto, WrsAllocationDto } from '../core/api.models';
import { UiService } from '../core/ui.service';
import { WarehouseStore } from '../core/warehouse.store';
import { Topbar } from '../shared/topbar';
import { Icon } from '../shared/icon';

const VIEWS = ['Front', 'Back', 'Left', 'Right', 'Top'];

@Component({
  selector: 'app-stack-form',
  imports: [FormsModule, DecimalPipe, Topbar, Icon],
  template: `
    <app-topbar [title]="stackId() ? 'Stack ' + (model.stackName || '') : 'New stack'" [back]="true" [showWarehouse]="false" />
    <main class="page has-actionbar" style="max-width: 860px">
      <div class="page-head">
        <div class="titles">
          <h1>{{ stackId() ? 'Stack ' + (model.stackName || '') : 'New stack' }}</h1>
          <p>
            @if (existing(); as s) {
              {{ s.chamberName || 'Chamber ' + s.chamberId }},
              {{ s.isPositioned ? 'row ' + s.positionRow + ' col ' + s.positionCol : 'not placed yet' }}
            } @else { Add the stack and the WRS receipts it holds. Place it on the floor plan afterwards. }
          </p>
        </div>
        @if (stackId()) {
          <div class="actions"><button class="btn primary" (click)="inspect()"><app-icon name="inspect" [size]="18" />Inspect</button></div>
        }
      </div>

      <section class="panel">
        <div class="panel-head"><h2>Stack</h2></div>
        <div class="panel-body form-grid">
          <label class="field"><span class="label">Stack name or number</span>
            <input [(ngModel)]="model.stackName" placeholder="S-12" required /></label>
          <div class="field">
            <span class="label">Photo views required at inspection</span>
            <div class="toggle-chips">
              @for (v of views; track v) {
                <label [class.on]="model.selectedViews?.includes(v)">
                  <input type="checkbox" [checked]="model.selectedViews?.includes(v)" (change)="toggleView(v)" />
                  @if (model.selectedViews?.includes(v)) { <app-icon name="check" [size]="15" /> }{{ v }}
                </label>
              }
            </div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>WRS receipts</h2>
          <button class="btn sm" (click)="addWrs()"><app-icon name="plus" [size]="16" />Add WRS</button>
        </div>
        <div class="panel-body">
          @if (wrs().length) {
            <div class="lines" style="--line-cols: 2fr 1fr 1fr 40px">
              @for (w of wrs(); track $index) {
                <div class="line">
                  <label class="field"><span class="label">WRS no.</span><input [(ngModel)]="w.wrsNo" placeholder="WRS-2026-0001" /></label>
                  <label class="field"><span class="label">Bags</span><input type="number" inputmode="numeric" [(ngModel)]="w.bags" (ngModelChange)="touch()" /></label>
                  <label class="field"><span class="label">Net wt (MT)</span><input type="number" inputmode="decimal" [(ngModel)]="w.netWeight" (ngModelChange)="touch()" /></label>
                  <button class="icon-btn" (click)="removeWrs($index)" aria-label="Remove WRS"><app-icon name="trash" [size]="18" /></button>
                </div>
              }
            </div>
            <div class="line-total"><span>Stack total</span><span>{{ totals().bags | number }} bags, {{ totals().wt | number: '1.0-3' }} MT</span></div>
          } @else {
            <div class="empty" style="padding:20px">
              <p>No receipts on this stack yet.</p>
              <button class="btn" (click)="addWrs()"><app-icon name="plus" [size]="18" />Add the first WRS</button>
            </div>
          }
        </div>
      </section>

      <div class="actionbar">
        @if (stackId()) { <button class="btn danger" (click)="remove()"><app-icon name="trash" [size]="18" />Delete</button> }
        <button class="btn primary" [disabled]="!model.stackName || saving()" (click)="save()">
          <app-icon name="check" [size]="18" />{{ saving() ? 'Saving…' : stackId() ? 'Save changes' : 'Create stack' }}
        </button>
      </div>
    </main>
  `,
})
export class StackFormPage implements OnInit {
  id = input.required<string>();
  stackId = input<string>();
  private api = inject(StacksService);
  private ui = inject(UiService);
  private store = inject(WarehouseStore);
  private router = inject(Router);
  private location = inject(Location);

  views = VIEWS;
  saving = signal(false);
  existing = signal<StackResponseDto | null>(null);
  model: SaveStackDto = { stackName: '', selectedViews: [...VIEWS] };
  wrs = signal<WrsAllocationDto[]>([]);
  private tick = signal(0);
  totals = computed(() => {
    this.tick();
    return this.wrs().reduce((t, w) => ({ bags: t.bags + (+w.bags || 0), wt: t.wt + (+w.netWeight || 0) }), { bags: 0, wt: 0 });
  });

  ngOnInit() {
    const sid = Number(this.stackId());
    if (sid) {
      this.api.get(Number(this.id()), sid).subscribe((s) => {
        this.existing.set(s);
        this.model = {
          stackName: s.stackName, selectedViews: s.selectedViews ?? [],
          positionRow: s.positionRow, positionCol: s.positionCol, positionSequence: s.positionSequence, positionPattern: s.positionPattern,
        };
        this.wrs.set((s.wrsAllocations ?? []).map((w) => ({ ...w })));
      });
    }
  }

  touch() { this.tick.update((n) => n + 1); }
  toggleView(v: string) {
    const cur = this.model.selectedViews ?? [];
    this.model.selectedViews = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
  }
  addWrs() { this.wrs.update((a) => [...a, { wrsNo: '', bags: 0, netWeight: 0 }]); }
  removeWrs(i: number) { this.wrs.update((a) => a.filter((_, j) => j !== i)); }

  inspect() {
    const s = this.existing();
    this.router.navigate(['/inspect'], {
      queryParams: { stackNo: this.model.stackName, position: s?.isPositioned ? `R${s.positionRow}C${s.positionCol}` : '' },
    });
  }

  save() {
    this.saving.set(true);
    const dto: SaveStackDto = {
      ...this.model,
      wrsAllocations: this.wrs().filter((w) => w.wrsNo).map((w) => ({ wrsNo: w.wrsNo, bags: +w.bags || 0, netWeight: +w.netWeight || 0 })),
    };
    const cid = Number(this.id()), sid = Number(this.stackId());
    const req: Observable<unknown> = sid ? this.api.update(cid, sid, dto) : this.api.create(cid, dto);
    req.subscribe({
      next: () => { this.ui.show(sid ? 'Changes saved' : 'Stack created'); this.store.reload(); this.location.back(); },
      error: () => this.saving.set(false),
    });
  }

  remove() {
    if (!confirm('Delete this stack?')) return;
    this.api.delete(Number(this.id()), Number(this.stackId())).subscribe(() => { this.ui.show('Stack deleted'); this.store.reload(); this.location.back(); });
  }
}
