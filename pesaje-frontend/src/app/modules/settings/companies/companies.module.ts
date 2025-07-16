import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
import { CompaniesComponent } from './companies.component';
import { NewCompanyComponent } from './new-company/new-company.component';
import { CompanyListDetailsComponent } from './company-list-details/company-list-details.component';
import { CompanyPricesComponent } from './company-prices/company-prices.component';
import { CompanyBestPricesComponent } from './company-best-prices/company-best-prices.component';
import { PricesModule } from 'src/app/pages/prices/prices.module';

@NgModule({
  declarations: [
    CompaniesComponent,
    NewCompanyComponent,
    CompanyListDetailsComponent,
    CompanyPricesComponent,
    CompanyBestPricesComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild([
      {
        path: '',
        component: CompaniesComponent,
        children: [
          {
            path: 'new-company',
            component: NewCompanyComponent,
          },
          {
            path: 'company-list',
            component: CompanyListDetailsComponent,
          },
          {
            path: 'prices',
            component: CompanyPricesComponent,
          },
          {
            path: 'best-prices',
            component: CompanyBestPricesComponent,
          },
          { path: '', redirectTo: 'company-list', pathMatch: 'full' },
        ],
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
export class CompaniesModule {}
