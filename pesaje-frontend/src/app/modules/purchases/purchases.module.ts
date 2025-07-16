import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule as SharedModuleMetronic } from '../../_metronic/shared/shared.module';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { FormsModule } from '@angular/forms';
import { CrudModule } from 'src/app/modules/crud/crud.module';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import {
  NgbCollapseModule,
  NgbDropdownModule,
  NgbNavModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from '../shared/shared.module';
import { PurchasesRoutingModule } from './purchases-routing.module';
import { NewPurchaseComponent } from './new-purchase/new-purchase.component';
import { MaterialModule } from 'src/app/material.module';
import { PurchasePaymentListingComponent } from './purchase-payment-listing/purchase-payment-listing.component';
import { RecentPurchasesComponent } from './recent-purchases/recent-purchases.component';

@NgModule({
  declarations: [
    NewPurchaseComponent,
    PurchasePaymentListingComponent,
    RecentPurchasesComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    PurchasesRoutingModule,
    InlineSVGModule,
    SharedModuleMetronic,
    FormsModule,
    CrudModule,
    SweetAlert2Module.forChild(),
    MaterialModule,
    NgbNavModule,
    NgbDropdownModule,
    NgbCollapseModule,
    NgbTooltipModule,
  ],
})
export class PurchasesModule {}
