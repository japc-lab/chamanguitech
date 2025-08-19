import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { NgForm } from '@angular/forms';
import { DateUtilsService } from '../../../../utils/date-utils.service';
import { AuthService } from '../../../auth';
import { IReducedDetailedPurchaseModel } from '../../../purchases/interfaces/purchase.interface';
import { PurchaseService } from '../../../purchases/services/purchase.service';
import { PERMISSION_ROUTES } from '../../../../constants/routes.constants';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertService } from '../../../../utils/alert.service';
import {
  ICreateUpdateLogisticsModel,
  IDetailedReadLogisticsModel,
  IReadLogisticsModel,
  LogisticsStatusEnum,
  LogisticsTypeEnum,
} from '../../interfaces/logistics.interface';
import { LogisticsService } from '../../services/logistics.service';
import {
  ILogisticsItemModel,
  ICreateUpdateLogisticsItemModel,
} from '../../interfaces/logistics-item.interface';
import { IReducedUserModel } from '../../../settings/interfaces/user.interface';
import { IReducedShrimpFarmModel } from '../../../shared/interfaces/shrimp-farm.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { InputUtilsService } from 'src/app/utils/input-utils.service';
import { ILogisticsPaymentModel } from '../../interfaces/logistics-payment.interface';

@Component({
  selector: 'app-new-logistics',
  templateUrl: './new-logistics.component.html',
  styleUrl: './new-logistics.component.scss',
})
export class NewLogisticsComponent implements OnInit, OnDestroy {
  PERMISSION_ROUTE = PERMISSION_ROUTES.LOGISTICS.LOGISTICS_FORM;

  isOnlyBuyer = false;
  hasRouteId = false;
  searchSubmitted = false;
  controlNumber: string;

  logisticsModel: ICreateUpdateLogisticsModel;
  purchaseModel: IReducedDetailedPurchaseModel;

  logisticsTypes: LogisticsTypeEnum[];
  logisticsTypeLabels: { [key in LogisticsTypeEnum]?: string } = {};

  logisticsItems: ILogisticsItemModel[] = [];
  logisticsPayments: ILogisticsPaymentModel[] = [];

  logisticsId: string | undefined;

  private unsubscribe: Subscription[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private alertService: AlertService,
    private authService: AuthService,
    private dateUtils: DateUtilsService,
    private purchaseService: PurchaseService,
    private logisticsService: LogisticsService,
    private route: ActivatedRoute,
    private location: Location,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private inputUtils: InputUtilsService
  ) {}

  get logisticsDateFormatted(): string | null {
    return this.dateUtils.formatISOToDateInput(
      this.logisticsModel.logisticsDate
    );
  }

  get purchaseDateFormatted(): string | null {
    return this.dateUtils.formatISOToDateInput(this.purchaseModel.purchaseDate);
  }

  get grandTotalDisplayed(): number {
    return (
      this.logisticsItems?.reduce(
        (sum, item) => sum + Number(item.total || 0),
        0
      ) || 0
    );
  }

  ngOnInit(): void {
    this.logisticsId = this.route.snapshot.paramMap.get('id') || undefined;
    this.hasRouteId = !!this.logisticsId;
    this.isOnlyBuyer = this.authService.isOnlyBuyer;

    this.initializeModels();

    if (this.logisticsId) {
      const logisticsSub = this.logisticsService
        .getLogisticsById(this.logisticsId)
        .subscribe({
          next: (logistics: IDetailedReadLogisticsModel) => {
            this.logisticsModel = {
              id: logistics.id,
              purchase: logistics.purchase?.id,
              type: logistics.type,
              logisticsDate: logistics.logisticsDate,
              status: logistics.status,
              grandTotal: logistics.grandTotal,
              logisticsSheetNumber: logistics.logisticsSheetNumber,
              items: [],
              payments: [],
            };
            this.controlNumber = logistics.purchase.controlNumber!;
            this.purchaseModel = logistics.purchase;

            this.logisticsItems = logistics.items;
            this.logisticsPayments = logistics.payments || [];

            if (this.purchaseModel.controlNumber?.includes('CO')) {
              this.logisticsTypeLabels = {
                [LogisticsTypeEnum.SHIPMENT]: 'Envío a Compañía',
              };
              this.logisticsTypes = [LogisticsTypeEnum.SHIPMENT];
            } else {
              this.logisticsTypeLabels = {
                [LogisticsTypeEnum.SHIPMENT]: 'Envío Local',
                [LogisticsTypeEnum.LOCAL_PROCESSING]: 'Procesamiento Local',
              };
              this.logisticsTypes = Object.values(LogisticsTypeEnum);
            }

            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('Error fetching logistics:', error);
            this.alertService.showTranslatedAlert({ alertType: 'error' });
          },
        });

      this.unsubscribe.push(logisticsSub);
    }
  }

