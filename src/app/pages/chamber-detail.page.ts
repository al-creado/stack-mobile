import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { ChambersService } from '../core/chambers.service';
import { StacksService } from '../core/stacks.service';
import { ChamberResponseDto, LatLngPointDto, SetStackConfigDto, StackConfigResponseDto, StackResponseDto } from '../core/api.models';
import { DeviceService } from '../core/device.service';
import { UiService } from '../core/ui.service';
import { WarehouseStore } from '../core/warehouse.store';
import { Topbar } from '../shared/topbar';
import { Icon } from '../shared/icon';
import { StatusBadge } from '../shared/ui-bits';

export const NUMBERING_PATTERNS = [
  { value: 'RowWise', label: 'Row by row' },
  { value: 'ColumnWise', label: 'Column by column' },
  { value: 'Serpentine', label: 'Zig-zag rows' },
];
export const ORIENTATIONS = [
  { value: 'GateBottom', label: 'Bottom', side: 'bottom' },
  { value: 'GateTop', label: 'Top', side: 'top' },
  { value: 'GateLeft', label: 'Left', side: 'left' },
  { value: 'GateRight', label: 'Right', side: 'right' },
];

/** Sequence number for a cell (1-based) under the chosen numbering pattern. */
export function sequenceFor(pattern: string | null | undefined, row: number, col: number, rows: number, cols: number): number {
  switch (pattern) {
    case 'ColumnWise': return col * rows + row + 1;
    case 'Serpentine': return row * cols + (row % 2 === 0 ? col : cols - 1 - col) + 1;
    default: return row * cols + col + 1;
  }
}

type Tab = 'plan' | 'stacks' | 'boundary' | 'details';
interface Cell { key: string; row: number; col: number; seq: number; stack?: StackResponseDto; }

