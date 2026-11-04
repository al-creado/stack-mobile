# Stack Inspection — Angular + Capacitor

Mobile app for the StackApi (`https://www.indiancommodities.co.in/stackapi`).
Angular 22 (standalone components, signals) + Capacitor 8, with Android and iOS projects included.

## Setup

```bash
npm install
npm start                 # http://localhost:4200, /stackapi is proxied to the live API (no CORS issues)
```

## Run on a phone

```bash
npm run android           # build, sync, open Android Studio -> Run
npm run ios               # build, sync, open Xcode (macOS only)
npm run build:mobile      # build + sync both platforms, without opening an IDE
```

After changing any Angular code, run `npm run build:mobile` (or `ng build && npx cap sync`) before rebuilding in Android Studio / Xcode.

Live reload on a device on the same Wi-Fi: `npm run live:android`.

## Project layout

```
src/app/core/
  api.models.ts          all DTOs from swagger.json
  chambers.service.ts    Chambers, ChamberSetup, StackConfig
  stacks.service.ts      Stacks, WarehouseStacks, StackDeatils
  inspection.service.ts  StackInspection + Employee (multipart uploads)
  form-data.ts           builds ASP.NET-style FormData (Blocks[0].danda, files with names)
  device.service.ts      Camera, Geolocation, Preferences (saved warehouse/user)
  api-base.ts            relative URL in dev, absolute URL on device
  ui.service.ts          toasts + HTTP error interceptor
src/app/pages/
  chambers     home: warehouse ID box, chambers tab + all-stacks tab (totals), + to add
  chamber-form create / edit
  chamber-detail  details, GPS boundary + gate, stack grid layout, stacks list, submit, delete
  stack-form   stack name, views, WRS allocations
  inspection   inspection form, blocks, 8 camera photos -> /api/StackInspection/StackInspection
```

## Notes

- **CORS**: on the device, `CapacitorHttp` (enabled in `capacitor.config.ts`) sends requests natively, so the API does not need CORS for the app.
- **No sign-in**: the app opens on `defaultWarehouseId` from `src/environments/`. The last warehouse typed on the home screen is remembered on the device.
- **Numbering / orientation values** (`RowWise`, `ColumnWise`, `Serpentine`, `GateBottom`, …) are placeholders. Change `NUMBERING_PATTERNS` / `ORIENTATIONS` in `chamber-detail.page.ts` to whatever your backend expects.
- **Grid positions** are sent as 1-based `positionRow` / `positionCol`. Change in `chamber-detail.page.ts` if your API uses 0-based.
- **App ID** is `com.indiancommodities.stack`. Change it in `capacitor.config.ts` before the first Play Store upload (it can't be changed later).
- Endpoints with no response schema in swagger (`StackDeatils/*`, `Employee/missing-documents`) are typed as `unknown` in the services.