  initializeModels() {
    this.logisticsModel = {
      type: LogisticsTypeEnum.SHIPMENT,
      logisticsDate: '',
      grandTotal: 0,
      status: LogisticsStatusEnum.DRAFT,
      items: [],
      payments: [],
      logisticsSheetNumber: '',
    } as ICreateUpdateLogisticsModel;

    this.purchaseModel = {} as IReducedDetailedPurchaseModel;
    this.purchaseModel.buyer = {} as IReducedUserModel;
    this.purchaseModel.broker = {} as IReducedUserModel;
    this.purchaseModel.client = {} as IReducedUserModel;
    this.purchaseModel.shrimpFarm = {} as IReducedShrimpFarmModel;
  }

  confirmSave(event: Event, form: NgForm) {
    if (form && form.invalid) {
      return;
    }

    // Check if there are complete items to save
    const completeItems = this.logisticsItems.filter(
      (item) =>
        Number(item.unit) > 0 &&
        Number(item.cost) > 0 &&
        Number(item.total) > 0 &&
        item.financeCategory &&
        item.resourceCategory
    );

    if (completeItems.length === 0) {
      this.alertService.showTranslatedAlert({
        alertType: 'info',
        messageKey: 'MESSAGES.NO_COMPLETE_ITEMS',
      });
      return;
    }

    this.alertService.confirm().then((result) => {
      if (result.isConfirmed) {
        this.submitLogisticsForm();
      }
    });
  }

  submitLogisticsForm() {
    this.logisticsModel.purchase = this.purchaseModel.id;

    // Filter out incomplete items and map them
    this.logisticsModel.items = this.logisticsItems
      .filter((item) => {
        const isComplete =
          Number(item.unit) > 0 &&
          Number(item.cost) > 0 &&
          Number(item.total) > 0 &&
          item.financeCategory &&
          item.resourceCategory;

        return isComplete;
      })
      .map((x) => {
        const mappedItem = {
          financeCategory: x.financeCategory,
          resourceCategory: x.resourceCategory,
          unit: x.unit,
          cost: x.cost,
          total: x.total,
          description: x.description || '',
        } as ICreateUpdateLogisticsItemModel;

        return mappedItem;
      });

    // Add payments to the logistics model
    this.logisticsModel.payments = this.logisticsPayments.map((payment) => ({
      financeCategory: payment.financeCategory,
      amount: payment.amount,
      paymentStatus: payment.paymentStatus,
      paymentDate: payment.paymentStatus === 'PAID' && payment.paymentDate ?
        this.dateUtils.convertLocalDateToUTC(payment.paymentDate) : undefined,
      paymentMethod: payment.paymentStatus === 'PAID' ?
        (typeof payment.paymentMethod === 'string' ? payment.paymentMethod : payment.paymentMethod?.id || '') :
        undefined,
      hasInvoice: payment.hasInvoice,
      invoiceNumber: payment.hasInvoice === 'yes' ? payment.invoiceNumber : undefined,
      invoiceName: payment.hasInvoice === 'yes' ? payment.invoiceName : undefined,
      personInCharge: payment.paymentStatus === 'PAID' ? payment.personInCharge : undefined,
      observation: payment.observation,
      isCompleted: payment.isCompleted
    }));

    this.logisticsModel.grandTotal = this.grandTotalDisplayed;

    if (this.logisticsId) {
      this.logisticsService
        .updateLogistics(this.logisticsId, this.logisticsModel)
        .subscribe({
          next: (response) => {
            this.alertService.showTranslatedAlert({ alertType: 'success' });
          },
          error: (error) => {
            console.error('Error updating logistics:', error);
            this.alertService.showTranslatedAlert({ alertType: 'error' });
          },
        });
    } else {
      this.logisticsService.createLogistics(this.logisticsModel).subscribe({
        next: (response) => {
          this.logisticsId = response.id; // ✅ Store the new ID for future updates
          this.cdr.detectChanges();
          this.alertService.showTranslatedAlert({ alertType: 'success' });
        },
        error: (error) => {
          console.error('Error creating logistics:', error);
          this.alertService.showTranslatedAlert({ alertType: 'error' });
        },
      });
    }
  }

  canSaveLogistics(): boolean {
    if (this.logisticsId) {
      return this.logisticsModel.status !== LogisticsStatusEnum.CLOSED;
    } else {
      return !!this.purchaseModel.id;
    }
    return true;
  }

