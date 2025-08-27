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
import {
  IReadLogisticsModel,
  LogisticsStatusEnum,
} from '../../interfaces/logistics.interface';
import { LogisticsService } from '../../services/logistics.service';
import { AlertService } from 'src/app/utils/alert.service';
import { PurchaseStatusEnum } from 'src/app/modules/purchases/interfaces/purchase.interface';

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
    order: [[1, 'asc']],
    columns: [
      {
        title: 'Numero de Control',
        data: 'controlNumber',
        render: function (data) {
          return data ? data : '-';
        },
      },
      {
        title: 'Estado',
        data: 'status',
        render: function (data: LogisticsStatusEnum, type: any) {
          if (type === 'sort') {
            switch (data) {
              case LogisticsStatusEnum.DRAFT:
                return 1; // Borrador
              case LogisticsStatusEnum.CREATED:
                return 2; // Sin pagos
              case LogisticsStatusEnum.IN_PROGRESS:
                return 3; // En progreso
              case LogisticsStatusEnum.COMPLETED:
                return 4; // Pago Completo
              case LogisticsStatusEnum.CONFIRMED:
                return 5; // Información Completa
              case LogisticsStatusEnum.CLOSED:
                return 6; // Cerrado
              default:
                return 99;
            }
          } else {
            switch (data) {
              case LogisticsStatusEnum.DRAFT:
                return `<span class="badge bg-secondary">Borrador</span>`;
              case LogisticsStatusEnum.CREATED:
                return `<span class="badge bg-info text-light">Sin pagos</span>`;
              case LogisticsStatusEnum.IN_PROGRESS:
                return `<span class="badge bg-warning text-dark">En progreso</span>`;
              case LogisticsStatusEnum.COMPLETED:
                return `<span class="badge bg-success">Pago Completo</span>`;
              case LogisticsStatusEnum.CONFIRMED:
                return `<span class="badge bg-primary text-light">Información Completa</span>`;
              case LogisticsStatusEnum.CLOSED:
                return `<span class="badge bg-danger">Cerrado</span>`;
              default:
                return `<span class="badge bg-light text-dark">Desconocido</span>`;
            }
          }
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
        title: 'Total General',
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

  shouldShowConfirmAction = (row: IReadLogisticsModel): boolean => {
    return (
      row?.status !== LogisticsStatusEnum.CONFIRMED &&
      row?.status !== LogisticsStatusEnum.CLOSED
    );
  };

  confirmLogistics(id: string) {
    this.alertService
      .confirmTranslated({
        titleKey: 'MESSAGES.CONFIRM_TITLE',
        messageKey: 'MESSAGES.CONFIRM_STATUS_TEXT',
        confirmKey: 'BUTTONS.CONFIRM',
        cancelKey: 'BUTTONS.CANCEL',
        icon: 'warning',
      })
      .then((result) => {
        if (!result.isConfirmed) return;
        this.isLoading = true;
        const sub = this.logisticsService
          .updateLogistics(id, { status: LogisticsStatusEnum.CONFIRMED })
          .subscribe({
            next: () => this.loadRecentLogistics(),
            error: () =>
              this.alertService.showTranslatedAlert({ alertType: 'error' }),
            complete: () => (this.isLoading = false),
          });
        this.unsubscribe.push(sub);
      });
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
