import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanEditDirective } from '../../directives/can-edit.directive';
import { CanCreateDirective } from '../../directives/can-create.directive';
import { CanDeleteDirective } from '../../directives/can-delete.directive';
import { CanReadDirective } from 'src/app/directives/can-read.directive';
import { CrudModule } from '../crud/crud.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PaymentInformationComponent } from './components/profile/payment-information/payment-information.component';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { SharedModule as SharedModuleMetronic } from 'src/app/_metronic/shared/shared.module';
import { WholeTableComponent } from './components/prices/whole-table/whole-table.component';
import { HeadlessTableComponent } from './components/prices/headless-table/headless-table.component';
import { ShrimpFarmInformationComponent } from './components/clients/shrimp-farm/shrimp-farm-information.component';
import { MaterialModule } from 'src/app/material.module';
import { ResidualTableComponent } from './components/prices/residual-table/residual-table.component';
import { BestPricesTableComponent } from './components/prices/best-prices-table/best-prices-table.component';
import { SizePriceComponent } from './components/prices/size-price/size-price.component';

@NgModule({
  declarations: [
    PaymentInformationComponent,
    WholeTableComponent,
    HeadlessTableComponent,
    ResidualTableComponent,
    CanEditDirective,
    CanCreateDirective,
    CanDeleteDirective,
    CanReadDirective,
    ShrimpFarmInformationComponent,
    SizePriceComponent,
    BestPricesTableComponent,
  ],
  imports: [
    CommonModule,
    CrudModule,
    FormsModule,
    MaterialModule,
    ReactiveFormsModule,
    SharedModuleMetronic,
    SweetAlert2Module.forChild(),
  ],
  exports: [
    PaymentInformationComponent,
    WholeTableComponent,
    HeadlessTableComponent,
    ResidualTableComponent,
    CanEditDirective,
    CanCreateDirective,
    CanDeleteDirective,
    CanReadDirective,
    ShrimpFarmInformationComponent,
    SizePriceComponent,
    BestPricesTableComponent,
  ], // ✅ Export so all modules can use them
})
export class SharedModule {}