@Component({
  selector: 'app-chamber-detail',
  imports: [FormsModule, RouterLink, DecimalPipe, Topbar, Icon, StatusBadge],
  template: `
    <app-topbar [title]="chamber()?.chamberName || 'Chamber'" [back]="true" [showWarehouse]="false" />

    @if (!chamber()) {
      <main class="page"><div class="panel">@for (i of [1, 2, 3]; track i) { <div class="skeleton"><i></i><i></i></div> }</div></main>
    } @else {
      <main class="page">
        <div class="page-head">
          <div class="titles">
            <div class="title-row"><h1>{{ chamber()!.chamberName || 'Chamber' }}</h1><app-status [value]="chamber()!.approvalStatus || chamber()!.status || 'Draft'" /></div>
            <p>Chamber no. {{ chamber()!.chamberNo }} in warehouse {{ chamber()!.warehouseId }}</p>
          </div>
          <div class="actions">
            <a class="btn" [routerLink]="['/chambers', id(), 'edit']"><app-icon name="edit" [size]="18" />Edit</a>
            <button class="btn primary" [disabled]="busy()" (click)="submit()"><app-icon name="send" [size]="18" />Submit for approval</button>
          </div>
        </div>

        <section class="summary">
          <div><div class="k">Stacks</div><div class="v">{{ stacks().length }}</div></div>
          <div><div class="k">Bags</div><div class="v">{{ totals().bags | number }}</div></div>
          <div><div class="k">Net weight</div><div class="v">{{ totals().wt | number: '1.0-2' }}<small>MT</small></div></div>
          <div><div class="k">Capacity used</div><div class="v">{{ used() !== null ? (used()! | number: '1.0-0') + '%' : '—' }}</div></div>
        </section>

        <div class="tabs" role="tablist">
          <button [class.on]="tab() === 'plan'" (click)="tab.set('plan')"><app-icon name="grid" [size]="18" />Floor plan</button>
          <button [class.on]="tab() === 'stacks'" (click)="tab.set('stacks')"><app-icon name="stack" [size]="18" />Stacks <span class="count">{{ stacks().length }}</span></button>
          <button [class.on]="tab() === 'boundary'" (click)="tab.set('boundary')"><app-icon name="pin" [size]="18" />Boundary</button>
          <button [class.on]="tab() === 'details'" (click)="tab.set('details')">Details</button>
        </div>

        @switch (tab()) {
          @case ('plan') {
            <div class="layout-2">
              <section class="panel">
                <div class="panel-head">
                  <h2>Floor plan</h2>
                  @if (config(); as c) { <span class="hint num">{{ placedCount() }} of {{ c.gridRows * c.gridCols }} spots used</span> }
                </div>
                @if (config(); as c) {
                  <div class="plan-wrap">
                    <div class="plan" [style.--cols]="c.gridCols" [style.grid-template-columns]="'repeat(' + c.gridCols + ', var(--cell))'">
                      @for (cell of cells(); track cell.key) {
                        @if (cell.stack) {
                          <button class="cell bag" (click)="openStack(cell.stack)" [attr.aria-label]="'Stack ' + cell.stack.stackName">
                            <span class="stencil">{{ cell.stack.stackName }}</span>
                            <span class="seq">{{ cell.stack.totalBags | number }} bags</span>
                          </button>
                        } @else {
                          <button class="cell" [class.picked]="placing()?.key === cell.key" (click)="pickCell(cell)"
                                  [attr.aria-label]="'Empty spot ' + cell.seq">{{ cell.seq }}</button>
                        }
                      }
                      <span class="gate-mark" [class]="'gate-mark ' + gateSide()"><app-icon name="gate" [size]="13" />Gate</span>
                    </div>
                  </div>
                  <div class="plan-legend">
                    <span><i class="l-bag"></i>Stack</span>
                    <span><i class="l-empty"></i>Empty spot, tap to place a stack</span>
                  </div>
                  <div class="panel-body">
                    @if (c.isConfirmed) { <span class="badge ok">Layout confirmed</span> }
                    @else { <div class="notice"><app-icon name="grid" [size]="18" />Check the layout matches the chamber, then confirm it so stacks can be locked to their spots.</div> }
                  </div>
                } @else {
                  <div class="empty">
                    <app-icon name="grid" [size]="36" />
                    <h3>No layout yet</h3>
                    <p>Set how many rows and columns of stacks fit in this chamber.</p>
                  </div>
                }
              </section>

              <section class="panel">
                <div class="panel-head"><h2>Layout</h2></div>
                <div class="panel-body form-grid cols-2">
                  <label class="field"><span class="label">Rows</span><input type="number" inputmode="numeric" min="1" max="30" [(ngModel)]="cfg.gridRows" /></label>
                  <label class="field"><span class="label">Columns</span><input type="number" inputmode="numeric" min="1" max="30" [(ngModel)]="cfg.gridCols" /></label>
                  <label class="field span-all"><span class="label">Numbering</span>
                    <select [(ngModel)]="cfg.numberingPattern">@for (p of patterns; track p.value) { <option [value]="p.value">{{ p.label }}</option> }</select>
                  </label>
                  <label class="field span-all"><span class="label">Gate side</span>
                    <select [(ngModel)]="cfg.orientation">@for (o of orientations; track o.value) { <option [value]="o.value">{{ o.label }}</option> }</select>
                  </label>
                </div>
                <div class="panel-foot">
                  <button class="btn" [disabled]="busy()" (click)="saveConfig()">Save layout</button>
                  <button class="btn primary" [disabled]="busy() || !config() || config()!.isConfirmed" (click)="confirmConfig()"><app-icon name="check" [size]="18" />Confirm</button>
                </div>
              </section>
            </div>
          }

          @case ('stacks') {
            <section class="panel">
              <div class="panel-head">
                <h2>Stacks in this chamber</h2>
                <a class="btn sm primary" [routerLink]="['/chambers', id(), 'stacks', 'new']"><app-icon name="plus" [size]="16" />Add stack</a>
              </div>
              <ul class="rows table" style="--cols: 1.4fr 1fr 1fr 0.8fr 1.2fr 1fr">
                <li class="rows-head"><span>Stack</span><span>Bags</span><span>Net weight</span><span>WRS</span><span>Position</span><span></span></li>
                @for (s of stacks(); track s.id) {
                  <li>
                    <div class="row-link" style="cursor:default">
                      <div class="row-main">
                        <a class="row-title" style="color:inherit;text-decoration:none" [routerLink]="['/chambers', id(), 'stacks', s.id]">{{ s.stackName }}</a>
                        <div class="row-meta">
                          <span class="num"><b>{{ s.totalBags | number }}</b><span class="lbl"> bags</span></span>
                          <span class="num"><b>{{ s.totalNetWeight | number: '1.0-3' }}</b> MT</span>
                          <span class="num"><b>{{ s.wrsAllocations?.length ?? 0 }}</b><span class="lbl"> WRS</span></span>
                          <span>
                            @if (s.isPositioned) { <span class="badge ok">Row {{ s.positionRow }}, col {{ s.positionCol }}</span> }
                            @else { <span class="badge warn">Not placed</span> }
                          </span>
                        </div>
                      </div>
                      <span class="row-end" style="justify-content:flex-end">
                        <a class="btn sm" [routerLink]="['/chambers', id(), 'stacks', s.id]">Edit</a>
                        <button class="btn sm primary" (click)="inspect(s)">Inspect</button>
                      </span>
                    </div>
                  </li>
                } @empty {
                  <li class="empty">
                    <app-icon name="stack" [size]="36" />
                    <h3>No stacks in this chamber</h3>
                    <p>Add a stack with its WRS numbers, then place it on the floor plan.</p>
                    <a class="btn primary" [routerLink]="['/chambers', id(), 'stacks', 'new']">Add stack</a>
                  </li>
                }
              </ul>
            </section>
          }

          @case ('boundary') {
            <div class="layout-2">
              <section class="panel">
                <div class="panel-head"><h2>Corners</h2><span class="hint num">{{ points().length }} recorded</span></div>
                <div class="panel-body stack-v">
                  <div class="notice"><app-icon name="pin" [size]="18" />Stand in each corner of the chamber and tap <b>Add this corner</b>. You need at least 3.</div>
                  @if (points().length) {
                    <ul class="rows" style="border:1px solid var(--line); border-radius: var(--r)">
                      @for (p of points(); track $index) {
                        <li class="spread" style="padding:10px 12px">
                          <span><b>Corner {{ $index + 1 }}</b><br /><span class="muted num" style="font-size:13px">{{ p.lat | number: '1.6-6' }}, {{ p.long | number: '1.6-6' }}</span></span>
                          <button class="icon-btn" (click)="removePoint($index)" [attr.aria-label]="'Remove corner ' + ($index + 1)"><app-icon name="trash" [size]="18" /></button>
                        </li>
                      }
                    </ul>
                  }
                  <button class="btn block" [disabled]="locating()" (click)="addCorner()">
                    <app-icon name="pin" [size]="18" />{{ locating() ? 'Getting location…' : 'Add this corner' }}
                  </button>
                  @if (lastAccuracy()) { <span class="muted" style="font-size:13px">Last reading accurate to about {{ lastAccuracy() | number: '1.0-0' }} m</span> }
                </div>
              </section>

              <section class="panel">
                <div class="panel-head"><h2>Gate</h2></div>
                <div class="panel-body stack-v">
                  @if (gate(); as g) {
                    <div><span class="muted" style="font-size:13px">Recorded at</span><br /><b class="num">{{ g.lat | number: '1.6-6' }}, {{ g.long | number: '1.6-6' }}</b></div>
                  } @else { <p class="muted" style="margin:0">Not recorded yet. Stand at the main gate and tap below.</p> }
                  <button class="btn block" [disabled]="locating()" (click)="setGate()"><app-icon name="gate" [size]="18" />Use my location as gate</button>
                </div>
                <div class="panel-foot">
                  <button class="btn primary" [disabled]="points().length < 3 || busy()" (click)="saveBoundary()">
                    <app-icon name="check" [size]="18" />Save boundary
                  </button>
                </div>
              </section>
            </div>
          }

          @case ('details') {
            <section class="panel">
              <div class="panel-head"><h2>Chamber details</h2><a class="btn sm" [routerLink]="['/chambers', id(), 'edit']">Edit</a></div>
              <div class="panel-body">
                <dl class="facts">
                  <div><dt>Chamber no.</dt><dd>{{ chamber()!.chamberNo || '—' }}</dd></div>
                  <div><dt>Capacity</dt><dd>{{ chamber()!.capacity != null ? (chamber()!.capacity | number) + ' MT' : '—' }}</dd></div>
                  <div><dt>Floors</dt><dd>{{ chamber()!.totalFloors ?? '—' }}</dd></div>
                  <div><dt>Area</dt><dd>{{ chamber()!.area || '—' }}</dd></div>
                  <div><dt>Status</dt><dd>{{ chamber()!.status || '—' }}</dd></div>
                  <div><dt>Approval</dt><dd>{{ chamber()!.approvalStatus || '—' }}</dd></div>
                </dl>
                @if (chamber()!.remarks) { <p class="mt"><span class="muted">Remarks</span><br />{{ chamber()!.remarks }}</p> }
              </div>
            </section>
            <section class="panel">
              <div class="panel-head"><h2>Delete chamber</h2></div>
              <div class="panel-body spread" style="flex-wrap:wrap">
                <span class="muted">Removes the chamber and its layout. Stacks in it lose their position.</span>
                <button class="btn danger" (click)="remove()"><app-icon name="trash" [size]="18" />Delete chamber</button>
              </div>
            </section>
          }
        }
      </main>

      @if (placing(); as p) {
        <div class="sheet-backdrop" (click)="placing.set(null)">
          <div class="sheet" (click)="$event.stopPropagation()" role="dialog" aria-label="Place a stack">
            <h3>Place a stack in spot {{ p.seq }}</h3>
            <p>Row {{ p.row + 1 }}, column {{ p.col + 1 }}</p>
            @if (unplaced().length) {
              <ul class="rows" style="border:1px solid var(--line); border-radius: var(--r); margin-bottom: 14px">
                @for (s of unplaced(); track s.id) {
                  <li><button class="row-link" (click)="place(s)">
                    <app-icon name="bag" [size]="18" />
                    <div class="row-main"><div class="row-title">{{ s.stackName }}</div><div class="row-meta"><span><b>{{ s.totalBags | number }}</b> bags</span></div></div>
                    <app-icon name="next" [size]="18" />
                  </button></li>
                }
              </ul>
            } @else {
              <p>Every stack in this chamber is already placed.</p>
            }
            <div class="spread">
              <button class="btn ghost" (click)="placing.set(null)">Cancel</button>
              <a class="btn" [routerLink]="['/chambers', id(), 'stacks', 'new']">Add a new stack</a>
            </div>
          </div>
        </div>
      }
    }
  `,
})
export class ChamberDetailPage implements OnInit {
  id = input.required<string>();
  private chambersApi = inject(ChambersService);
  private stacksApi = inject(StacksService);
  private device = inject(DeviceService);
  private ui = inject(UiService);
  private store = inject(WarehouseStore);
  private router = inject(Router);

