import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule as SharedModuleMetronic } from 'src/app/_metronic/shared/shared.module';
import {
  NgbCollapseModule,
  NgbDropdownModule,
  NgbNavModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { SharedModule } from '../../shared/shared.module';
import { PersonManagementComponent } from './person-management.component';

@NgModule({
  declarations: [
    PersonManagementComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild([
      {
        path: '',
        component: PersonManagementComponent,
        children: [
          {
            path: 'users',
            loadChildren: () =>
              import('../users/users.module').then((m) => m.UsersModule),
          },
          {
            path: 'brokers',
            loadChildren: () =>
              import('../../personal-profile/broker/broker.module').then(
                (m) => m.BrokerModule
              ),
          },
          {
            path: 'clients',
            loadChildren: () =>
              import('../../../pages/clients/client.module').then((m) => m.ClientModule),
          },
          {
            path: 'merchants',
            loadChildren: () =>
              import('../merchant/merchant.module').then((m) => m.MerchantModule),
          },
          { path: '', redirectTo: 'users', pathMatch: 'full' },
        ],
      },
    ]),
    SharedModule,
    SharedModuleMetronic,
    NgbNavModule,
    NgbDropdownModule,
    NgbCollapseModule,
    NgbTooltipModule,
    SweetAlert2Module.forChild(),
  ],
})
export class PersonManagementModule {}
