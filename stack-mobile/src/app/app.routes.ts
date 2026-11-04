import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  { path: 'overview', title: 'Overview', loadComponent: () => import('./pages/overview.page').then((m) => m.OverviewPage) },
  { path: 'chambers', title: 'Chambers', loadComponent: () => import('./pages/chambers.page').then((m) => m.ChambersPage) },
  { path: 'chambers/new', title: 'New chamber', loadComponent: () => import('./pages/chamber-form.page').then((m) => m.ChamberFormPage) },
  { path: 'chambers/:id', title: 'Chamber', loadComponent: () => import('./pages/chamber-detail.page').then((m) => m.ChamberDetailPage) },
  { path: 'chambers/:id/edit', title: 'Edit chamber', loadComponent: () => import('./pages/chamber-form.page').then((m) => m.ChamberFormPage) },
  { path: 'chambers/:id/stacks/new', title: 'New stack', loadComponent: () => import('./pages/stack-form.page').then((m) => m.StackFormPage) },
  { path: 'chambers/:id/stacks/:stackId', title: 'Stack', loadComponent: () => import('./pages/stack-form.page').then((m) => m.StackFormPage) },
  { path: 'stacks', title: 'Stacks', loadComponent: () => import('./pages/stacks.page').then((m) => m.StacksPage) },
  { path: 'inspect', title: 'Inspect', loadComponent: () => import('./pages/inspection.page').then((m) => m.InspectionPage) },
  { path: '**', redirectTo: 'overview' },
];
