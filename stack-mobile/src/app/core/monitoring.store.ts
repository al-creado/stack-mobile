import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ChamberResponseDto, StackBlockModel, StackImageField, StackInspectionForm, StackResponseDto } from './api.models';
import { DeviceService } from './device.service';
import { InspectionService } from './inspection.service';
import { WarehouseStore } from './warehouse.store';

/** Report type sent to StackApi for every stack submitted from the stock monitoring flow. */
export const MONITORING_REPORT_TYPE = 'Stock Monitoring';
/** Net weight (MT) may differ from the recorded weight by this much and still count as matched. */
const WEIGHT_TOLERANCE_MT = 0.01;

/** The seven photos an auditor must take for each stack, in screen order. */
export const PHOTO_SLOTS: { field: StackImageField; label: string }[] = [
  { field: 'FrontImage', label: 'Front' },
  { field: 'BackImage', label: 'Back' },
  { field: 'LeftImage', label: 'Left' },
  { field: 'RightImage', label: 'Right' },
  { field: 'TopImage', label: 'Top' },
  { field: 'StackCardImage', label: 'Stack card' },
  { field: 'SampleCommodityImage', label: 'Sample commodity' },
];

export type StackStatus = 'not_started' | 'in_progress' | 'matched' | 'not_matched';

export interface PhotoShot { blob: Blob; preview: string; }

export interface StackDraft {
  blocks: StackBlockModel[];
  netWeight: number | null;
  bankId: number | null;
  commodityId: number | null;
  commodityName: string;
  remark: string;
  photos: Partial<Record<StackImageField, PhotoShot>>;
}

export interface StackResult { matched: boolean; bags: number; netWeight: number; }

export interface ChamberGroup { chamber: ChamberResponseDto; stacks: StackResponseDto[]; done: number; notMatched: number; }

export const bagsOf = (blocks: { danda?: number | null; patta?: number | null; height?: number | null }[]): number =>
  blocks.reduce((t, b) => t + (Number(b.danda) || 0) * (Number(b.patta) || 0) * (Number(b.height) || 0), 0);

export const positionOf = (s: StackResponseDto): string =>
  s.isPositioned && s.positionRow != null && s.positionCol != null ? `R${s.positionRow}C${s.positionCol}` : '';

/**
 * Progress of one stock-monitoring round for the current warehouse.
 * Chambers and stacks come from WarehouseStore; drafts (what the auditor is entering) and results
 * (what the server said after each stack was submitted) live here, in memory, for the session.
 */
@Injectable({ providedIn: 'root' })
export class MonitoringStore {
  private wh = inject(WarehouseStore);
  private device = inject(DeviceService);
  private api = inject(InspectionService);

  readonly loading = this.wh.loading;
  readonly failed = this.wh.failed;
  readonly drafts = signal<Record<number, StackDraft>>({});
  readonly results = signal<Record<number, StackResult>>({});

  /** Chambers that have at least one stack to monitor. */
  readonly groups = computed<ChamberGroup[]>(() => {
    const results = this.results();
    const byChamber = this.wh.stacksByChamber();
    return this.wh.chambers()
      .map((chamber) => {
        const stacks = byChamber.get(chamber.id) ?? [];
        return {
          chamber, stacks,
          done: stacks.filter((s) => results[s.id]).length,
          notMatched: stacks.filter((s) => results[s.id] && !results[s.id].matched).length,
        };
      })
      .filter((g) => g.stacks.length > 0);
  });

  readonly summary = computed(() => {
    const groups = this.groups();
    const stackIds = new Set(groups.flatMap((g) => g.stacks.map((s) => s.id)));
    const finished = Object.entries(this.results()).filter(([id]) => stackIds.has(+id)).map(([, r]) => r);
    return {
      chambers: groups.length,
      stacks: stackIds.size,
      done: finished.length,
      notMatched: finished.filter((r) => !r.matched).length,
      bags: finished.reduce((t, r) => t + r.bags, 0),
      weight: finished.reduce((t, r) => t + r.netWeight, 0),
    };
  });

