import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
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
    standalone: false
})
export class NewLogisticsComponent implements OnInit, OnDestroy {
  PERMISSION_ROUTE = PERMISSION_ROUTES.LOGISTICS.LOGISTICS_FORM;

  LogisticsStatusEnum = LogisticsStatusEnum;

  @ViewChild('logisticsForm') logisticsForm!: NgForm;

  isOnlyBuyer = false;
  searchSubmitted = false;
  controlNumber: string;

  logisticsModel: ICreateUpdateLogisticsModel;
  purchaseModel: IReducedDetailedPurchaseModel;

  logisticsTypes: LogisticsTypeEnum[];
  logisticsTypeLabels: { [key in LogisticsTypeEnum]?: string } = {};

  logisticsItems: ILogisticsItemModel[] = [];
  logisticsPayments: ILogisticsPaymentModel[] = [];
  showPaymentValidationErrors: boolean = false;

  logisticsId: string | undefined;
  isEditMode = false;

  /** Stores all active subscriptions */
  private unsubscribe: Subscription[] = [];

  /** Stores the form changes subscription */
  private formChangesSubscription?: Subscription;

  /** Stores the timeout for delayed logging */
  private logTimeout?: any;

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
      this.logisticsModel.logisticsDate!
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

            this.isEditMode = !!this.logisticsId;

            // Use the same logic as search to determine logistics types
            // (after purchaseModel is set)
            this.determineLogisticsTypes();

            this.cdr.detectChanges();

