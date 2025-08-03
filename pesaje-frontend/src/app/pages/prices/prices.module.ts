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
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { MaterialModule } from 'src/app/material.module';
import { SizePriceComponent } from 'src/app/modules/shared/components/prices/size-price/size-price.component';
import { CompanyBestPricesComponent } from 'src/app/modules/settings/companies/company-best-prices/company-best-prices.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild([
      {
        path: 'by-company',
        component: SizePriceComponent,
      },
      {
        path: 'best-prices',
        component: CompanyBestPricesComponent,
      },
      {
        path: '',
        redirectTo: 'by-company',
        pathMatch: 'full',
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
export class PricesModule {}
