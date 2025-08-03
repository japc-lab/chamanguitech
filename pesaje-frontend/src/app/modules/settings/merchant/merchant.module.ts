import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MerchantListingComponent } from './merchant-listing/merchant-listing.component';
import { RouterModule } from '@angular/router';
import { MerchantDetailsComponent } from './merchant-details/merchant-details.component';
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

@NgModule({
  declarations: [MerchantListingComponent, MerchantDetailsComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild([
      {
        path: '',
        component: MerchantListingComponent,
      },
      {
        path: ':merchantId',
        component: MerchantDetailsComponent,
      },
    ]),
    CrudModule,
    SharedModule,
    SharedModuleMetronic,
    NgbNavModule,
    NgbDropdownModule,
    NgbCollapseModule,
    NgbTooltipModule,
    SweetAlert2Module.forChild(),
  ],
})
export class MerchantModule {}
