import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { RecentLogisticsComponent } from './pages/recent-logistics/recent-logistics.component';
import { NewLogisticsComponent } from './pages/new-logistics/new-logistics.component';

const routes: Routes = [
  {
    path: 'form',
    component: NewLogisticsComponent,
  },
  {
    path: 'form/:id',
    component: NewLogisticsComponent,
  },
  {
    path: 'list',
    component: RecentLogisticsComponent,
  },
  { path: '', redirectTo: 'new', pathMatch: 'full' },
  { path: '**', redirectTo: 'new', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LogisticsRoutingModule {}