  stackById(id: number): StackResponseDto | undefined {
    return this.wh.stacks().find((s) => s.id === id);
  }

  chamberNameOf(stack: StackResponseDto | undefined): string {
    if (!stack) return '';
    const c = this.wh.chambers().find((x) => x.id === stack.chamberId);
    return c?.chamberName || stack.chamberName || (c?.chamberNo ? `Chamber ${c.chamberNo}` : `Chamber ${stack.chamberId}`);
  }

  statusOf(stackId: number): StackStatus {
    const r = this.results()[stackId];
    if (r) return r.matched ? 'matched' : 'not_matched';
    return this.drafts()[stackId] ? 'in_progress' : 'not_started';
  }

  draftFor(stackId: number): StackDraft | undefined { return this.drafts()[stackId]; }

  /** Saves the details sheet. Photos already taken for this stack are kept. */
  saveDetails(stackId: number, d: Omit<StackDraft, 'photos'>): void {
    this.drafts.update((all) => ({ ...all, [stackId]: { ...d, photos: all[stackId]?.photos ?? {} } }));
  }

  setPhoto(stackId: number, field: StackImageField, shot: PhotoShot): void {
    this.drafts.update((all) => {
      const cur = all[stackId];
      return cur ? { ...all, [stackId]: { ...cur, photos: { ...cur.photos, [field]: shot } } } : all;
    });
  }

  photoCount(stackId: number): number {
    const p = this.drafts()[stackId]?.photos ?? {};
    return PHOTO_SLOTS.filter((s) => p[s.field]).length;
  }

  /** Uploads the stack, then records whether it matched what the warehouse has on record. */
  submitStack(stack: StackResponseDto): Observable<StackResult> {
    const d = this.drafts()[stack.id];
    const chamber = this.wh.chambers().find((c) => c.id === stack.chamberId);
    const session = this.device.session();
    const bags = bagsOf(d.blocks);
    const netWeight = +(d.netWeight ?? 0);

    const files: Partial<Record<StackImageField, Blob>> = {};
    for (const s of PHOTO_SLOTS) if (d.photos[s.field]) files[s.field] = d.photos[s.field]!.blob;

    const form: StackInspectionForm = {
      ReportType: MONITORING_REPORT_TYPE,
      WarehouseId: session.warehouseId ?? undefined,
      EntBy: session.userId ?? undefined,
      ChamberNo: chamber?.chamberNo ?? '',
      StackNo: stack.stackName ?? '',
      StackPosition: positionOf(stack),
      CommodityId: d.commodityId ?? undefined,
      BankId: d.bankId ?? undefined,
      CommodityName: d.commodityName,
      BagCount: bags,
      NetWet: netWeight,
      Remarks: d.remark,
      Blocks: d.blocks.map((b, i) => ({ blockNo: i + 1, danda: +b.danda || 0, patta: +b.patta || 0, height: +b.height || 0 })),
      ...files,
    };

    return this.api.submitInspection(form).pipe(
      map((res) => {
        const matched = serverVerdict(res) ?? matchesRecord(stack, bags, netWeight);
        const result: StackResult = { matched, bags, netWeight };
        this.results.update((all) => ({ ...all, [stack.id]: result }));
        return result;
      }),
    );
  }

  /** Called after the auditor submits the whole round; the next round starts clean. */
  reset(): void {
    this.drafts.set({});
    this.results.set({});
  }
}

/** If StackApi answers with an explicit matched flag, trust it. */
function serverVerdict(res: unknown): boolean | null {
  if (res && typeof res === 'object') {
    const r = res as Record<string, unknown>;
    for (const k of ['matched', 'isMatched', 'IsMatched', 'Matched']) if (typeof r[k] === 'boolean') return r[k] as boolean;
  }
  return null;
}

/** Otherwise compare the count against what the stack has on record (its WRS allocations). */
function matchesRecord(stack: StackResponseDto, bags: number, netWeight: number): boolean {
  if (!stack.totalBags) return false;
  return bags === stack.totalBags && Math.abs(netWeight - (stack.totalNetWeight || 0)) <= WEIGHT_TOLERANCE_MT;
}