  patterns = NUMBERING_PATTERNS;
  orientations = ORIENTATIONS;

  tab = signal<Tab>('plan');
  chamber = signal<ChamberResponseDto | null>(null);
  config = signal<StackConfigResponseDto | null>(null);
  stacks = signal<StackResponseDto[]>([]);
  points = signal<LatLngPointDto[]>([]);
  gate = signal<LatLngPointDto | null>(null);
  lastAccuracy = signal<number | null>(null);
  locating = signal(false);
  busy = signal(false);
  placing = signal<Cell | null>(null);

  cfg: SetStackConfigDto = { gridRows: 4, gridCols: 6, numberingPattern: 'RowWise', orientation: 'GateBottom' };

  unplaced = computed(() => this.stacks().filter((s) => !s.isPositioned));
  placedCount = computed(() => this.stacks().filter((s) => s.isPositioned).length);
  totals = computed(() => this.stacks().reduce((t, s) => ({ bags: t.bags + (s.totalBags || 0), wt: t.wt + (s.totalNetWeight || 0) }), { bags: 0, wt: 0 }));
  used = computed(() => { const cap = this.chamber()?.capacity; return cap ? (this.totals().wt / cap) * 100 : null; });
  gateSide = computed(() => ORIENTATIONS.find((o) => o.value === this.config()?.orientation)?.side ?? 'bottom');