            // Initialize autosave if in draft status
            if (this.logisticsModel.status === LogisticsStatusEnum.DRAFT) {
              setTimeout(() => {
                this.initializeAutosave();
              }, 0);
            }
          },
          error: (error) => {
            console.error('Error fetching logistics:', error);
            this.alertService.showTranslatedAlert({ alertType: 'error' });
          },
        });

      this.unsubscribe.push(logisticsSub);
    } else {
      // Initialize autosave for new logistics (draft mode)
      setTimeout(() => {
        this.initializeAutosave();
      }, 0);
    }
  }

  initializeModels() {
    this.logisticsModel = {
      status: LogisticsStatusEnum.DRAFT,
    } as ICreateUpdateLogisticsModel;

    this.purchaseModel = {} as IReducedDetailedPurchaseModel;
    this.purchaseModel.buyer = {} as IReducedUserModel;
    this.purchaseModel.broker = {} as IReducedUserModel;
    this.purchaseModel.client = {} as IReducedUserModel;
    this.purchaseModel.shrimpFarm = {} as IReducedShrimpFarmModel;
  }

  /**
   * Initializes autosave to monitor field changes
   */
  private initializeAutosave(): void {
    if (this.logisticsForm) {
      // Subscribe to form value changes
      this.formChangesSubscription = this.logisticsForm.valueChanges?.subscribe(
        (formValue) => {
          this.autosaveFormFieldChanges(formValue);
        }
      );
    }
  }

  /**
   * Auto save form changes with a 5-second delay to debounce rapid changes
   * @param formValue - The entire form value object
   */
  private autosaveFormFieldChanges(formValue: any): void {
    // Clear existing timeout if it exists
    if (this.logTimeout) {
      clearTimeout(this.logTimeout);
    }

    // Set a new timeout for 5 seconds
    this.logTimeout = setTimeout(() => {
      // Only allow draft saving when it's a new logistics or when editing logistics is in draft status
      if (this.canSaveAsDraft()) {
        this.logisticsModel.purchase = this.purchaseModel.id;

        if (this.logisticsId) {
          // ✅ Update Logistics if ID exists
          this.logisticsService
            .updateLogistics(this.logisticsId, {
              ...this.logisticsModel,
              status: LogisticsStatusEnum.DRAFT,
            })
            .subscribe({
              next: (response) => {
                this.logisticsModel.status = response.status;
                this.cdr.detectChanges();
              },
              error: (error) => {
                console.error('Error updating logistics:', error);
              },
            });
        } else {
          // ✅ Create New Logistics if ID does NOT exist
          this.logisticsService
            .createLogistics({
              ...this.logisticsModel,
              status: LogisticsStatusEnum.DRAFT,
            })
            .subscribe({
              next: (response) => {
                this.logisticsId = response.id; // ✅ Store the new ID for future updates
                this.logisticsModel.status = response.status;
                this.isEditMode = true;

                // Navigate to edit URL after first draft save
                this.router.navigate(['/logistics/form', this.logisticsId]);

                this.cdr.detectChanges();
              },
              error: (error) => {
                console.error('Error creating logistics:', error);
              },
            });
        }
      }
    }, 5000);
  }

  /**
   * Determines if the logistics can be saved as draft
   */
  private canSaveAsDraft(): boolean {
    // Allow draft saving for new logistics
    if (!this.logisticsId) {
      return true;
    }

    // Allow draft saving only if current status is DRAFT
    if (this.logisticsModel.status === LogisticsStatusEnum.DRAFT) {
      return true;
    }

    return false;
  }

  confirmSave(event: Event, form: NgForm) {
    if (form && form.invalid) {
      // Mark all controls as touched to trigger validation messages
      Object.values(form.controls).forEach((control) => {
        control.markAsTouched();
        control.markAsDirty();
      });
      return;
    }

    // Check if there are complete items to save
    const hasCompleteItems =
      this.logisticsItems && this.logisticsItems.length > 0;
    const completeItems = this.logisticsItems.filter(
      (item) =>
        Number(item.unit) > 0 &&
        Number(item.cost) > 0 &&
        Number(item.total) > 0 &&
        item.financeCategory &&
        item.resourceCategory
    );

    if (!hasCompleteItems || completeItems.length === 0) {
      this.alertService.showTranslatedAlert({
        alertType: 'info',
        messageKey: 'MESSAGES.NO_COMPLETE_ITEMS',
      });
      return;
    }

    // Check for payment validation errors
    this.showPaymentValidationErrors = true;
    const hasPaymentErrors = this.logisticsPayments.some((payment) => {
      // Check if payment status is PAID but required fields are missing
      if (payment.paymentStatus === 'PAID') {
        const hasRequiredFields =
          payment.paymentDate &&
          (payment.paymentMethod?.id || payment.paymentMethod) &&
          payment.personInCharge;

        if (!hasRequiredFields) return true;

        // Check invoice fields if invoice is required
        if (payment.hasInvoice === 'yes') {
          return !(payment.invoiceNumber && payment.invoiceName);
        }
      }
      return false;
    });

    if (hasPaymentErrors) {
      this.alertService.showTranslatedAlert({
        alertType: 'warning',
        messageKey: 'MESSAGES.PAYMENT_VALIDATION_ERRORS',
      });
      return;
    }

    this.alertService.confirm().then((result) => {
      if (result.isConfirmed) {
        // Unsubscribe from form changes BEFORE making API call to prevent autosave trigger
        if (this.formChangesSubscription) {
          this.formChangesSubscription.unsubscribe();
        }

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
      paymentDate:
        payment.paymentStatus === 'PAID' && payment.paymentDate
          ? this.dateUtils.convertLocalDateToUTC(payment.paymentDate)
          : undefined,
      paymentMethod:
        payment.paymentStatus === 'PAID'
          ? typeof payment.paymentMethod === 'string'
            ? payment.paymentMethod
            : payment.paymentMethod?.id || ''
          : undefined,
      hasInvoice: payment.hasInvoice,
      invoiceNumber:
        payment.hasInvoice === 'yes' ? payment.invoiceNumber : undefined,
      invoiceName:
        payment.hasInvoice === 'yes' ? payment.invoiceName : undefined,
      personInCharge:
        payment.paymentStatus === 'PAID' ? payment.personInCharge : undefined,
      observation: payment.observation,
      isCompleted: payment.isCompleted,
    }));

    this.logisticsModel.grandTotal = this.grandTotalDisplayed;

    // Ensure all required fields are set from the form
    if (this.logisticsForm) {
      this.logisticsModel.logisticsSheetNumber =
        this.logisticsForm.value.logisticsSheetNumber || '';
      this.logisticsModel.logisticsDate =
        this.logisticsForm.value.logisticsDate || '';
      this.logisticsModel.type =
        this.logisticsForm.value.type || LogisticsTypeEnum.SHIPMENT;
    }

    // ✅ Update Logistics (draft is already created via autosave)
    const { status, ...updateData } = this.logisticsModel;
    this.logisticsService
      .updateLogistics(this.logisticsId!, updateData)
      .subscribe({
        next: (response) => {
          this.logisticsModel.status = response.status;
          this.alertService.showTranslatedAlert({ alertType: 'success' });
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error updating logistics:', error);
          this.alertService.showTranslatedAlert({ alertType: 'error' });
        },
      });
  }

  canSaveLogistics(): boolean {
    if (this.logisticsId) {
      // Allow saving if status is not CLOSED
      return this.logisticsModel.status !== LogisticsStatusEnum.CLOSED;
    } else {
      // For new logistics, require a purchase to be selected
      return !!this.purchaseModel.id;
    }
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

                // Use the centralized determineLogisticsTypes method with existing logistics data
                this.determineLogisticsTypes(logistics);
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
    this.router.navigate(['/logistics/list']);
  }

  handleLogisticsItems(items: ILogisticsItemModel[]) {
    this.logisticsItems = items;
  }

  handleLogisticsPayments(payments: ILogisticsPaymentModel[]) {
    this.logisticsPayments = payments;
  }

  /**
   * Determines logistics types based on purchase and existing logistics
   */
  private determineLogisticsTypes(existingLogistics?: IReadLogisticsModel[]): void {
    if (!this.purchaseModel.id) return;

    const controlNumberIncludesCO =
      this.purchaseModel.controlNumber?.includes('CO');

    if (controlNumberIncludesCO) {
      this.logisticsTypeLabels = {
        [LogisticsTypeEnum.SHIPMENT]: 'Envío a Compañía',
      };
      this.logisticsTypes = [LogisticsTypeEnum.SHIPMENT];
      this.cdr.detectChanges();
    } else {
      // If logistics data is provided, use it directly
      if (existingLogistics) {
        this.processLogisticsTypes(existingLogistics);
      } else {
        // Otherwise, fetch logistics data
        const userId =
          this.isOnlyBuyer && this.authService.currentUserValue?.id
            ? this.authService.currentUserValue.id
            : null;

        const logisticsSub = this.logisticsService
          .getLogisticsByParams(
            false,
            userId,
            this.purchaseModel.controlNumber || null
          )
          .subscribe({
            next: (logistics: IReadLogisticsModel[]) => {
              this.processLogisticsTypes(logistics);
            },
            error: (error) => {
              console.error(
                'Error fetching logistics for type determination:',
                error
              );
            },
          });

        this.unsubscribe.push(logisticsSub);
      }
    }
  }

  /**
   * Processes logistics data to determine available types
   */
  private processLogisticsTypes(logistics: IReadLogisticsModel[]): void {
    // Filter out the current logistics being edited
    const otherLogistics = logistics.filter(
      (l) => l.id !== this.logisticsId
    );

    if (otherLogistics.length === 0) {
      // No other logistics exist, show both types
      this.logisticsTypeLabels = {
        [LogisticsTypeEnum.SHIPMENT]: 'Envío Local',
        [LogisticsTypeEnum.LOCAL_PROCESSING]: 'Procesamiento Local',
      };
      this.logisticsTypes = Object.values(LogisticsTypeEnum);
    } else if (otherLogistics.length === 1) {
      // One other logistics exists
      const existingType = otherLogistics[0].type;
      const complementaryType = existingType === LogisticsTypeEnum.SHIPMENT
        ? LogisticsTypeEnum.LOCAL_PROCESSING
        : LogisticsTypeEnum.SHIPMENT;

      if (this.logisticsId && this.logisticsModel.type) {
        // In edit mode, show both current type and complementary type
        // But avoid duplicates if they're the same
        const typesToShow = [this.logisticsModel.type];
        if (this.logisticsModel.type !== complementaryType) {
          typesToShow.push(complementaryType);
        }

        this.logisticsTypeLabels = {};
        typesToShow.forEach(type => {
          this.logisticsTypeLabels[type] = this.getTypeLabel(type);
        });

        this.logisticsTypes = typesToShow;
      } else {
        // In create mode, show only the complementary type
        this.logisticsTypeLabels = {
          [complementaryType]: this.getTypeLabel(complementaryType),
        };
        this.logisticsTypes = [complementaryType];
      }
    } else {
      // Both logistics types already exist (2 or more other logistics)
      // In edit mode, show only the current type
      if (this.logisticsId && this.logisticsModel.type) {
        this.logisticsTypeLabels = {
          [this.logisticsModel.type]: this.getTypeLabel(this.logisticsModel.type),
        };
        this.logisticsTypes = [this.logisticsModel.type];
      } else {
        // No types available (should not happen in edit mode)
        this.logisticsTypeLabels = {};
        this.logisticsTypes = [];
      }
    }

    // Force change detection and ensure dropdown is updated
    this.cdr.detectChanges();

    // Force another change detection cycle to ensure dropdown is properly updated
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }

  /**
   * Gets the display label for a logistics type
   */
  private getTypeLabel(type: LogisticsTypeEnum): string {
    if (type === LogisticsTypeEnum.SHIPMENT) {
      return this.purchaseModel.company?.name?.toLowerCase() === 'local'
        ? 'Envío Local'
        : 'Envío a Compañía';
    } else if (type === LogisticsTypeEnum.LOCAL_PROCESSING) {
      return 'Procesamiento Local';
    }
    return '';
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

    // Unsubscribe from form changes subscription
    if (this.formChangesSubscription) {
      this.formChangesSubscription.unsubscribe();
    }

    // Clear any pending timeout
    if (this.logTimeout) {
      clearTimeout(this.logTimeout);
    }
  }
}
