import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CrudModule } from '../crud/crud.module';
import { SharedModule } from '../shared/shared.module';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { EconomicReportComponent } from './pages/economic-report/economic-report.component';
import { ReportRoutingModule } from './report-routing.module';
import { TotalReportComponent } from './pages/total-report/total-report.component';

@NgModule({
  declarations: [EconomicReportComponent, TotalReportComponent],
  imports: [
    CommonModule,
    ReportRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    CrudModule,
    SharedModule,
    NgbModule,
  ],
  providers: [NgbActiveModal],
})
export class ReportsModule {}
