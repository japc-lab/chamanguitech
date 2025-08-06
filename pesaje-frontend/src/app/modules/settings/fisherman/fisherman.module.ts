import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FishermanListingComponent } from './fisherman-listing/fisherman-listing.component';
import { RouterModule } from '@angular/router';
import { FishermanDetailsComponent } from './fisherman-details/fisherman-details.component';
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
  declarations: [FishermanListingComponent, FishermanDetailsComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild([
      {
        path: '',
        component: FishermanListingComponent,
      },
      {
        path: ':fishermanId',
        component: FishermanDetailsComponent,
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
export class FishermanModule {}
