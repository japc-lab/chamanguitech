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
import { TranslateService } from '@ngx-translate/core';

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

  datatableConfig: Config = {} as Config;

  constructor(
    private authService: AuthService,
    private logisticsService: LogisticsService,
    private alertService: AlertService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.initializeDatatableConfig();

    // Subscribe to language changes and reinitialize datatable config with new translations
    const langSub = this.translate.onLangChange.subscribe(() => {
      this.initializeDatatableConfig();
      this.cdr.detectChanges();
    });
    this.unsubscribe.push(langSub);

    this.isOnlyBuyer = this.authService.isOnlyBuyer;
    this.loadRecentLogistics();
  }

  // 🔹 Initialize DataTable Configuration with Translations
  initializeDatatableConfig(): void {
    // Preserve existing data when reinitializing (e.g., during language change)
    const currentData = this.datatableConfig?.data || [];
    const translate = this.translate;

    this.datatableConfig = {
      serverSide: false,
      paging: true,
      pageLength: 10,
      data: currentData,
      order: [[1, 'asc']],
      columns: [
        {
          title: this.translate.instant(
            'LOGISTICS.RECENT_LOGISTICS.TABLE.CONTROL_NUMBER'
          ),
          data: 'controlNumber',
          render: function (data) {
            return data ? data : '-';
          },
        },
        {
          title: this.translate.instant(
            'LOGISTICS.RECENT_LOGISTICS.TABLE.STATUS'
          ),
          data: 'status',
          render: function (data: LogisticsStatusEnum, type: any) {
            if (type === 'sort') {
              switch (data) {
                case LogisticsStatusEnum.DRAFT:
                  return 1;
                case LogisticsStatusEnum.CREATED:
                  return 2;
                case LogisticsStatusEnum.IN_PROGRESS:
                  return 3;
                case LogisticsStatusEnum.COMPLETED:
                  return 4;
                case LogisticsStatusEnum.CONFIRMED:
                  return 5;
                case LogisticsStatusEnum.CLOSED:
                  return 6;
                default:
                  return 99;
              }
            } else {
              switch (data) {
                case LogisticsStatusEnum.DRAFT:
                  return `<span class="badge bg-secondary">${translate.instant('LOGISTICS.STATUS.DRAFT')}</span>`;
                case LogisticsStatusEnum.CREATED:
                  return `<span class="badge bg-info text-light">${translate.instant('LOGISTICS.STATUS.NO_PAYMENTS')}</span>`;
                case LogisticsStatusEnum.IN_PROGRESS:
                  return `<span class="badge bg-warning text-dark">${translate.instant('LOGISTICS.STATUS.IN_PROGRESS')}</span>`;
                case LogisticsStatusEnum.COMPLETED:
                  return `<span class="badge bg-success">${translate.instant('LOGISTICS.STATUS.PAYMENT_COMPLETE')}</span>`;
                case LogisticsStatusEnum.CONFIRMED:
                  return `<span class="badge bg-primary text-light">${translate.instant('LOGISTICS.STATUS.INFORMATION_COMPLETE')}</span>`;
                case LogisticsStatusEnum.CLOSED:
                  return `<span class="badge bg-danger">${translate.instant('LOGISTICS.STATUS.CLOSED')}</span>`;
                default:
                  return `<span class="badge bg-light text-dark">${translate.instant('LOGISTICS.STATUS.UNKNOWN')}</span>`;
              }
            }
          },
        },
        {
          title: this.translate.instant('LOGISTICS.RECENT_LOGISTICS.TABLE.TYPE'),
          data: 'description',
          render: function (data) {
            return data ? data : '-';
          },
        },
        {
          title: this.translate.instant(
            'LOGISTICS.RECENT_LOGISTICS.TABLE.LOGISTICS_DATE'
          ),
          data: 'logisticsDate',
          render: function (data) {
            if (!data) return '-';
            const date = new Date(data);
            return date.toLocaleDateString('es-ES');
          },
        },
        {
          title: this.translate.instant(
            'LOGISTICS.RECENT_LOGISTICS.TABLE.TOTAL_POUNDS'
          ),
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
          title: this.translate.instant(
            'LOGISTICS.RECENT_LOGISTICS.TABLE.GRAND_TOTAL'
          ),
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
          title: this.translate.instant(
            'LOGISTICS.RECENT_LOGISTICS.TABLE.PRICE_PER_POUND'
          ),
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
          title: this.translate.instant(
            'LOGISTICS.RECENT_LOGISTICS.TABLE.BUYER'
          ),
          data: 'buyer.fullName',
          render: function (data) {
            return data ? data : '-';
          },
        },
        {
          title: this.translate.instant(
            'LOGISTICS.RECENT_LOGISTICS.TABLE.CLIENT'
          ),
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
