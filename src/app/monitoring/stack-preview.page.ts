import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MonitoringStore, PHOTO_SLOTS, bagsOf, positionOf } from '../core/monitoring.store';
import { Icon } from '../shared/icon';
import { Topbar } from '../shared/topbar';
import { StackDetailsSheet } from './stack-details.sheet';

/** Check the photos and numbers, edit bags/quantity, or submit the stack. */
@Component({
  selector: 'app-stack-preview',
  imports: [Topbar, Icon, DecimalPipe, StackDetailsSheet],
  template: `
    <app-topbar [title]="(stack()?.stackName || '') + ' preview'" [back]="true" [showWarehouse]="false" />
    <main class="page has-actionbar" style="max-width: 860px">
      @if (stack(); as s) {
        @if (draft(); as d) {
          <div class="page-head">
            <div class="titles">
              <h1>{{ s.stackName }}: preview</h1>
              <p>{{ chamber() }}, stack {{ position() }} of {{ total() }}</p>
            </div>
          </div>

          <section class="panel">
            <div class="panel-head"><h2>Photos</h2><span class="hint num">{{ slots.length }} of {{ slots.length }}</span></div>
            <div class="panel-body">
              <div class="photos">
                @for (slot of slots; track slot.field) {
                  <div class="photo done">
                    @if (d.photos[slot.field]; as p) { <img [src]="p.preview" [alt]="slot.label" /> }
                    <span class="cap">{{ slot.label }}</span>
                  </div>
                }
              </div>
            </div>
          </section>

          <section class="panel">
            <div class="panel-head"><h2>Summary</h2></div>
            <div class="panel-body">
              <dl class="facts">
                <div><dt>Chamber</dt><dd>{{ chamber() }}</dd></div>
                <div><dt>Stack name</dt><dd>{{ s.stackName }}</dd></div>
                <div><dt>Position</dt><dd>{{ pos() || 'Not set' }}</dd></div>
                <div><dt>No. of bags</dt><dd>{{ bags() | number }}</dd></div>
                <div><dt>Net weight (MT)</dt><dd>{{ d.netWeight | number: '1.2-2' }}</dd></div>
                <div><dt>Remark</dt><dd>{{ d.remark || 'None' }}</dd></div>
              </dl>
            </div>
          </section>

          <div class="actionbar">
            <button class="btn" [disabled]="sending()" (click)="editing.set(true)"><app-icon name="edit" [size]="18" />Edit bags / qty</button>
            <button class="btn primary" [disabled]="sending()" (click)="submit()"><app-icon name="send" [size]="18" />{{ sending() ? 'Submitting…' : 'Submit stack' }}</button>
          </div>

          @if (editing()) {
            <app-stack-details-sheet [stack]="s" actionLabel="Save changes" (closed)="editing.set(false)" (saved)="editing.set(false)" />
          }
        }
      }
    </main>
  `,
})
export class StackPreviewPage implements OnInit {
  stackId = input.required<string>();
  private mon = inject(MonitoringStore);
  private router = inject(Router);

  protected slots = PHOTO_SLOTS;
  protected sending = signal(false);
  protected editing = signal(false);

  protected stack = computed(() => this.mon.stackById(+this.stackId()));
  protected draft = computed(() => this.mon.drafts()[+this.stackId()]);
  protected chamber = computed(() => this.mon.chamberNameOf(this.stack()));
  protected pos = computed(() => { const s = this.stack(); return s ? positionOf(s) : ''; });
  protected bags = computed(() => bagsOf(this.draft()?.blocks ?? []));
  protected position = computed(() => this.mon.indexInChamber(this.stack()));
  protected total = computed(() => this.mon.countInChamber(this.stack()));

  ngOnInit() {
    const id = +this.stackId();
    if (this.mon.photoCount(id) < PHOTO_SLOTS.length) {
      // Reloaded, or opened by link, before all seven photos exist.
      this.router.navigate(this.mon.draftFor(id) ? ['/monitoring/stack', id, 'photos'] : ['/monitoring'], { replaceUrl: true });
    }
  }

  protected submit() {
    const s = this.stack();
    if (!s || this.sending()) return;
    this.sending.set(true);
    this.mon.submitStack(s).subscribe({
      next: () => this.router.navigate(['/monitoring/stack', s.id, 'result'], { replaceUrl: true }),
      error: () => this.sending.set(false), // the error toast comes from the HTTP interceptor
    });
  }
}
