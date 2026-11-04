import { Component, inject, input } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { Icon } from '../shared/icon';

/** Green "ICC SURAKSHA" screen: sunset header with fence, back button, title block, then the page body. */
@Component({
  selector: 'app-mon-frame',
  imports: [Icon],
  template: `
    <div class="mon">
      <header class="mon-head">
        <button class="mon-back" (click)="goBack()" aria-label="Back"><app-icon name="back" [size]="26" /></button>
        <span class="mon-pill">ICC SURAKSHA</span>
        <i class="mon-sun" aria-hidden="true"></i>
        <i class="mon-fence" aria-hidden="true"></i>
      </header>
      <div class="mon-title">
        <h1>{{ title() }}</h1>
        @if (subtitle()) { <p>{{ subtitle() }}</p> }
      </div>
      <ng-content />
    </div>
  `,
})
export class MonFrame {
  title = input.required<string>();
  subtitle = input('');
  /** Where the back arrow goes; browser history when empty. */
  backLink = input('');
  private location = inject(Location);
  private router = inject(Router);

  protected goBack() {
    const to = this.backLink();
    if (to) this.router.navigateByUrl(to, { replaceUrl: true });
    else this.location.back();
  }
}
