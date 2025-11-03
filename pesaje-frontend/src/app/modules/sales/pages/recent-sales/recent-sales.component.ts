import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Config } from 'datatables.net';
import { PERMISSION_ROUTES } from '../../../../constants/routes.constants';
import { AuthService } from '../../../auth';
import { Subscription } from 'rxjs';

import { Router } from '@angular/router';
import { SaleService } from '../../services/sale.service';
import {
  CompanySaleStatusEnum,
  ISaleModel,
  SaleTypeEnum,
} from '../../interfaces/sale.interface';
import { AlertService } from 'src/app/utils/alert.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-recent-sales',
  templateUrl: './recent-sales.component.html',
  styleUrl: './recent-sales.component.scss',
})
export class RecentSalesComponent implements OnInit, OnDestroy {
  PERMISSION_ROUTE = PERMISSION_ROUTES.SALES.RECENT_SALES;

  private unsubscribe: Subscription[] = [];

  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  isLoading = false;
  isOnlyBuyer = false;

  salesModel: ISaleModel;
  recentSales: ISaleModel[] = [];

  controlNumber = '';

  datatableConfig: Config;

  constructor(
    private authService: AuthService,
    private saleService: SaleService,
    private alertService: AlertService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.initiliazeDatatable();
    this.isOnlyBuyer = this.authService.isOnlyBuyer;
    this.loadRecentSales();

    // Subscribe to language changes and reinitialize datatable config with new translations
    const langSub = this.translate.onLangChange.subscribe(() => {
      this.initiliazeDatatable();
      this.cdr.detectChanges();
    });
    this.unsubscribe.push(langSub);
  }

