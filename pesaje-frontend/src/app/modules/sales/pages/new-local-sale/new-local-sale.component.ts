import {
  ICreateUpdateLocalSaleModel,
  ILocalSaleModel,
  ISaleModel,
  SaleTypeEnum,
  LocalSaleStatusEnum,
} from './../../interfaces/sale.interface';
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
import {
  NgbActiveModal,
  NgbModal,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import { AlertService } from '../../../../utils/alert.service';
import { IReducedUserModel } from '../../../settings/interfaces/user.interface';
import { IReducedShrimpFarmModel } from '../../../shared/interfaces/shrimp-farm.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { InputUtilsService } from 'src/app/utils/input-utils.service';
import { FormUtilsService } from 'src/app/utils/form-utils.service';
import { IReducedPeriodModel } from 'src/app/modules/shared/interfaces/period.interface';
import { CompanySalePaymentListingComponent } from '../../widgets/company-sale-payment-listing/company-sale-payment-listing.component';
import { LocalSaleService } from '../../services/local-sale.service';
import { ILocalSaleDetailModel } from '../../interfaces/local-sale-detail.interface';
import { ILocalCompanySaleDetailModel } from '../../interfaces/local-company-sale-detail.interface';
import { SaleStyleEnum } from '../../interfaces/sale.interface';
import { SaleService } from '../../services/sale.service';
import { IPaymentMethodModel } from '../../../shared/interfaces/payment-method.interface';
import { PaymentMethodService } from '../../../shared/services/payment-method.service';
import { LocalCompanySaleDetailPaymentService } from '../../services/local-company-sale-detail-payment.service';

@Component({
  selector: 'app-new-local-sale',
  templateUrl: './new-local-sale.component.html',
  styleUrl: './new-local-sale.component.scss',
})
export class NewLocalSaleComponent implements OnInit, OnDestroy {
  PERMISSION_ROUTE = PERMISSION_ROUTES.SALES.LOCAL_SALE_FORM;
  SaleStyleEnum = SaleStyleEnum;
  LocalSaleStatusEnum = LocalSaleStatusEnum;

  private modalRef: NgbModalRef | null = null;

  @ViewChild('saleForm') saleForm!: NgForm;

  isOnlyBuyer = false;
  searchSubmitted = false;
  controlNumber: string;

  localSaleModel: ICreateUpdateLocalSaleModel;
  purchaseModel: IReducedDetailedPurchaseModel;

  localSaleWholeDetail: ILocalSaleDetailModel | null = null;
  localSaleTailDetail: ILocalSaleDetailModel | null = null;
  localCompanySaleDetail: ILocalCompanySaleDetailModel | null = null;

  groupedWhole: { size: string; pounds: number; total: number }[] = [];
  groupedTail: { size: string; pounds: number; total: number }[] = [];

  totalWholePounds = 0;
  totalWholeAmount = 0;
  totalTailPounds = 0;
  totalTailAmount = 0;

  saleId: string | undefined;
  localSaleId: string | undefined;

  paymentMethods: IPaymentMethodModel[] = [];
  companyPaymentTotal: number = 0;

  private unsubscribe: Subscription[] = [];
  /** Stores the form changes subscription */
  private formChangesSubscription?: Subscription;
  /** Stores the timeout for delayed autosave */
  private logTimeout?: any;

  /**
   * Public method to refresh company payment total
   * Can be called from payment components when payments are updated
   */
  public refreshCompanyPaymentTotal(): void {
    this.calculateCompanyPaymentTotal();
  }

  private calculateCompanyPaymentTotal(): void {
    if (this.localCompanySaleDetail?.id) {
      const paymentSub = this.localCompanySaleDetailPaymentService
        .getPaymentsByLocalCompanySaleDetailId(this.localCompanySaleDetail.id)
        .subscribe({
          next: (payments) => {
            this.companyPaymentTotal = payments.reduce(
              (sum, payment) => sum + (payment.amount || 0),
              0
            );
            this.cdr.detectChanges(); // Trigger change detection to update the summary
          },
          error: (error) => {
            console.error('Error fetching company payments:', error);
            this.companyPaymentTotal = 0;
          },
        });

      this.unsubscribe.push(paymentSub);
    } else {
      this.companyPaymentTotal = 0;
    }
  }

  constructor(
    public activeModal: NgbActiveModal,
    private alertService: AlertService,
    private authService: AuthService,
    private dateUtils: DateUtilsService,
    private purchaseService: PurchaseService,
    private localSaleService: LocalSaleService,
    private saleService: SaleService,
    private modalService: NgbModal,
    private formUtils: FormUtilsService,
    private inputUtils: InputUtilsService,
    private route: ActivatedRoute,
    private location: Location,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private paymentMethodService: PaymentMethodService,
    private localCompanySaleDetailPaymentService: LocalCompanySaleDetailPaymentService
  ) {}

  get saleDateFormatted(): string | null {
    return this.dateUtils.formatISOToDateInput(this.localSaleModel.saleDate);
  }

  get purchaseDateFormatted(): string | null {
    return this.dateUtils.formatISOToDateInput(this.purchaseModel.purchaseDate);
  }

  get totalProcessedPounds(): number {
    const {
      wholeTotalPounds = 0,
      wholeRejectedPounds = 0,
      trashPounds = 0,
    } = this.localSaleModel;
    return (
      Number(wholeTotalPounds) +
      Number(wholeRejectedPounds) +
      Number(trashPounds)
    );
  }

  get processedRatioDisplay(): string {
    const total = this.totalProcessedPounds;
    const purchased = this.purchaseModel.totalPounds;

    if (!total || !purchased || total === 0) return '';

    const percentage = (total / purchased) * 100;
    return `${percentage.toFixed(2)} %`;
  }

  ngOnInit(): void {
    this.saleId = this.route.snapshot.paramMap.get('id') || undefined;
    this.isOnlyBuyer = this.authService.isOnlyBuyer;

    this.initializeModels();
    this.loadPaymentMethods();

    if (this.saleId) {
      this.loadLocalSaleBySaleId(this.saleId);
    } else {
      // Initialize autosave for new local sale (draft mode)
      setTimeout(() => {
        this.initializeAutosave();
      }, 0);
    }
  }

  loadPaymentMethods(): void {
    const paymentMethodSub = this.paymentMethodService
      .getAllPaymentsMethods()
      .subscribe({
        next: (paymentMethods: IPaymentMethodModel[]) => {
          this.paymentMethods = paymentMethods;
        },
        error: (error: any) => {
          console.error('Error loading payment methods:', error);
        },
      });

    this.unsubscribe.push(paymentMethodSub);
  }

  loadLocalSaleBySaleId(saleId: string): void {
    const localSaleSub = this.localSaleService
      .getLocalSaleBySaleId(saleId)
      .subscribe({
        next: (localSale: ILocalSaleModel) => {
          const { purchase, ...rest } = localSale;
          this.localSaleId = rest.id;
          this.localSaleModel = {
            ...rest,
            purchase: purchase.id,
          };

          // Load multiple localSaleDetails into appropriate sections based on their styles
          if (
            this.localSaleModel.localSaleDetails &&
            this.localSaleModel.localSaleDetails.length > 0
          ) {
            // Find WHOLE detail
            const wholeDetail = this.localSaleModel.localSaleDetails.find(
              (detail) => detail.style === SaleStyleEnum.WHOLE
            );

            // Find TAIL detail
            const tailDetail = this.localSaleModel.localSaleDetails.find(
              (detail) => detail.style === SaleStyleEnum.TAIL
            );

            this.localSaleWholeDetail = wholeDetail ? { ...wholeDetail } : null;
            this.localSaleTailDetail = tailDetail ? { ...tailDetail } : null;
          }

          this.localCompanySaleDetail =
            this.localSaleModel.localCompanySaleDetail || null;

          // Calculate company payment total
          this.calculateCompanyPaymentTotal();

          this.updateGroupedDetails();

          this.controlNumber = localSale.purchase.controlNumber!;
          this.purchaseModel = localSale.purchase;

          this.cdr.detectChanges();

          // Initialize autosave if loaded sale is in DRAFT status
          if (this.localSaleModel.status === LocalSaleStatusEnum.DRAFT) {
            setTimeout(() => {
              this.initializeAutosave();
            }, 0);
          }
        },
        error: (error) => {
          console.error('Error fetching local sale:', error);
          this.alertService.showTranslatedAlert({ alertType: 'error' });
        },
      });

    this.unsubscribe.push(localSaleSub);
  }

  initializeModels() {
    this.localSaleModel = {
      status: LocalSaleStatusEnum.DRAFT,
    } as ICreateUpdateLocalSaleModel;
    this.localSaleModel.wholeTotalPounds = 0;

    // Initialize detail objects as null (will be created when needed)
    this.localSaleWholeDetail = null;
    this.localSaleTailDetail = null;
    this.localCompanySaleDetail = null;

    this.purchaseModel = {} as IReducedDetailedPurchaseModel;
    this.purchaseModel.period = {} as IReducedPeriodModel;
    this.purchaseModel.buyer = {} as IReducedUserModel;
    this.purchaseModel.broker = {} as IReducedUserModel;
    this.purchaseModel.client = {} as IReducedUserModel;
    this.purchaseModel.shrimpFarm = {} as IReducedShrimpFarmModel;
  }

  /**
   * Initializes autosave to monitor field changes
   */
  private initializeAutosave(): void {
    if (this.saleForm) {
      this.formChangesSubscription =
        this.saleForm.valueChanges?.subscribe((formValue) => {
          this.autosaveFormFieldChanges(formValue);
        });
    }
  }

  /**
   * Auto save form changes with a 5-second delay to debounce rapid changes
   * Saves only when purchase is selected and local sale is new or in DRAFT status
   */
  private autosaveFormFieldChanges(formValue: any): void {
    // Clear existing timeout if it exists
    if (this.logTimeout) {
      clearTimeout(this.logTimeout);
    }

    // Set a new timeout for 5 seconds
    this.logTimeout = setTimeout(() => {
      if (this.canSaveAsDraft()) {
        // Ensure purchase is set
        this.localSaleModel.purchase = this.purchaseModel.id;

        // Update sale date if present in the form
        if (formValue.saleDate) {
          this.localSaleModel.saleDate =
            this.dateUtils.convertLocalDateToUTC(formValue.saleDate);
        }

        // Build a clean payload for autosave:
        // - Remove empty localSaleDetails ([]) so backend optional validators don't fail
        // - Remove null/undefined localCompanySaleDetail
        const autosavePayload: ICreateUpdateLocalSaleModel = {
          ...(this.localSaleModel as ICreateUpdateLocalSaleModel),
        };

        if (
          !autosavePayload.localSaleDetails ||
          autosavePayload.localSaleDetails.length === 0
        ) {
          delete (autosavePayload as any).localSaleDetails;
        }

        if (!autosavePayload.localCompanySaleDetail) {
          delete (autosavePayload as any).localCompanySaleDetail;
        }

        if (this.localSaleId) {
          // Update existing local sale as DRAFT
          this.localSaleService
            .updateLocalSale(this.localSaleId, {
              ...autosavePayload,
              status: LocalSaleStatusEnum.DRAFT,
            })
            .subscribe({
              next: (response) => {
                this.localSaleModel.status =
                  (response as any).status || LocalSaleStatusEnum.DRAFT;
                this.cdr.detectChanges();
              },
              error: (error) => {
                console.error('Error autosaving local sale (update):', error);
              },
            });
        } else {
          // Create new local sale as DRAFT
          this.localSaleService
            .createLocalSale({
              ...autosavePayload,
              status: LocalSaleStatusEnum.DRAFT,
            })
            .subscribe({
              next: (response) => {
                this.localSaleId = response.id;
                this.localSaleModel.status =
                  (response as any).status || LocalSaleStatusEnum.DRAFT;

                // Navigate to edit URL after first draft save if sale reference exists
                if ((response as any).sale) {
                  this.saleId = (response as any).sale;
                  this.router.navigate(['/sales/local', this.saleId]);
                }

                this.cdr.detectChanges();
              },
              error: (error) => {
                console.error('Error autosaving local sale (create):', error);
              },
            });
        }
      }
    }, 5000);
  }

  /**
   * Determines if the local sale can be saved as draft
   * Requires a selected purchase and DRAFT status (or new sale)
   */
  private canSaveAsDraft(): boolean {
    // Require purchase before autosaving
    if (!this.purchaseModel || !this.purchaseModel.id) {
      return false;
    }

    // Allow draft saving for new local sale
    if (!this.localSaleId) {
      return true;
    }

    // Allow draft saving only if current status is DRAFT
    if (this.localSaleModel.status === LocalSaleStatusEnum.DRAFT) {
      return true;
    }

    return false;
  }

  confirmSave() {
    // Only validate form if status is not DRAFT (drafts can be saved with partial data)
    if (
      this.saleForm &&
      this.localSaleModel.status !== LocalSaleStatusEnum.DRAFT &&
      this.saleForm.invalid
    ) {
      // Mark all controls as touched to trigger validation messages
      Object.values(this.saleForm.controls).forEach((control) => {
        control.markAsTouched();
        control.markAsDirty();
      });

      return;
    }

    // Check if both details are empty
    const hasWholeDetails =
      this.localSaleWholeDetail &&
      this.localSaleWholeDetail.items &&
      this.localSaleWholeDetail.items.length > 0;
    const hasTailDetails =
      this.localSaleTailDetail &&
      this.localSaleTailDetail.items &&
      this.localSaleTailDetail.items.length > 0;

    if (!hasWholeDetails && !hasTailDetails) {
      this.alertService.showTranslatedAlert({
        alertType: 'info',
        messageKey: 'MESSAGES.NO_SALE_DETAILS_ENTERED',
      });
      return;
    }

    // Validate local company sale details if they exist
    if (this.localCompanySaleDetail && !this.isLocalCompanySaleDetailValid()) {
      this.alertService.showTranslatedAlert({
        alertType: 'warning',
        messageKey: 'MESSAGES.LOCAL_COMPANY_SALE_DETAILS_VALIDATION_ERROR',
      });
      return;
    }

    this.alertService.confirm().then((result) => {
      if (result.isConfirmed) {
        // Unsubscribe from form changes BEFORE making API call to prevent autosave trigger
        if (this.formChangesSubscription) {
          this.formChangesSubscription.unsubscribe();
        }

        this.submitLocalSaleForm();
      }
    });
  }

  submitLocalSaleForm() {
    this.localSaleModel.purchase = this.purchaseModel.id;
    this.localSaleModel.totalProcessedPounds = this.totalProcessedPounds;
    this.localSaleModel.grandTotal = Number(
      (this.totalWholeAmount + this.totalTailAmount).toFixed(2)
    );
    // Prepare separate details for WHOLE and TAIL sections
    const localSaleDetails = [];

    // Add WHOLE detail if it has items
    if (
      this.localSaleWholeDetail?.items &&
      this.localSaleWholeDetail.items.length > 0
    ) {
      const transformedWholeItems = this.localSaleWholeDetail.items.map(
        (item) => ({
          ...item,
          paymentMethod:
            typeof item.paymentMethod === 'object' && item.paymentMethod?.id
              ? item.paymentMethod.id
              : item.paymentMethod,
        })
      );

      localSaleDetails.push({
        style: SaleStyleEnum.WHOLE,
        grandTotal: this.localSaleWholeDetail.grandTotal,
        receivedGrandTotal: this.localSaleWholeDetail.receivedGrandTotal,
        poundsGrandTotal: this.localSaleWholeDetail.poundsGrandTotal,
        retentionPercentage: this.localSaleWholeDetail.retentionPercentage,
        retentionAmount: this.localSaleWholeDetail.retentionAmount,
        netGrandTotal: this.localSaleWholeDetail.netGrandTotal,
        otherPenalties: this.localSaleWholeDetail.otherPenalties,
        items: transformedWholeItems,
      });
    }

    // Add TAIL detail if it has items
    if (
      this.localSaleTailDetail?.items &&
      this.localSaleTailDetail.items.length > 0
    ) {
      const transformedTailItems = this.localSaleTailDetail.items.map(
        (item) => ({
          ...item,
          paymentMethod:
            typeof item.paymentMethod === 'object' && item.paymentMethod?.id
              ? item.paymentMethod.id
              : item.paymentMethod,
        })
      );

      localSaleDetails.push({
        style: SaleStyleEnum.TAIL,
        grandTotal: this.localSaleTailDetail.grandTotal,
        receivedGrandTotal: this.localSaleTailDetail.receivedGrandTotal,
        poundsGrandTotal: this.localSaleTailDetail.poundsGrandTotal,
        retentionPercentage: this.localSaleTailDetail.retentionPercentage,
        retentionAmount: this.localSaleTailDetail.retentionAmount,
        netGrandTotal: this.localSaleTailDetail.netGrandTotal,
        otherPenalties: this.localSaleTailDetail.otherPenalties,
        items: transformedTailItems,
      });
    }

    // Set the localSaleDetails array
    this.localSaleModel.localSaleDetails =
      localSaleDetails as ILocalSaleDetailModel[];

    // Transform localCompanySaleDetail to ensure company field contains only ID string
    if (this.localCompanySaleDetail) {
      this.localSaleModel.localCompanySaleDetail = {
        ...this.localCompanySaleDetail,
        company:
          typeof this.localCompanySaleDetail.company === 'object' &&
          this.localCompanySaleDetail.company?.id
            ? this.localCompanySaleDetail.company.id
            : this.localCompanySaleDetail.company,
      };
    } else {
      // Don't send localCompanySaleDetail field at all if it's null/undefined
      delete this.localSaleModel.localCompanySaleDetail;
    }

    if (this.localSaleId) {
      // When explicitly saving, transition from DRAFT to CREATED (or keep existing non-draft status)
      const nextStatus =
        this.localSaleModel.status === LocalSaleStatusEnum.DRAFT
          ? LocalSaleStatusEnum.CREATED
          : this.localSaleModel.status;

      this.localSaleModel.status = nextStatus;

      this.localSaleService
        .updateLocalSale(this.localSaleId, this.localSaleModel)
        .subscribe({
          next: (response) => {
            this.alertService.showTranslatedAlert({ alertType: 'success' });

            // Reload the sale to get updated detail IDs (especially for company detail)
            if (this.saleId) {
              this.loadLocalSaleBySaleId(this.saleId);
            }
          },
          error: (error) => {
            console.error('Error updating local sale:', error);
            this.alertService.showTranslatedAlert({ alertType: 'error' });
          },
        });
    } else {
      // New local sale: default to CREATED when saving explicitly
      this.localSaleModel.status = LocalSaleStatusEnum.CREATED;

      this.localSaleService.createLocalSale(this.localSaleModel).subscribe({
        next: (response) => {
          this.localSaleId = response.id;

          // Navigate to edit URL with saleId to enable subsequent updates and payments
          // The response contains the sale reference, we need to get the saleId
          if (response.sale) {
            this.saleId = response.sale;
            this.router.navigate(['/sales/local', this.saleId]);
          }

          this.alertService.showTranslatedAlert({ alertType: 'success' });
        },
        error: (error) => {
          console.error('Error creating local sale:', error);
          this.alertService.showTranslatedAlert({ alertType: 'error' });
        },
      });
    }
  }

  canSaveLocalSale(): boolean {
    // Disable button while there is no selected purchase
    if (!this.saleId) {
      return !this.purchaseModel.id;
    }

    // When editing an existing local sale, disable save based on status and role
    if (this.saleId && this.localSaleModel?.status) {
      if (this.isOnlyBuyer) {
        return (
          this.localSaleModel.status === LocalSaleStatusEnum.COMPLETED ||
          this.localSaleModel.status === LocalSaleStatusEnum.CLOSED
        );
      } else {
        return this.localSaleModel.status === LocalSaleStatusEnum.CLOSED;
      }
    }

    return false;
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
          const noValidPurchase =
            purchases.length === 0 || purchases[0].company?.name !== 'Local';

          if (noValidPurchase) {
            this.alertService.showTranslatedAlert({
              alertType: 'info',
              messageKey: 'MESSAGES.PURCHASE_NOT_FOUND',
              customIcon: 'info',
            });

            this.initializeModels();
            return;
          }

          const purchase = purchases[0];

          // Fetch sales before assigning
          const localSaleSub = this.saleService
            .getSalesByParams(false, userId, this.controlNumber)
            .subscribe({
              next: (sales: ISaleModel[]) => {
                if (sales.some((s) => s.type === SaleTypeEnum.LOCAL)) {
                  this.alertService.showTranslatedAlert({
                    alertType: 'warning',
                    messageKey: 'MESSAGES.SALE_LIMIT_REACHED',
                  });

                  this.initializeModels();
                  this.cdr.detectChanges();
                  return;
                }

                this.purchaseModel = purchase;
                this.cdr.detectChanges();
              },
              error: (error) => {
                console.error('Error fetching sales:', error);
                this.alertService.showTranslatedAlert({ alertType: 'error' });
              },
            });

          this.unsubscribe.push(localSaleSub);
        },
        error: (error) => {
          console.error('Error fetching purchases:', error);
          this.alertService.showTranslatedAlert({ alertType: 'error' });
        },
      });

    this.unsubscribe.push(purchaseSub);
  }

  handleNewSale(): void {
    const currentUrl = this.router.url;

    if (currentUrl === '/sales/company') {
      // If already on /sales/company, reload the route (force component reset)
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate(['/sales/company']);
      });
    } else {
      // Otherwise, navigate to /logistics/new
      this.router.navigate(['/sales/company']);
    }
  }

  goBack(): void {
    this.router.navigate(['/sales/list']);
  }

  handleLocalSaleWholeDetailChange(detail: ILocalSaleDetailModel) {
    this.localSaleWholeDetail = detail;
    this.calculateWholeTotalPounds();
    this.updateGroupedDetails();
    this.updateLocalSaleModelDetails();
  }

  handleLocalSaleTailDetailChange(detail: ILocalSaleDetailModel) {
    this.localSaleTailDetail = detail;
    this.updateGroupedDetails();
    this.updateLocalSaleModelDetails();
  }

  handleLocalCompanySaleDetailChange(
    detail: ILocalCompanySaleDetailModel | null
  ) {
    this.localCompanySaleDetail = detail;
    // Only update the model details, not the payment total
    // Payment total should only be refreshed when payments are actually modified
    this.updateLocalSaleModelDetails();
  }

  /**
   * Update localSaleModel with current detail values
   * This ensures the summary component sees the latest changes
   */
  private updateLocalSaleModelDetails(): void {
    // Update localSaleDetails array
    const details: ILocalSaleDetailModel[] = [];
    if (this.localSaleWholeDetail) {
      details.push(this.localSaleWholeDetail);
    }
    if (this.localSaleTailDetail) {
      details.push(this.localSaleTailDetail);
    }
    this.localSaleModel.localSaleDetails = details;

    // Update localCompanySaleDetail (convert null to undefined)
    this.localSaleModel.localCompanySaleDetail =
      this.localCompanySaleDetail || undefined;
  }

  calculateWholeTotalPounds(): void {
    let total = 0;

    this.localSaleWholeDetail?.items.forEach((item) => {
      total += item.pounds || 0;
    });

    this.localSaleModel.wholeTotalPounds = Number(total.toFixed(2));
  }

  updateGroupedDetails(): void {
    const groupBySize = (details: ILocalSaleDetailModel | null) => {
      const groupMap: { [size: string]: { pounds: number; total: number } } =
        {};

      if (details?.items) {
        details.items.forEach((item) => {
          if (!groupMap[item.size]) {
            groupMap[item.size] = { pounds: 0, total: 0 };
          }
          groupMap[item.size].pounds += item.pounds || 0;
          groupMap[item.size].total += item.total || 0;
        });
      }

      return Object.entries(groupMap).map(([size, data]) => ({
        size,
        pounds: data.pounds,
        total: data.total,
      }));
    };

    this.groupedWhole = groupBySize(this.localSaleWholeDetail);
    this.groupedTail = groupBySize(this.localSaleTailDetail);

    this.totalWholePounds = this.groupedWhole.reduce(
      (sum, g) => sum + g.pounds,
      0
    );
    this.totalWholeAmount = this.groupedWhole.reduce(
      (sum, g) => sum + g.total,
      0
    );

    this.totalTailPounds = this.groupedTail.reduce(
      (sum, g) => sum + g.pounds,
      0
    );
    this.totalTailAmount = this.groupedTail.reduce(
      (sum, g) => sum + g.total,
      0
    );
  }

  onDateChange(event: any): void {
    if (!event) return;

    this.localSaleModel.saleDate = this.dateUtils.convertLocalDateToUTC(event);
  }

  async openPaymentsModal(): Promise<any> {
    if (this.modalRef) {
      return;
    }

    if (!this.localSaleId) {
      return;
    }

    try {
      this.modalRef = this.modalService.open(
        CompanySalePaymentListingComponent,
        {
          size: 'lg',
          centered: true,
          backdrop: 'static',
          keyboard: false,
          windowClass: 'payment-listing-modal',
        }
      );

      // ✅ Set input safely
      this.modalRef.componentInstance.companySaleId = this.localSaleId;

      const result = await this.modalRef.result;
      return result;
    } catch (error) {
      return null;
    } finally {
      this.modalRef = null;
    }
  }

  onHasInvoiceChange(hasInvoice: boolean) {
    if (!hasInvoice) {
      this.localSaleModel.invoiceNumber = undefined;
      this.localSaleModel.invoiceName = undefined;
    }
  }

  /**
   * 👉 Formats sheet number to 8 digits with leading zeros when input loses focus
   */
  formatWeightSheetNumberOnBlur(event: Event) {
    this.inputUtils.formatSheetNumberOnBlur(
      event,
      'weightSheetNumber',
      this.localSaleModel
    );
  }

  /**
   * 👉 Handles focus event to clear field if it's all zeros
   */
  onWeightSheetNumberFocus(event: Event) {
    this.inputUtils.onSheetNumberFocus(
      event,
      'weightSheetNumber',
      this.localSaleModel
    );
  }

  formatDecimal(controlName: string) {
    const control = this.saleForm?.form?.get(controlName);
    if (control) {
      this.formUtils.formatControlToDecimal(control);
    }
  }

  validateNumber(event: KeyboardEvent) {
    this.inputUtils.validateNumber(event);
  }

  validateWholeNumber(event: KeyboardEvent) {
    this.inputUtils.validateWholeNumber(event);
  }

  /**
   * Validates local company sale details
   * @returns boolean indicating if validation passes
   */
  isLocalCompanySaleDetailValid(): boolean {
    if (!this.localCompanySaleDetail) {
      return true; // No details to validate
    }

    const detail = this.localCompanySaleDetail;

    // Check required fields
    if (!detail.company) return false;
    if (!detail.receiptDate?.trim()) return false;
    if (!detail.personInCharge?.trim()) return false;
    if (!detail.guideNumber?.trim()) return false;
    if (
      detail.batch === undefined ||
      detail.batch === null ||
      detail.batch <= 0
    )
      return false;
    if (
      detail.guideWeight === undefined ||
      detail.guideWeight === null ||
      detail.guideWeight <= 0
    )
      return false;

    // Check if there are items
    if (!detail.items || detail.items.length === 0) return false;

    // Validate each item
    for (const item of detail.items) {
      if (!item.size?.trim()) return false;
      if (!item.class?.trim()) return false;
      if (item.pounds === undefined || item.pounds === null || item.pounds <= 0)
        return false;
      if (item.price === undefined || item.price === null || item.price <= 0)
        return false;
    }

    return true; // All validations passed
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
