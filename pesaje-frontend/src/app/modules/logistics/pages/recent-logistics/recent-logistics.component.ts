import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
} from '@angular/core';
import { Config } from 'datatables.net';
import { PERMISSION_ROUTES } from '../../../../constants/routes.constants';
import { AuthService } from '../../../auth';
import { Subscription } from 'rxjs';

import { Router } from '@angular/router';
import { IReadLogisticsModel } from '../../interfaces/logistics.interface';
import { LogisticsService } from '../../services/logistics.service';
import { AlertService } from 'src/app/utils/alert.service';

@Component({
  selector: 'app-recent-logistics',
  templateUrl: './recent-logistics.component.html',
  styleUrl: './recent-logistics.component.scss',
})
export class RecentLogisticsComponent implements OnInit {
  PERMISSION_ROUTE = PERMISSION_ROUTES.LOGISTICS.RECENT_LOGISTICS;

  private unsubscribe: Subscription[] = [];

  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  isLoading = false;
  isOnlyBuyer = false;
  recentLogistics: IReadLogisticsModel[] = [];

  controlNumber = '';

  datatableConfig: Config = {
    serverSide: false,
    paging: true,
    pageLength: 10,
    data: [],
    columns: [
      {
        title: 'Numero de Control',
        data: 'controlNumber',
        render: function (data) {
          return data ? data : '-';
        },
      },
      {
        title: 'Tipo',
        data: 'description',
        render: function (data) {
          return data ? data : '-';
        },
      },
      {
        title: 'Fecha de Logística',
        data: 'logisticsDate',
        render: function (data) {
          if (!data) return '-';
          const date = new Date(data);
          return date.toLocaleDateString('es-ES');
        },
      },
      {
        title: 'Total Libras (lb)',
        data: 'totalPounds',
        render: function (data) {
          if (!data && data !== 0) return '-';

          const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(data);

          return `${formatted}`;
        },
      },
      {
        title: 'Total',
        data: 'grandTotal',
        render: function (data) {
          if (!data && data !== 0) return '-';

          const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(data);

          return `$${formatted}`;
        },
      },
      {
        title: 'Precio por Libra ($/lb)',
        data: 'grandTotal',
        render: function (data, type, full) {
          if (!data && data !== 0) return '-';

          const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4,
          }).format(data / full.totalPounds);

          return `$${formatted}`;
        },
      },
      {
        title: 'Comprador',
        data: 'buyer.fullName',
        render: function (data) {
          return data ? data : '-';
        },
      },
      {
        title: 'Cliente',
        data: 'client.fullName',
        render: function (data) {
          return data ? data : '-';
        },
      },
    ],
    language: {
      url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json',
    },
    createdRow: function (row, data, dataIndex) {
      $('td:eq(0)', row).addClass('d-flex align-items-center');
    },
  };

  constructor(
    private authService: AuthService,
    private logisticsService: LogisticsService,
    private alertService: AlertService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isOnlyBuyer = this.authService.isOnlyBuyer;
    this.loadRecentLogistics();
  }

  loadRecentLogistics() {
    const userId: string | null = this.isOnlyBuyer
      ? this.authService.currentUserValue?.id ?? null
      : null;

    const logisticsSub = this.logisticsService
      .getLogisticsByParams(
        false,
        userId,
        this.controlNumber ? this.controlNumber : null
      )
      .subscribe({
        next: (logistics: IReadLogisticsModel[]) => {
          this.recentLogistics = logistics;
          this.datatableConfig = {
            ...this.datatableConfig,
            data: [...this.recentLogistics],
          };
          this.reloadEvent.emit(true);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching logistics:', error);
        },
      });
    this.unsubscribe.push(logisticsSub);
  }

  edit(id: string) {
    this.router.navigate(['logistics', 'form', id]);
  }

  delete(id: string): void {
    const deleteSub = this.logisticsService.deleteLogistics(id).subscribe({
      next: () => {
        this.recentLogistics = this.recentLogistics.filter(
          (item) => item.id !== id
        );
        this.datatableConfig = {
          ...this.datatableConfig,
          data: [...this.recentLogistics],
        };
        this.reloadEvent.emit(true);
        this.cdr.detectChanges();
      },
      error: () => {
        this.alertService.showTranslatedAlert({ alertType: 'error' });
      },
    });
    this.unsubscribe.push(deleteSub);
  }

  clearFilters() {
    this.controlNumber = '';

    this.loadRecentLogistics();
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
    this.reloadEvent.unsubscribe();
  }
}
