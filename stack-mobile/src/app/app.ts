import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiService } from './core/ui.service';
import { Icon } from './shared/icon';
import { WarehousePicker } from './shared/warehouse-picker';

/** Root: the routed screen (stock monitoring, or the management shell), plus the toast and warehouse picker. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Icon, WarehousePicker],
  template: `
    <router-outlet />

    @if (ui.pickerOpen()) { <app-warehouse-picker (closed)="ui.pickerOpen.set(false)" /> }

    @if (ui.toast(); as t) {
      <div class="toast" [class.error]="t.kind === 'error'" role="status">
        <app-icon [name]="t.kind === 'error' ? 'x' : 'check'" [size]="18" />{{ t.text }}
      </div>
    }
  `,
})
export class App {
  protected ui = inject(UiService);
}
