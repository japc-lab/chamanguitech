import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
} from '@angular/core';
import { Config } from 'datatables.net';
import { PERMISSION_ROUTES } from '../../../constants/routes.constants';
import { AuthService } from '../../auth';
import { PurchaseService } from '../services/purchase.service';
import { distinctUntilChanged, Subscription } from 'rxjs';
import {
  IReducedDetailedPurchaseModel,
  PurchaseStatusEnum,
} from '../interfaces/purchase.interface';
import { Router } from '@angular/router';
import { IPurchasePaymentModel } from '../../shared/interfaces/purchase-payment.interface';
import { PeriodService } from '../../shared/services/period.service';
import { IReadPeriodModel } from '../../shared/interfaces/period.interface';
import { IReadClientModel } from '../../shared/interfaces/client.interface';
import { ClientService } from '../../shared/services/client.service';
import { AlertService } from 'src/app/utils/alert.service';
import { ICompany } from '../../settings/interfaces/company.interfaces';
import { CompanyService } from '../../settings/services/company.service';

@Component({
  selector: 'app-recent-purchases',
  templateUrl: './recent-purchases.component.html',
  styleUrl: './recent-purchases.component.scss',
})
export class RecentPurchasesComponent implements OnInit {
  PERMISSION_ROUTE = PERMISSION_ROUTES.PURCHASES.RECENT_PRUCHASES;

  private unsubscribe: Subscription[] = [];

  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  isLoading = false;
  isOnlyBuyer = false;
  recentPurchases: IReducedDetailedPurchaseModel[] = [];

  companies: ICompany[] = [];
  existingPeriods: IReadPeriodModel[] = [];
  clients: IReadClientModel[] = [];
  selectedPeriod = '';
  selectedCompany = '';
  selectedClient = '';
  controlNumber = '';

  datatableConfig: Config;

  constructor(
    private authService: AuthService,
    private purchaseService: PurchaseService,
    private companyService: CompanyService,
    private periodService: PeriodService,
    private clientService: ClientService,
    private alertService: AlertService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initiliazeDatatable();
    this.isOnlyBuyer = this.authService.isOnlyBuyer;
    this.loadCompanies();
    this.loadClients();
    this.loadRecentPurchases();
  }

