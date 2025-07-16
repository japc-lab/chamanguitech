import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NewPurchaseComponent } from './new-purchase/new-purchase.component';
import { RecentPurchasesComponent } from './recent-purchases/recent-purchases.component';

const routes: Routes = [
  {
    path: 'form',
    component: NewPurchaseComponent,
  },
  {
    path: 'form/:id',
    component: NewPurchaseComponent,
  },
  {
    path: 'list',
    component: RecentPurchasesComponent,
  },
  { path: '', redirectTo: 'new', pathMatch: 'full' },
  { path: '**', redirectTo: 'new', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PurchasesRoutingModule {}