  cells = computed<Cell[]>(() => {
    const c = this.config();
    if (!c) return [];
    const byPos = new Map(this.stacks().filter((s) => s.isPositioned).map((s) => [`${s.positionRow}-${s.positionCol}`, s]));
    const out: Cell[] = [];
    for (let r = 0; r < c.gridRows; r++)
      for (let col = 0; col < c.gridCols; col++)
        out.push({ key: `${r}-${col}`, row: r, col, seq: sequenceFor(c.numberingPattern, r, col, c.gridRows, c.gridCols), stack: byPos.get(`${r + 1}-${col + 1}`) });
    return out;
  });

  ngOnInit() { this.load(); }
  private get cid() { return Number(this.id()); }

  load() {
    forkJoin({
      chamber: this.chambersApi.get(this.cid),
      config: this.chambersApi.getStackConfig(this.cid).pipe(catchError(() => of(null))),
      stacks: this.stacksApi.list(this.cid).pipe(catchError(() => of([] as StackResponseDto[]))),
    }).subscribe(({ chamber, config, stacks }) => {
      this.chamber.set(chamber);
      this.points.set(chamber.latLng ?? []);
      if (chamber.gateLatitude != null && chamber.gateLongitude != null) this.gate.set({ lat: chamber.gateLatitude, long: chamber.gateLongitude });
      this.config.set(config && config.gridRows ? config : null);
      if (config?.gridRows) this.cfg = { gridRows: config.gridRows, gridCols: config.gridCols, numberingPattern: config.numberingPattern ?? 'RowWise', orientation: config.orientation ?? 'GateBottom' };
      this.stacks.set(stacks ?? []);
    });
  }

