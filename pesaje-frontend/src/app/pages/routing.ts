import { Routes } from '@angular/router';

const Routing: Routes = [
  // {
  //   path: 'dashboard',
  //   loadChildren: () =>
  //     import('./dashboard/dashboard.module').then((m) => m.DashboardModule),
  // },
  // {
  //   path: 'builder',
  //   loadChildren: () =>
  //     import('./builder/builder.module').then((m) => m.BuilderModule),
  // },
  {
    path: 'personal-profile',
    loadChildren: () =>
      import('../modules/personal-profile/personal-profile.module').then(
        (m) => m.PersonalProfileModule
      ),
  },
  {
    path: 'purchases',
    loadChildren: () =>
      import('../modules/purchases/purchases.module').then(
        (m) => m.PurchasesModule
      ),
  },
  {
    path: 'logistics',
    loadChildren: () =>
      import('../modules/logistics/logistics.module').then(
        (m) => m.LogisticsModule
      ),
  },
  {
    path: 'sales',
    loadChildren: () =>
      import('../modules/sales/sales.module').then((m) => m.SalesModule),
  },
  {
    path: 'reports',
    loadChildren: () =>
      import('../modules/report/report.module').then((m) => m.ReportsModule),
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('../modules/settings/settings.module').then(
        (m) => m.SettingsModule
      ),
  },
  {
    path: 'prices',
    loadChildren: () =>
      import('./prices/prices.module').then((m) => m.PricesModule),
  },
  // {
  //   path: 'crafted/pages/profile',
  //   loadChildren: () =>
  //     import('../modules/profile/profile.module').then((m) => m.ProfileModule),
  //   // data: { layout: 'light-sidebar' },
  // },
  // {
  //   path: 'crafted/account',
  //   loadChildren: () =>
  //     import('../modules/account/account.module').then((m) => m.AccountModule),
  //   // data: { layout: 'dark-header' },
  // },
  // {
  //   path: 'crafted/pages/wizards',
  //   loadChildren: () =>
  //     import('../modules/wizards/wizards.module').then((m) => m.WizardsModule),
  //   // data: { layout: 'light-header' },
  // },
  // {
  //   path: 'crafted/widgets',
  //   loadChildren: () =>
  //     import('../modules/widgets-examples/widgets-examples.module').then(
  //       (m) => m.WidgetsExamplesModule
  //     ),
  //   // data: { layout: 'light-header' },
  // },
  // {
  //   path: 'apps/chat',
  //   loadChildren: () =>
  //     import('../modules/apps/chat/chat.module').then((m) => m.ChatModule),
  //   // data: { layout: 'light-sidebar' },
  // },
  // {
  //   path: 'apps/users',
  //   loadChildren: () => import('./user/user.module').then((m) => m.UserModule),
  // },
  // {
  //   path: 'apps/roles',
  //   loadChildren: () => import('./role/role.module').then((m) => m.RoleModule),
  // },
  // {
  //   path: 'apps/permissions',
  //   loadChildren: () =>
  //     import('./permission/permission.module').then((m) => m.PermissionModule),
  // },
  {
    path: 'clients',
    loadChildren: () =>
      import('./clients/client.module').then((m) => m.ClientModule),
  },
  {
    path: '',
    redirectTo: '/personal-profile/my-profile',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'error/404',
  },
];

export { Routing };
