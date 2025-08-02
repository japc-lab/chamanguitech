import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: 'users',
    loadChildren: () =>
      import('./users/users.module').then((m) => m.UsersModule),
  },
  {
    path: 'brokers',
    loadChildren: () =>
      import('../../modules/personal-profile/broker/broker.module').then(
        (m) => m.BrokerModule
      ),
  },
  {
    path: 'clients',
    loadChildren: () =>
      import('../../pages/clients/client.module').then((m) => m.ClientModule),
  },
  {
    path: 'companies',
    loadChildren: () =>
      import('./companies/companies.module').then((m) => m.CompaniesModule),
  },
  {
    path: 'assets',
    loadChildren: () =>
      import('./assets/assets.module').then((m) => m.AssetsModule),
  },
  {
    path: 'people',
    loadChildren: () =>
      import('./person-management/person-management.module').then((m) => m.PersonManagementModule),
  },
  { path: '', redirectTo: 'users', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsRoutingModule {}
