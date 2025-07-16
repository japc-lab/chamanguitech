import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { RecentSalesComponent } from './pages/recent-sales/recent-sales.component';
import { NewCompanySaleComponent } from './pages/new-company-sale/new-company-sale.component';
import { NewLocalSaleComponent } from './pages/new-local-sale/new-local-sale.component';

const routes: Routes = [
  {
    path: 'company',
    component: NewCompanySaleComponent,
  },
  {
    path: 'company/:id',
    component: NewCompanySaleComponent,
  },
  {
    path: 'local',
    component: NewLocalSaleComponent,
  },
  {
    path: 'local/:id',
    component: NewLocalSaleComponent,
  },
  {
    path: 'list',
    component: RecentSalesComponent,
  },
  { path: '', redirectTo: 'new', pathMatch: 'full' },
  { path: '**', redirectTo: 'new', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SalesRoutingModule {}
