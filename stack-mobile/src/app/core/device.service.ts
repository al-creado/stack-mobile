import { Injectable, computed, signal } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';
import { environment } from '../../environments/environment';

export interface Session { warehouseId: number | null; userId: number | null; }
export interface KnownWarehouse { id: number; name: string; }

/** Thin wrapper over the Capacitor plugins (works in the browser too, with web fallbacks). */
@Injectable({ providedIn: 'root' })
export class DeviceService {
  readonly session = signal<Session>({ warehouseId: environment.defaultWarehouseId, userId: null });

  /**
   * Warehouses opened on this device, most recent first, with the name the user gave them.
   * StackApi has no warehouse endpoint yet; when it does, fill names from the API here instead.
   */
  readonly warehouses = signal<KnownWarehouse[]>([]);
  readonly currentWarehouse = computed<KnownWarehouse | null>(() => {
    const id = this.session().warehouseId;
    if (!id) return null;
    return this.warehouses().find((w) => w.id === id) ?? { id, name: '' };
  });

  /** Restores the last warehouse used on this device; falls back to environment.defaultWarehouseId. */
  async loadSession(): Promise<void> {
    const [{ value }, { value: known }] = await Promise.all([Preferences.get({ key: 'session' }), Preferences.get({ key: 'warehouses' })]);
    if (value) {
      const s = JSON.parse(value) as Session;
      this.session.set({ warehouseId: s.warehouseId ?? environment.defaultWarehouseId, userId: s.userId ?? null });
    }
    if (known) this.warehouses.set(JSON.parse(known));
  }

  /** Switch to a warehouse, remembering it (and its name, if given) at the top of the recent list. */
  async openWarehouse(id: number, name?: string): Promise<void> {
    const prev = this.warehouses().find((w) => w.id === id);
    const entry: KnownWarehouse = { id, name: (name ?? '').trim() || prev?.name || '' };
    const list = [entry, ...this.warehouses().filter((w) => w.id !== id)].slice(0, 8);
    this.warehouses.set(list);
    await Preferences.set({ key: 'warehouses', value: JSON.stringify(list) });
    await this.saveSession({ ...this.session(), warehouseId: id });
  }

  async forgetWarehouse(id: number): Promise<void> {
    const list = this.warehouses().filter((w) => w.id !== id);
    this.warehouses.set(list);
    await Preferences.set({ key: 'warehouses', value: JSON.stringify(list) });
  }

  async saveSession(s: Session): Promise<void> {
    this.session.set(s);
    await Preferences.set({ key: 'session', value: JSON.stringify(s) });
  }

  /** Opens the camera and returns a compressed JPEG blob plus a preview URL. */
  async takePhoto(source: 'prompt' | 'camera' = 'prompt'): Promise<{ blob: Blob; preview: string } | null> {
    try {
      const photo = await Camera.getPhoto({
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Prompt, // prompt = camera or gallery
        resultType: CameraResultType.Uri,
        quality: 70,
        width: 1600,
        correctOrientation: true,
      });
      if (!photo.webPath) return null;
      const blob = await (await fetch(photo.webPath)).blob();
      return { blob, preview: photo.webPath };
    } catch {
      return null; // user cancelled
    }
  }

  async currentPosition(): Promise<{ lat: number; long: number; accuracy: number }> {
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 20000 });
    return { lat: pos.coords.latitude, long: pos.coords.longitude, accuracy: pos.coords.accuracy };
  }
}
