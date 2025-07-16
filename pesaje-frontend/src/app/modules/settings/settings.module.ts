import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CardsModule,
  DropdownMenusModule,
  WidgetsModule,
} from '../../_metronic/partials';
import { SharedModule as SharedModuleMetronic } from '../../_metronic/shared/shared.module';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { AccountModule } from '../account/account.module';
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
import { SettingsRoutingModule } from './settings-routing.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    SharedModule,
    SettingsRoutingModule,
    InlineSVGModule,
    DropdownMenusModule,
    WidgetsModule,
    CardsModule,
    SharedModuleMetronic,
    AccountModule,
    FormsModule,
    CrudModule,
    SweetAlert2Module.forChild(),
    NgbNavModule,
    NgbDropdownModule,
    NgbCollapseModule,
    NgbTooltipModule,
  ],
})
export class SettingsModule {}
