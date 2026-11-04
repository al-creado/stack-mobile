import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DeviceService } from '../core/device.service';
import { MonitoringStore, PHOTO_SLOTS } from '../core/monitoring.store';
import { Icon } from '../shared/icon';
import { Topbar } from '../shared/topbar';

/** The seven required photos. The camera button fills the highlighted slot. */
@Component({
  selector: 'app-stack-photos',
  imports: [Topbar, Icon],
  template: `
    <app-topbar [title]="(stack()?.stackName || '') + ' photos'" [back]="true" [showWarehouse]="false" />
    <main class="page has-actionbar tall-actionbar" style="max-width: 860px">
      @if (stack(); as s) {
        <div class="page-head">
          <div class="titles">
            <h1>{{ s.stackName }}: photos</h1>
            <p>{{ chamber() }}, stack {{ position() }} of {{ total() }}</p>
          </div>
        </div>

        <div class="notice">
          <app-icon name="camera" [size]="20" />
          <span>Minimum 4 side photos and 1 top photo, plus the stack card and a sample commodity photo (7 in total).</span>
        </div>

        @if (showTips()) {
          <div class="notice mt">
            <app-icon name="alert" [size]="20" />
            <span>Stand back so the whole face of the stack is in frame. Keep the stack card readable and the sample in good light. Retake anything blurred or cut off.</span>
          </div>
        }

        <section class="panel mt">
          <div class="panel-head"><h2>Photos</h2><span class="hint num">{{ count() }} of {{ slots.length }}</span></div>
          <div class="panel-body stack-v">
            <div class="progress" aria-hidden="true"><i [style.width.%]="(count() / slots.length) * 100"></i></div>
            <div class="photos">
              @for (slot of slots; track slot.field; let i = $index) {
                <button class="photo" [class.done]="!!shot(i)" [class.active]="active() === i" (click)="active.set(i)" [attr.aria-label]="'Photo ' + (i + 1) + ': ' + slot.label">
                  @if (shot(i); as p) {
                    <img [src]="p.preview" [alt]="slot.label" /><span class="cap">{{ i + 1 }}. {{ slot.label }}</span>
                  } @else {
                    <app-icon name="camera" [size]="22" />{{ i + 1 }}. {{ slot.label }}
                  }
                </button>
              }
            </div>
          </div>
        </section>

        <div class="actionbar wrap">
          <button class="btn" (click)="capture(active())" [disabled]="!shot(active()) || busy()">Retake</button>
          <button class="btn" (click)="capture(active())" [disabled]="busy()"><app-icon name="camera" [size]="18" />Take photo {{ active() + 1 }}</button>
          <button class="btn ghost" (click)="showTips.set(!showTips())">Tips</button>
          <button class="btn primary full" [disabled]="count() < slots.length" (click)="preview()">Save and preview ({{ count() }}/{{ slots.length }})</button>
        </div>
      }
    </main>
  `,
})
export class StackPhotosPage implements OnInit {
  stackId = input.required<string>();
  private mon = inject(MonitoringStore);
  private device = inject(DeviceService);
  private router = inject(Router);

  protected slots = PHOTO_SLOTS;
  protected active = signal(0);
  protected busy = signal(false);
  protected showTips = signal(false);

  protected stack = computed(() => this.mon.stackById(+this.stackId()));
  protected chamber = computed(() => this.mon.chamberNameOf(this.stack()));
  protected position = computed(() => this.mon.indexInChamber(this.stack()));
  protected total = computed(() => this.mon.countInChamber(this.stack()));
  protected count = computed(() => this.mon.photoCount(+this.stackId()));

  ngOnInit() {
    // The draft lives in memory: if the page was reloaded there is nothing to add photos to.
    const id = +this.stackId();
    if (!this.mon.draftFor(id)) { this.router.navigate(['/monitoring'], { replaceUrl: true }); return; }
    const firstEmpty = PHOTO_SLOTS.findIndex((s) => !this.mon.draftFor(id)?.photos[s.field]);
    this.active.set(Math.max(0, firstEmpty));
  }

  protected shot(i: number) { return this.mon.drafts()[+this.stackId()]?.photos[this.slots[i].field]; }

  protected async capture(i: number) {
    this.busy.set(true);
    try {
      const shot = await this.device.takePhoto('camera');
      if (!shot) return;
      this.mon.setPhoto(+this.stackId(), this.slots[i].field, shot);
      // Move on to the next slot that still needs a photo.
      const next = this.slots.findIndex((_, j) => j !== i && !this.shot(j));
      if (next >= 0) this.active.set(next);
    } finally {
      this.busy.set(false);
    }
  }

  protected preview() { this.router.navigate(['/monitoring/stack', this.stackId(), 'preview']); }
}
