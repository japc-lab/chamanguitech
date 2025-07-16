import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrokerListingComponent } from './broker-listing/broker-listing.component';
import { RouterModule } from '@angular/router';
import { BrokerDetailsComponent } from './broker-details/broker-details.component';
import { CrudModule } from 'src/app/modules/crud/crud.module';
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
import { MaterialModule } from 'src/app/material.module';

@NgModule({
  declarations: [BrokerListingComponent, BrokerDetailsComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild([
      {
        path: '',
        component: BrokerListingComponent,
      },
      {
        path: ':brokerId',
        component: BrokerDetailsComponent,
      },
    ]),
    CrudModule,
    SharedModule,
    SharedModuleMetronic,
    NgbNavModule,
    NgbDropdownModule,
    NgbCollapseModule,
    NgbTooltipModule,
    MaterialModule,
    SweetAlert2Module.forChild(),
  ],
})
export class BrokerModule {}
