import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MonitoringStore, PHOTO_SLOTS, bagsOf, positionOf } from '../core/monitoring.store';
import { MonFrame } from './mon-frame';
import { StackDetailsSheet } from './stack-details.sheet';

/** Screen 4: check the photos and numbers, edit bags/quantity, or submit the stack. */
@Component({
  selector: 'app-stack-preview',
  imports: [MonFrame, DecimalPipe, StackDetailsSheet],
  template: `
    @if (stack(); as s) {
      @if (draft(); as d) {
        <app-mon-frame [title]="(s.stackName || '') + ': Preview'" [subtitle]="chamber() + ', Stack ' + position() + ' of ' + total()" backLink="">
          <div class="mon-strip">
            @for (slot of slots; track slot.field) {
              <figure>
                @if (d.photos[slot.field]; as p) { <img [src]="p.preview" [alt]="slot.label" /> }
                <figcaption>{{ slot.label }}</figcaption>
              </figure>
            }
          </div>

          <section class="mon-card mon-facts">
            <div><span>Chamber</span><b>{{ chamber() }}</b></div>
            <div><span>Stack name</span><b>{{ s.stackName }}</b></div>
            <div><span>Position</span><b>{{ pos() || 'Not set' }}</b></div>
            <div><span>No. of bags</span><b class="num">{{ bags() | number }}</b></div>
            <div><span>Net weight (MT)</span><b class="num">{{ d.netWeight | number: '1.2-2' }}</b></div>
            <div><span>Remark</span><b>{{ d.remark || 'None' }}</b></div>
          </section>

          <div class="mon-foot row">
            <button class="mon-btn light" [disabled]="sending()" (click)="editing.set(true)">Edit bags / qty</button>
            <button class="mon-btn" [disabled]="sending()" (click)="submit()">{{ sending() ? 'Submitting…' : 'Submit stack' }}</button>
          </div>
        </app-mon-frame>

        @if (editing()) {
          <app-stack-details-sheet [stack]="s" actionLabel="Save changes" (closed)="editing.set(false)" (saved)="editing.set(false)" />
        }
      }
    }
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
  protected position = computed(() => {
    const s = this.stack();
    const siblings = s ? this.mon.groups().find((g) => g.chamber.id === s.chamberId)?.stacks ?? [] : [];
    return Math.max(1, siblings.findIndex((x) => x.id === s?.id) + 1);
  });
  protected total = computed(() => {
    const s = this.stack();
    return s ? this.mon.groups().find((g) => g.chamber.id === s.chamberId)?.stacks.length ?? 1 : 1;
  });

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
