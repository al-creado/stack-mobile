import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { ChambersService } from './chambers.service';
import { StacksService } from './stacks.service';
import { DeviceService } from './device.service';
import { ChamberResponseDto, StackResponseDto } from './api.models';

/** Chambers + stacks for the current warehouse, shared by Overview, Chambers and Stacks pages. */
@Injectable({ providedIn: 'root' })
export class WarehouseStore {
  private chambersApi = inject(ChambersService);
  private stacksApi = inject(StacksService);
  private device = inject(DeviceService);

  readonly warehouseId = computed(() => this.device.session().warehouseId);
  readonly chambers = signal<ChamberResponseDto[]>([]);
  readonly stacks = signal<StackResponseDto[]>([]);
  readonly loading = signal(false);
  readonly failed = signal(false);

  readonly stacksByChamber = computed(() => {
    const m = new Map<number, StackResponseDto[]>();
    for (const s of this.stacks()) m.set(s.chamberId, [...(m.get(s.chamberId) ?? []), s]);
    return m;
  });

  readonly totals = computed(() => {
    const st = this.stacks();
    return {
      chambers: this.chambers().length,
      stacks: st.length,
      bags: st.reduce((t, s) => t + (s.totalBags || 0), 0),
      weight: st.reduce((t, s) => t + (s.totalNetWeight || 0), 0),
      unplaced: st.filter((s) => !s.isPositioned).length,
      capacity: this.chambers().reduce((t, c) => t + (c.capacity || 0), 0),
    };
  });

  constructor() {
    // Reload whenever the warehouse changes.
    effect(() => { if (this.warehouseId()) this.reload(); });
  }

  reload(): void {
    const wid = this.warehouseId();
    if (!wid) return;
    this.loading.set(true);
    this.failed.set(false);
    forkJoin({
      chambers: this.chambersApi.byWarehouse(wid).pipe(catchError(() => { this.failed.set(true); return of([] as ChamberResponseDto[]); })),
      stacks: this.stacksApi.byWarehouse(wid).pipe(catchError(() => { this.failed.set(true); return of([] as StackResponseDto[]); })),
    }).subscribe(({ chambers, stacks }) => {
      this.chambers.set(chambers ?? []);
      this.stacks.set(stacks ?? []);
      this.loading.set(false);
    });
  }
}
