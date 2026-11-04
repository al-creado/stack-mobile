import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { TimeoutError, catchError, throwError, timeout } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UiService {
  readonly toast = signal<{ text: string; kind: 'ok' | 'error' } | null>(null);
  /** Warehouse picker sheet (rendered once in the app shell). */
  readonly pickerOpen = signal(false);
  private timer?: ReturnType<typeof setTimeout>;

  show(text: string, kind: 'ok' | 'error' = 'ok'): void {
    clearTimeout(this.timer);
    this.toast.set({ text, kind });
    this.timer = setTimeout(() => this.toast.set(null), 3500);
  }
}

/** Reads give up after 20s; uploads (photos) get longer. Without a limit a dead connection spins forever. */
const READ_TIMEOUT_MS = 20_000;
const WRITE_TIMEOUT_MS = 120_000;

/** Shows a toast for any failed API call, then rethrows so callers can stop spinners. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const ui = inject(UiService);
  return next(req).pipe(
    timeout(req.method === 'GET' ? READ_TIMEOUT_MS : WRITE_TIMEOUT_MS),
    catchError((err: HttpErrorResponse | TimeoutError) => {
      if (err instanceof TimeoutError) {
        ui.show('The server is taking too long to respond', 'error');
        return throwError(() => err);
      }
      const msg =
        err.status === 0
          ? 'No connection to server'
          : typeof err.error === 'string' && err.error.length < 200
            ? err.error
            : (err.error?.title ?? err.error?.message ?? `Request failed (${err.status})`);
      ui.show(msg, 'error');
      return throwError(() => err);
    }),
  );
};
