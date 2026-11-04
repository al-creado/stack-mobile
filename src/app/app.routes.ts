import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'monitoring' },

  // Stock monitoring (auditor flow): list -> details sheet -> photos -> preview -> result -> review.
  {
    path: 'monitoring',
    children: [
      { path: '', title: 'Stock monitoring', loadComponent: () => import('./monitoring/monitoring-list.page').then((m) => m.MonitoringListPage) },
      { path: 'review', title: 'Review and submit', loadComponent: () => import('./monitoring/monitoring-review.page').then((m) => m.MonitoringReviewPage) },
      { path: 'stack/:stackId/photos', title: 'Stack photos', loadComponent: () => import('./monitoring/stack-photos.page').then((m) => m.StackPhotosPage) },
      { path: 'stack/:stackId/preview', title: 'Stack preview', loadComponent: () => import('./monitoring/stack-preview.page').then((m) => m.StackPreviewPage) },
      { path: 'stack/:stackId/result', title: 'Stack result', loadComponent: () => import('./monitoring/stack-result.page').then((m) => m.StackResultPage) },
    ],
  },

  // Warehouse management (chambers, stack layout, one-off inspection) inside the sidebar / tab-bar shell.
  {
    path: '',
    loadComponent: () => import('./shell').then((m) => m.Shell),
    children: [
      { path: 'overview', title: 'Overview', loadComponent: () => import('./pages/overview.page').then((m) => m.OverviewPage) },
      { path: 'chambers', title: 'Chambers', loadComponent: () => import('./pages/chambers.page').then((m) => m.ChambersPage) },
      { path: 'chambers/new', title: 'New chamber', loadComponent: () => import('./pages/chamber-form.page').then((m) => m.ChamberFormPage) },
      { path: 'chambers/:id', title: 'Chamber', loadComponent: () => import('./pages/chamber-detail.page').then((m) => m.ChamberDetailPage) },
      { path: 'chambers/:id/edit', title: 'Edit chamber', loadComponent: () => import('./pages/chamber-form.page').then((m) => m.ChamberFormPage) },
      { path: 'chambers/:id/stacks/new', title: 'New stack', loadComponent: () => import('./pages/stack-form.page').then((m) => m.StackFormPage) },
      { path: 'chambers/:id/stacks/:stackId', title: 'Stack', loadComponent: () => import('./pages/stack-form.page').then((m) => m.StackFormPage) },
      { path: 'stacks', title: 'Stacks', loadComponent: () => import('./pages/stacks.page').then((m) => m.StacksPage) },
      { path: 'inspect', title: 'Inspect', loadComponent: () => import('./pages/inspection.page').then((m) => m.InspectionPage) },
    ],
  },

  { path: '**', redirectTo: 'monitoring' },
];
