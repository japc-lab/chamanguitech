import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyProfileComponent } from './my-profile.component';
import { PersonalProfileRoutingModule } from './personal-profile-routing.module';
import {
  CardsModule,
  DropdownMenusModule,
  WidgetsModule,
} from '../../_metronic/partials';
import { SharedModule as SharedModuleMetronic } from '../../_metronic/shared/shared.module';
import { PersonalInformationComponent } from './personal-information/personal-information.component';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { PersonalProfileDetailsComponent } from './personal-information/forms/profile-details/personal-profile-details.component';
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

@NgModule({
  declarations: [
    MyProfileComponent,
    PersonalInformationComponent,
    PersonalProfileDetailsComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    PersonalProfileRoutingModule,
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
export class PersonalProfileModule {}
