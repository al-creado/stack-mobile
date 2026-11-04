import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DeviceService } from '../core/device.service';
import { MonitoringStore, PHOTO_SLOTS } from '../core/monitoring.store';
import { Icon } from '../shared/icon';
import { MonFrame } from './mon-frame';

/** Screen 3: the seven required photos. The camera button fills the highlighted slot. */
@Component({
  selector: 'app-stack-photos',
  imports: [MonFrame, Icon],
  template: `
    @if (stack(); as s) {
      <app-mon-frame [title]="(s.stackName || '') + ': Photos'" [subtitle]="chamber() + ', Stack ' + position() + ' of ' + total()">
        <section class="mon-card mon-hint">
          Minimum 4 side photos and 1 top photo, plus the stack card and a sample commodity photo (7 in total).
        </section>

        @if (showTips()) {
          <section class="mon-card mon-hint tips">
            <b>Tips</b>
            <ul>
              <li>Stand back so the whole face of the stack is in frame.</li>
              <li>Keep the stack card readable and the sample in good light.</li>
              <li>Retake any photo that is blurred or cut off.</li>
            </ul>
          </section>
        }

        <div class="mon-photos">
          @for (slot of slots; track slot.field; let i = $index) {
            <button class="mon-photo" [class.active]="active() === i" [class.done]="!!shot(i)" (click)="active.set(i)">
              <span class="mon-photo-img">
                @if (shot(i); as p) { <img [src]="p.preview" [alt]="slot.label" /> }
                @else { <app-icon name="camera" [size]="34" /> }
              </span>
              <span class="mon-photo-label">{{ i + 1 }}. {{ slot.label }}</span>
            </button>
          }
        </div>

        <div class="mon-foot two-rows">
          <div class="mon-camera-row">
            <button class="mon-link" (click)="capture(active())" [disabled]="!shot(active())">Retake</button>
            <button class="mon-shutter" (click)="capture(active())" [disabled]="busy()" aria-label="Take photo"><app-icon name="camera" [size]="30" /></button>
            <button class="mon-link" (click)="showTips.set(!showTips())">Tips</button>
          </div>
          <button class="mon-btn" [disabled]="count() < slots.length" (click)="preview()">Save and preview ({{ count() }}/{{ slots.length }})</button>
        </div>
      </app-mon-frame>
    }
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
  protected chamber = computed(() => this.mon.chamberNameOf(this.stack()).toUpperCase());
  protected position = computed(() => {
    const s = this.stack();
    const siblings = s ? this.mon.groups().find((g) => g.chamber.id === s.chamberId)?.stacks ?? [] : [];
    return Math.max(1, siblings.findIndex((x) => x.id === s?.id) + 1);
  });
  protected total = computed(() => {
    const s = this.stack();
    return s ? this.mon.groups().find((g) => g.chamber.id === s.chamberId)?.stacks.length ?? 1 : 1;
  });
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