  initiliazeDatatable() {
    // Preserve existing data when reinitializing (e.g., during language change)
    const currentData = this.datatableConfig?.data || [];

    // Get translated status labels
    const statusNoPayments = this.translate.instant('SALES.STATUS.NO_PAYMENTS');
    const statusInProgress = this.translate.instant('SALES.STATUS.IN_PROGRESS');
    const statusCompleted = this.translate.instant('SALES.STATUS.COMPLETED');
    const statusClosed = this.translate.instant('SALES.STATUS.CLOSED');
    const statusUnknown = this.translate.instant('SALES.STATUS.UNKNOWN');

    // Get translated sale types
    const typeCompany = this.translate.instant('SALES.TYPE.COMPANY');
    const typeLocal = this.translate.instant('SALES.TYPE.LOCAL');

    // Get translated invoice options
    const invoiceYes = this.translate.instant('PURCHASES.OPTIONS.YES');
    const invoiceNo = this.translate.instant('PURCHASES.OPTIONS.NO');
    const invoiceNotApplicable = this.translate.instant('PURCHASES.OPTIONS.NOT_APPLICABLE');

    this.datatableConfig = {
      serverSide: false,
      paging: true,
      pageLength: 10,
      data: currentData,
      order: [[1, 'asc']],
      columns: [
        {
          title: this.translate.instant('SALES.RECENT_SALES.TABLE.CONTROL_NUMBER'),
          data: 'controlNumber',
          render: function (data) {
            return data ? data : '-';
          },
        },
        {
          title: this.translate.instant('SALES.RECENT_SALES.TABLE.STATUS'),
          data: 'status',
          render: function (data, type: any, full: any) {
            if (type === 'sort') {
              if (data === CompanySaleStatusEnum.CREATED) return 1; // No payments
              if (data === null) return 2; // Empty / No status
              if (data === CompanySaleStatusEnum.IN_PROGRESS) return 3; // Pending
              if (data === CompanySaleStatusEnum.COMPLETED) return 4; // Paid
              if (data === CompanySaleStatusEnum.CLOSED) return 5; // Closed
              return 6; // Unknown
            } else {
              switch (data) {
                case CompanySaleStatusEnum.CREATED:
                  return `<span class="badge bg-secondary">${statusNoPayments}</span>`;
                case CompanySaleStatusEnum.IN_PROGRESS:
                  return `<span class="badge bg-warning text-dark">${statusInProgress}</span>`;
                case CompanySaleStatusEnum.COMPLETED:
                  return `<span class="badge bg-success">${statusCompleted}</span>`;
                case CompanySaleStatusEnum.CLOSED:
                  return `<span class="badge bg-danger">${statusClosed}</span>`;
                default:
                  if (full.type === SaleTypeEnum.COMPANY) {
                    return `<span class="badge bg-light text-dark">${statusUnknown}</span>`;
                  }
              }
              return '-';
            }
          },
        },
        {
          title: this.translate.instant('SALES.RECENT_SALES.TABLE.TYPE'),
          data: 'type',
          render: function (data) {
            if (!data) return '-';

            if (data === SaleTypeEnum.COMPANY) return typeCompany;

            return typeLocal;
          },
        },
        {
          title: this.translate.instant('SALES.RECENT_SALES.TABLE.COMPANY'),
          data: 'company.name',
          render: function (data, type, full) {
            if (!full.isCompanySale) {
              // For local sales, show "Local - CompanyName"
              const localCompanyName = full.company?.name || '';
              const sellCompanyName = full.localSellCompany?.name || '';

              if (localCompanyName && sellCompanyName) {
                return `${localCompanyName} - ${sellCompanyName}`;
              } else if (localCompanyName) {
                return localCompanyName;
              } else if (sellCompanyName) {
                return sellCompanyName;
              }
              return '-';
            }

            // For company sales, show the company name
            return data || '-';
          },
        },
        {
          title: this.translate.instant('SALES.RECENT_SALES.TABLE.SALE_DATE'),
          data: 'saleDate',
          render: function (data) {
            if (!data) return '-';
            const date = new Date(data);
            return date.toLocaleDateString('es-ES');
          },
        },
        {
          title: this.translate.instant('SALES.RECENT_SALES.TABLE.TOTAL'),
          data: 'total',
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
          title: this.translate.instant('SALES.RECENT_SALES.TABLE.TOTAL_PAID'),
          data: 'totalPaid',
          render: function (data) {
            if (!data || data === 0) return '-';

            const formatted = new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(data);

            return `$${formatted}`;
          },
        },
        {
          title: this.translate.instant('SALES.RECENT_SALES.TABLE.PAID_PERCENTAGE'),
          data: 'paidPercentage',
          render: function (data, type, full) {
            if (!data || data === 0 || full.type === SaleTypeEnum.LOCAL)
              return '-';

            const formatted = new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(data);

            return `${formatted}%`;
          },
        },
        {
          title: this.translate.instant('SALES.RECENT_SALES.TABLE.BUYER'),
          data: 'buyer.fullName',
          render: function (data) {
            return data ? data : '-';
          },
        },
        {
          title: this.translate.instant('SALES.RECENT_SALES.TABLE.CLIENT'),
          data: 'client.fullName',
          render: function (data) {
            return data ? data : '-';
          },
        },
        {
          title: this.translate.instant('SALES.RECENT_SALES.TABLE.HAS_INVOICE'),
          data: 'hasInvoice',
          render: function (data) {
            return data === 'yes' ? invoiceYes : data === 'no' ? invoiceNo : invoiceNotApplicable;
          },
        },
        {
          title: this.translate.instant('SALES.RECENT_SALES.TABLE.INVOICE_NUMBER'),
          data: 'invoiceNumber',
          render: function (data) {
            return data ? data : '-';
          },
        },
        {
          title: this.translate.instant('SALES.RECENT_SALES.TABLE.INVOICE_NAME'),
          data: 'invoiceName',
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

  loadRecentSales() {
    const userId: string | null = this.isOnlyBuyer
      ? this.authService.currentUserValue?.id ?? null
      : null;

    const salesSub = this.saleService
      .getSalesByParams(
        false,
        userId,
        this.controlNumber ? this.controlNumber : null
      )
      .subscribe({
        next: (sales: ISaleModel[]) => {
          this.recentSales = sales;
          this.datatableConfig = {
            ...this.datatableConfig,
            data: [...this.recentSales],
          };
          this.reloadEvent.emit(true);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching sales:', error);
        },
      });
    this.unsubscribe.push(salesSub);
  }

  edit(id: string) {
    const foundItem = this.recentSales.find((item) => item.id === id);
    this.salesModel = foundItem ? { ...foundItem } : ({} as ISaleModel);

    if (this.salesModel.type === SaleTypeEnum.COMPANY) {
      this.router.navigate(['sales', 'company', id]);
    } else {
      this.router.navigate(['sales', 'local', id]);
    }
  }

  delete(id: string): void {
    const deleteSub = this.saleService.deleteSale(id).subscribe({
      next: () => {
        this.recentSales = this.recentSales.filter((item) => item.id !== id);
        this.datatableConfig = {
          ...this.datatableConfig,
          data: [...this.recentSales],
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

    this.loadRecentSales();
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
    this.reloadEvent.unsubscribe();
  }
}