  // ---- boundary ----
  private async fix() {
    this.locating.set(true);
    try {
      const p = await this.device.currentPosition();
      this.lastAccuracy.set(p.accuracy);
      return { lat: p.lat, long: p.long };
    } catch {
      this.ui.show('Location is off. Turn on GPS and allow location for this app.', 'error');
      return null;
    } finally {
      this.locating.set(false);
    }
  }
  async addCorner() { const p = await this.fix(); if (p) this.points.update((a) => [...a, p]); }
  async setGate() { const p = await this.fix(); if (p) this.gate.set(p); }
  removePoint(i: number) { this.points.update((a) => a.filter((_, j) => j !== i)); }

  saveBoundary() {
    this.busy.set(true);
    this.chambersApi.saveBoundary(this.cid, { latLng: this.points(), gate: this.gate() ?? undefined }).subscribe({
      next: (c) => { this.chamber.set(c); this.busy.set(false); this.ui.show('Boundary saved'); this.store.reload(); },
      error: () => this.busy.set(false),
    });
  }

  // ---- layout ----
  saveConfig() {
    this.busy.set(true);
    this.chambersApi.setStackConfig(this.cid, { ...this.cfg, gridRows: Number(this.cfg.gridRows), gridCols: Number(this.cfg.gridCols) }).subscribe({
      next: (c) => { this.config.set(c); this.busy.set(false); this.ui.show('Layout saved'); },
      error: () => this.busy.set(false),
    });
  }
  confirmConfig() {
    this.busy.set(true);
    this.chambersApi.confirmStackConfig(this.cid).subscribe({
      next: () => { this.busy.set(false); this.ui.show('Layout confirmed'); this.load(); },
      error: () => this.busy.set(false),
    });
  }

  pickCell(cell: Cell) { this.placing.set(cell); }
  openStack(s: StackResponseDto) { this.router.navigate(['/chambers', this.id(), 'stacks', s.id]); }

  place(s: StackResponseDto) {
    const p = this.placing(), c = this.config();
    if (!p || !c) return;
    this.stacksApi.setPosition(this.cid, s.id, {
      positionRow: p.row + 1, positionCol: p.col + 1, positionSequence: p.seq, positionPattern: c.numberingPattern,
    }).subscribe(() => { this.placing.set(null); this.ui.show(`Stack ${s.stackName} placed`); this.load(); this.store.reload(); });
  }

  inspect(s: StackResponseDto) {
    const c = this.chamber()!;
    this.router.navigate(['/inspect'], {
      queryParams: { chamberNo: c.chamberNo, stackNo: s.stackName, position: s.isPositioned ? `R${s.positionRow}C${s.positionCol}` : '' },
    });
  }

  submit() {
    this.busy.set(true);
    this.chambersApi.submit(this.cid).subscribe({
      next: () => { this.busy.set(false); this.ui.show('Submitted for approval'); this.load(); this.store.reload(); },
      error: () => this.busy.set(false),
    });
  }
  remove() {
    if (!confirm('Delete this chamber? This cannot be undone.')) return;
    this.chambersApi.delete(this.cid).subscribe(() => {
      this.ui.show('Chamber deleted');
      this.store.reload();
      this.router.navigateByUrl('/chambers', { replaceUrl: true });
    });
  }
}
