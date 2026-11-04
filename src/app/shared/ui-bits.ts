import { Component, computed, input } from '@angular/core';
import { StackResponseDto } from '../core/api.models';

/** Maps free-text API statuses to a badge tone. */
export function statusTone(status: string | null | undefined): 'ok' | 'warn' | 'bad' | 'info' | '' {
  const s = (status ?? '').toLowerCase();
  if (!s) return '';
  if (/(approv|active|complete|confirm)/.test(s)) return 'ok';
  if (/(reject|fail|block|cancel)/.test(s)) return 'bad';
  if (/(submit|review|pending)/.test(s)) return 'info';
  return 'warn'; // draft, new, etc.
}

@Component({
  selector: 'app-status',
  template: `@if (text()) { <span class="badge" [class]="'badge ' + tone()">{{ text() }}</span> }`,
})
export class StatusBadge {
  value = input<string | null | undefined>();
  text = computed(() => this.value() || '');
  tone = computed(() => statusTone(this.value()));
}

/** Tiny floor-plan thumbnail: jute squares for placed stacks. */
@Component({
  selector: 'app-mini-plan',
  template: `
    <div class="mini-plan" [style.grid-template-columns]="'repeat(' + dims().cols + ', 1fr)'" aria-hidden="true">
      @for (c of cells(); track $index) { <i [class.f]="c"></i> }
    </div>
  `,
})
export class MiniPlan {
  stacks = input<StackResponseDto[]>([]);
  rows = input<number | null>(null);
  colsIn = input<number | null>(null, { alias: 'cols' });

  dims = computed(() => ({
    rows: Math.min(Math.max(this.rows() ?? this.guess().rows, 3), 6),
    cols: Math.min(Math.max(this.colsIn() ?? this.guess().cols, 3), 6),
  }));
  private guess = computed(() => {
    const placed = this.stacks().filter((s) => s.isPositioned);
    const r = Math.max(0, ...placed.map((s) => s.positionRow ?? 0));
    const c = Math.max(0, ...placed.map((s) => s.positionCol ?? 0));
    return { rows: r, cols: c };
  });
  cells = computed(() => {
    const { rows, cols } = this.dims();
    const filled = new Set(this.stacks().filter((s) => s.isPositioned).map((s) => `${s.positionRow}-${s.positionCol}`));
    const out: boolean[] = [];
    for (let r = 1; r <= rows; r++) for (let c = 1; c <= cols; c++) out.push(filled.has(`${r}-${c}`));
    return out;
  });
}