  initiliazeDatatable() {
    this.datatableConfig = {
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
          render: function (data: PurchaseStatusEnum, type: any) {
            if (type === 'sort') {
              switch (data) {
                case PurchaseStatusEnum.DRAFT:
                  return 1; // Borrador
                case PurchaseStatusEnum.CREATED:
                  return 2; // Sin pagos
                case PurchaseStatusEnum.IN_PROGRESS:
                  return 3; // En progreso
                case PurchaseStatusEnum.COMPLETED:
                  return 4; // Pago Completo
                case PurchaseStatusEnum.CONFIRMED:
                  return 5; // Información Completa
                case PurchaseStatusEnum.CLOSED:
                  return 6; // Cerrado
                default:
                  return 99;
              }
            } else {
              switch (data) {
                case PurchaseStatusEnum.DRAFT:
                  return `<span class="badge bg-secondary">Borrador</span>`;
                case PurchaseStatusEnum.CREATED:
                  return `<span class="badge bg-info text-light">Sin pagos</span>`;
                case PurchaseStatusEnum.IN_PROGRESS:
                  return `<span class="badge bg-warning text-dark">En progreso</span>`;
                case PurchaseStatusEnum.COMPLETED:
                  return `<span class="badge bg-success">Pago Completo</span>`;
                case PurchaseStatusEnum.CONFIRMED:
                  return `<span class="badge bg-primary text-light">Información Completa</span>`;
                case PurchaseStatusEnum.CLOSED:
                  return `<span class="badge bg-danger">Cerrado</span>`;
                default:
                  return `<span class="badge bg-light text-dark">Desconocido</span>`;
              }
            }
          },
        },
        {
          title: 'Fecha de Compra',
          data: 'purchaseDate',
          render: function (data) {
            if (!data) return '-';
            const date = new Date(data);
            return date.toLocaleDateString('es-ES');
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
          title: 'Total Acordado',
          data: 'totalAgreedToPay',
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
          title: 'Total Abonado',
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
        {
          title: 'Compañía',
          data: 'company.name',
          render: function (data, type, full) {
            if (full.localSellCompany) {
              return data ? data + ' - ' + full.localSellCompany.name : '-';
            }
            return data ? data : '-';
          },
        },
        {
          title: 'Período',
          data: 'period.name',
          render: function (data) {
            return data ? data : '-';
          },
        },
        // Add Nombre de Cuenta Bancaria
        // Has to be from the payment with the highest amount payed.
        // Leave empty if the highest amount payer doesn't have name and if no payments have been made.
        {
          title: 'Nombre de Cuenta Bancaria',
          data: 'payments',
          render: function (data, type, full) {
            const payments: IPurchasePaymentModel[] = Array.isArray(
              full?.payments
            )
              ? (full.payments as IPurchasePaymentModel[])
              : [];
            if (payments.length === 0) {
              return type === 'sort' ? 0 : '-';
            }

            // Find the payment with the highest amount
            const topPayment = payments.reduce(
              (max: IPurchasePaymentModel, curr: IPurchasePaymentModel) =>
                (curr?.amount ?? 0) > (max?.amount ?? 0) ? curr : max,
              payments[0]
            );

            if (type === 'sort') {
              return topPayment?.amount ?? 0;
            }

            const accountName = topPayment?.accountName?.trim();
            return accountName ? accountName : '-';
          },
        },
        {
          title: '¿Factura recibida?',
          data: 'hasInvoice',
          render: function (data) {
            return data ? 'Si' : 'No';
          },
        },
        {
          title: 'Número Factura',
          data: 'invoice',
          render: function (data) {
            return data ? data : '-';
          },
        },
        {
          title: 'Nombre en Factura',
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

  shouldShowConfirmAction = (row: IReducedDetailedPurchaseModel): boolean => {
    return (
      row?.status !== PurchaseStatusEnum.CONFIRMED &&
      row?.status !== PurchaseStatusEnum.CLOSED
    );
  };

  confirmPurchase(id: string) {
    this.alertService
      .confirmTranslated({
        titleKey: 'MESSAGES.CONFIRM_TITLE',
        messageKey: 'MESSAGES.CONFIRM_PURCHASE_TEXT',
        confirmKey: 'BUTTONS.CONFIRM',
        cancelKey: 'BUTTONS.CANCEL',
        icon: 'warning',
      })
      .then((result) => {
        if (!result.isConfirmed) return;
        this.isLoading = true;
        const sub = this.purchaseService
          .updatePurchase(id, { status: PurchaseStatusEnum.CONFIRMED })
          .subscribe({
            next: () => this.loadRecentPurchases(),
            error: () =>
              this.alertService.showTranslatedAlert({ alertType: 'error' }),
            complete: () => (this.isLoading = false),
          });
        this.unsubscribe.push(sub);
      });
  }

  loadRecentPurchases() {
    const userId: string | null = this.isOnlyBuyer
      ? this.authService.currentUserValue?.id ?? null
      : null;

    const purchaseSub = this.purchaseService
      .getPurchaseByParams(
        false,
        userId,
        this.selectedCompany ? this.selectedCompany : null,
        this.selectedPeriod ? this.selectedPeriod : null,
        this.selectedClient ? this.selectedClient : null,
        this.controlNumber ? this.controlNumber : null
      )
      .subscribe({
        next: (purchases: IReducedDetailedPurchaseModel[]) => {
          this.recentPurchases = purchases;
          this.datatableConfig = {
            ...this.datatableConfig,
            data: [...this.recentPurchases],
          };
          this.reloadEvent.emit(true);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching purchases:', error);
        },
      });
    this.unsubscribe.push(purchaseSub);
  }

  edit(id: string) {
    this.router.navigate(['purchases', 'form', id]);
  }

  delete(id: string): void {
    const deleteSub = this.purchaseService.deletePurchase(id).subscribe({
      next: () => {
        this.recentPurchases = this.recentPurchases.filter(
          (item) => item.id !== id
        );
        this.datatableConfig = {
          ...this.datatableConfig,
          data: [...this.recentPurchases],
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

  loadCompanies(): void {
    const companySub = this.companyService
      .getCompanies()
      .pipe(distinctUntilChanged())
      .subscribe({
        next: (companies) => (this.companies = companies),
        error: (err) => console.error('Error al cargar compañías', err),
      });

    this.unsubscribe.push(companySub);
  }

  onCompanyChange() {
    if (!this.selectedCompany) {
      this.existingPeriods = [];
      return;
    }

    // Fetch periods for the selected company
    this.periodService.getPeriodsByCompany(this.selectedCompany).subscribe({
      next: (periods) => {
        this.existingPeriods = periods;
      },
      error: (err) => {
        console.error('Error al cargar periodos:', err);
      },
    });

    this.selectedPeriod = '';
  }

  loadClients(): void {
    const userId: string | null = this.isOnlyBuyer
      ? this.authService.currentUserValue?.id ?? null
      : null;

    let clientSub;
    if (userId) {
      clientSub = this.clientService
        .getClientsByUser(userId)
        .pipe(distinctUntilChanged())
        .subscribe({
          next: (clients) => (this.clients = clients),
          error: (err) => console.error('Error al cargar clientes', err),
        });
    } else {
      clientSub = this.clientService
        .getAllClients(false)
        .pipe(distinctUntilChanged())
        .subscribe({
          next: (clients) => (this.clients = clients),
          error: (err) => console.error('Error al cargar clientes', err),
        });
    }

    this.unsubscribe.push(clientSub);
  }

  clearFilters() {
    this.selectedClient = '';
    this.selectedCompany = '';
    this.selectedPeriod = '';
    this.controlNumber = '';

    this.loadRecentPurchases();
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
    this.reloadEvent.unsubscribe();
  }
}