  searchPurchase(): void {
    this.searchSubmitted = true;

    if (!this.controlNumber?.trim()) {
      return; // don't search if input is empty
    }

    const userId =
      this.isOnlyBuyer && this.authService.currentUserValue?.id
        ? this.authService.currentUserValue.id
        : null;

    const purchaseSub = this.purchaseService
      .getPurchaseByParams(false, userId, null, null, null, this.controlNumber)
      .subscribe({
        next: (purchases: IReducedDetailedPurchaseModel[]) => {
          if (purchases.length === 0) {
            this.alertService.showTranslatedAlert({
              alertType: 'info',
              messageKey: 'MESSAGES.PURCHASE_NOT_FOUND',
              customIcon: 'info',
            });

            this.initializeModels();
            return;
          }

          const purchase = purchases[0];

          // Fetch logistics before assigning
          const logisticsSub = this.logisticsService
            .getLogisticsByParams(false, userId, this.controlNumber)
            .subscribe({
              next: (logistics: IReadLogisticsModel[]) => {
                const isLocal =
                  purchase.company.name?.toLowerCase() === 'local';
                const maxAllowed = isLocal ? 2 : 1;
                const hasDifferentTypes = isLocal
                  ? new Set(logistics.map((l) => l.type)).size > 1
                  : true;
                if (logistics.length >= maxAllowed && hasDifferentTypes) {
                  this.alertService.showTranslatedAlert({
                    alertType: 'warning',
                    messageKey: 'MESSAGES.LOGISTICS_LIMIT_REACHED',
                    params: {
                      count: isLocal ? 2 : 1,
                      record: Array.from(
                        new Set(logistics.map((l) => l.description))
                      ).join(', '),
                    },
                  });

                  this.initializeModels();
                  this.cdr.detectChanges();
                  return;
                }

                this.purchaseModel = purchase;

                const controlNumberIncludesCO =
                  purchase.controlNumber?.includes('CO');

                if (controlNumberIncludesCO) {
                  this.logisticsTypeLabels = {
                    [LogisticsTypeEnum.SHIPMENT]: 'Envío a Compañía',
                  };
                  this.logisticsTypes = [LogisticsTypeEnum.SHIPMENT];

                  this.cdr.detectChanges();
                  return;
                }

                if (logistics.length === 0) {
                  this.logisticsTypeLabels = {
                    [LogisticsTypeEnum.SHIPMENT]: 'Envío Local',
                    [LogisticsTypeEnum.LOCAL_PROCESSING]: 'Procesamiento Local',
                  };
                  this.logisticsTypes = Object.values(LogisticsTypeEnum);

                  this.cdr.detectChanges();
                  return;
                }

                const existingType = logistics[0].type;

                if (existingType === LogisticsTypeEnum.SHIPMENT) {
                  this.logisticsTypeLabels = {
                    [LogisticsTypeEnum.LOCAL_PROCESSING]: 'Procesamiento Local',
                  };
                  this.logisticsTypes = [LogisticsTypeEnum.LOCAL_PROCESSING];
                } else {
                  this.logisticsTypeLabels = {
                    [LogisticsTypeEnum.SHIPMENT]: 'Envío Local',
                  };
                  this.logisticsTypes = [LogisticsTypeEnum.SHIPMENT];
                }

                this.cdr.detectChanges();
              },
              error: (error) => {
                console.error('Error fetching logistics:', error);
                this.alertService.showTranslatedAlert({ alertType: 'error' });
              },
            });

          this.unsubscribe.push(logisticsSub);
        },
        error: (error) => {
          console.error('Error fetching purchases:', error);
          this.alertService.showTranslatedAlert({ alertType: 'error' });
        },
      });

    this.unsubscribe.push(purchaseSub);
  }

  handleNewLogistics(): void {
    const currentUrl = this.router.url;

    if (currentUrl === '/logistics/form') {
      // If already on /logistics/form, reload the route (force component reset)
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate(['/logistics/form']);
      });
    } else {
      // Otherwise, navigate to /logistics/new
      this.router.navigate(['/logistics/form']);
    }
  }

  goBack(): void {
    this.location.back();
  }

  handleLogisticsItems(items: ILogisticsItemModel[]) {
    this.logisticsItems = items;
  }

  handleLogisticsPayments(payments: ILogisticsPaymentModel[]) {
    this.logisticsPayments = payments;
  }

  onDateChange(event: any): void {
    if (!event) return;

    this.logisticsModel.logisticsDate =
      this.dateUtils.convertLocalDateToUTC(event);
  }

  /**
   * 👉 Validates numeric input (prevents invalid characters)
   */
  validateNumber(event: KeyboardEvent) {
    this.inputUtils.validateNumber(event); // ✅ Use utility function
  }

  /**
   * 👉 Formats sheet number to 8 digits with leading zeros when input loses focus
   */
  formatLogisticsSheetNumberOnBlur(event: Event) {
    this.inputUtils.formatSheetNumberOnBlur(
      event,
      'logisticsSheetNumber',
      this.logisticsModel
    );
  }

  /**
   * 👉 Handles focus event to clear field if it's all zeros
   */
  onLogisticsSheetNumberFocus(event: Event) {
    this.inputUtils.onSheetNumberFocus(
      event,
      'logisticsSheetNumber',
      this.logisticsModel
    );
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
  }
}
