import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CrudModule } from '../crud/crud.module';
import { SharedModule } from '../shared/shared.module';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SalesRoutingModule } from './sales-routing.module';
import { NewCompanySaleComponent } from './pages/new-company-sale/new-company-sale.component';
import { CompanySaleItemsListingComponent } from './widgets/company-sale-items-listing/company-sale-items-listing.component';
import { RecentSalesComponent } from './pages/recent-sales/recent-sales.component';
import { CompanySalePaymentListingComponent } from './widgets/company-sale-payment-listing/company-sale-payment-listing.component';
import { NewLocalSaleComponent } from './pages/new-local-sale/new-local-sale.component';
import { LocalSaleDetailsComponent } from './widgets/local-sale-details/local-sale-details.component';

@NgModule({
  declarations: [
    NewCompanySaleComponent,
    RecentSalesComponent,
    CompanySaleItemsListingComponent,
    CompanySalePaymentListingComponent,
    NewLocalSaleComponent,
    LocalSaleDetailsComponent,
  ],
  imports: [
    CommonModule,
    SalesRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    CrudModule,
    SharedModule,
    NgbModule,
  ],
  providers: [NgbActiveModal],
})
export class SalesModule {}
