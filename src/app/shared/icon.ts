import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// Stroke icons (24px grid, 1.75 stroke). Paths only, so no icon font or network needed.
const PATHS: Record<string, string> = {
  overview: 'M4 13h6V4H4zM14 20h6v-9h-6zM14 4v4h6V4zM4 20h6v-4H4z',
  chamber: 'M3 21V9l9-5 9 5v12M7 21v-8h10v8M7 17h10',
  stack: 'M5 18h14M5 14h14M7 10h10M9 6h6M5 18v-4M19 18v-4M7 14v-4M17 14v-4M9 10V6M15 10V6',
  inspect: 'M9 4h6v3H9zM8 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2M9 14l2 2 4-4',
  plus: 'M12 5v14M5 12h14',
  back: 'M15 18l-6-6 6-6',
  next: 'M9 18l6-6-6-6',
  refresh: 'M20 11a8 8 0 0 0-14.9-4M4 4v4h4M4 13a8 8 0 0 0 14.9 4M20 20v-4h-4',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  pin: 'M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  gate: 'M4 21V5h16v16M4 21h16M12 5v16M9 13h.01M15 13h.01',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  check: 'M5 12l5 5 9-10',
  x: 'M6 6l12 12M18 6L6 18',
  send: 'M4 12l16-8-6 16-3-7z',
  grid: 'M4 4h16v16H4zM4 10h16M4 15h16M10 4v16M15 4v16',
  warehouse: 'M3 10l9-6 9 6M5 9v11h14V9M9 20v-6h6v6',
  bag: 'M7 5h10l2 15H5zM9 5c0-1 1-2 3-2s3 1 3 2M8 10h8',
  minus: 'M5 12h14',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5',
  alert: 'M12 7v6.5M12 17.2v.01',
  monitor: 'M5 4h14v16H5zM9 9h6M9 13h6M9 17h3',
};

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'icon', 'aria-hidden': 'true' },
  template: `<svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path [attr.d]="d()" /></svg>`,
})
export class Icon {
  name = input.required<string>();
  size = input(20);
  d = computed(() => PATHS[this.name()] ?? '');
}
