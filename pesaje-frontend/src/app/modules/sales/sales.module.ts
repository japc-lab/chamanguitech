import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CrudModule } from '../crud/crud.module';
import { SharedModule } from '../shared/shared.module';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SalesRoutingModule } from './sales-routing.module';
import { NewCompanySaleComponent } from './pages/new-company-sale/new-company-sale.component';
import { RecentSalesComponent } from './pages/recent-sales/recent-sales.component';
import { CompanySalePaymentListingComponent } from './widgets/company-sale-payment-listing/company-sale-payment-listing.component';
import { NewLocalSaleComponent } from './pages/new-local-sale/new-local-sale.component';
import { LocalSaleDetailComponent } from './widgets/local-sale-detail/local-sale-detail.component';
import { LocalCompanySaleDetailComponent } from './widgets/local-company-sale-detail/local-company-sale-detail.component';
import { LocalCompanySaleDetailPaymentListingComponent } from './widgets/local-company-sale-detail-payment-listing/local-company-sale-detail-payment-listing.component';
import { LocalSaleSummaryComponent } from './widgets/local-sale-summary/local-sale-summary.component';
import { CompanySaleWholeDetailComponent } from './widgets/company-sale-whole-detail/company-sale-whole-detail.component';
import { CompanySaleTailDetailComponent } from './widgets/company-sale-tail-detail/company-sale-tail-detail.component';
import { CompanySaleSummaryComponent } from './widgets/company-sale-summary/company-sale-summary.component';

@NgModule({
  declarations: [
    NewCompanySaleComponent,
    RecentSalesComponent,
    CompanySalePaymentListingComponent,
    NewLocalSaleComponent,
    LocalSaleDetailComponent,
    LocalCompanySaleDetailComponent,
    LocalCompanySaleDetailPaymentListingComponent,
    LocalSaleSummaryComponent,
    CompanySaleWholeDetailComponent,
    CompanySaleTailDetailComponent,
    CompanySaleSummaryComponent,
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
