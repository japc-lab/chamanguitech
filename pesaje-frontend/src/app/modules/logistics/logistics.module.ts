import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogisticsRoutingModule } from './logistics-routing.module';
import { NewLogisticsComponent } from './pages/new-logistics/new-logistics.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CrudModule } from '../crud/crud.module';
import { SharedModule } from '../shared/shared.module';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RecentLogisticsComponent } from './pages/recent-logistics/recent-logistics.component';
import { LogisticsItemsListingComponent } from './widgets/logistics-items-listing/logistics-items-listing.component';

@NgModule({
  declarations: [
    NewLogisticsComponent,
    RecentLogisticsComponent,
    LogisticsItemsListingComponent,
  ],
  imports: [
    CommonModule,
    LogisticsRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    CrudModule,
    SharedModule,
    NgbModule,
  ],
  providers: [NgbActiveModal],
})
export class LogisticsModule {}
