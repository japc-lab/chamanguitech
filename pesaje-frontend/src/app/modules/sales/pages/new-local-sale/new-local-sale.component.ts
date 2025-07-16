import {
  ICreateUpdateLocalSaleModel,
  ILocalSaleModel,
  ISaleModel,
  SaleTypeEnum,
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
import { SaleStyleEnum } from '../../interfaces/sale.interface';
import { SaleService } from '../../services/sale.service';

@Component({
  selector: 'app-new-local-sale',
  templateUrl: './new-local-sale.component.html',
  styleUrl: './new-local-sale.component.scss',
})
export class NewLocalSaleComponent implements OnInit, OnDestroy {
  PERMISSION_ROUTE = PERMISSION_ROUTES.SALES.LOCAL_SALE_FORM;
  SaleStyleEnum = SaleStyleEnum;

  private modalRef: NgbModalRef | null = null;

  @ViewChild('saleForm') saleForm!: NgForm;

  isOnlyBuyer = false;
  hasRouteId = false;
  searchSubmitted = false;
  controlNumber: string;

  localSaleModel: ICreateUpdateLocalSaleModel;
  purchaseModel: IReducedDetailedPurchaseModel;

  localSaleWholeDetails: ILocalSaleDetailModel[] = [];
  localSaleTailDetails: ILocalSaleDetailModel[] = [];

  groupedWhole: { size: string; pounds: number; total: number }[] = [];
  groupedTail: { size: string; pounds: number; total: number }[] = [];

  totalWholePounds = 0;
  totalWholeAmount = 0;
  totalTailPounds = 0;
  totalTailAmount = 0;

  saleId: string | undefined;
  localSaleId: string | undefined;

  private unsubscribe: Subscription[] = [];

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
    private cdr: ChangeDetectorRef
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
      tailTotalPounds = 0,
      wholeRejectedPounds = 0,
      trashPounds = 0,
    } = this.localSaleModel;
    return (
      Number(wholeTotalPounds) +
      Number(tailTotalPounds) +
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
    this.hasRouteId = !!this.saleId;
    this.isOnlyBuyer = this.authService.isOnlyBuyer;

    this.initializeModels();

    if (this.saleId) {
      const localSaleSub = this.localSaleService
        .getLocalSaleBySaleId(this.saleId)
        .subscribe({
          next: (localSale: ILocalSaleModel) => {
            const { purchase, ...rest } = localSale;
            this.localSaleId = rest.id;
            this.localSaleModel = {
              ...rest,
              purchase: purchase.id,
            };

            this.localSaleWholeDetails = this.localSaleModel.details.filter(
              (det) => det.style === SaleStyleEnum.WHOLE
            );
            this.localSaleTailDetails = this.localSaleModel.details.filter(
              (det) => det.style === SaleStyleEnum.TAIL
            );
            this.updateGroupedDetails(
              this.localSaleWholeDetails,
              this.localSaleTailDetails
            );

            this.controlNumber = localSale.purchase.controlNumber!;
            this.purchaseModel = localSale.purchase;

            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('Error fetching local sale:', error);
            this.alertService.showTranslatedAlert({ alertType: 'error' });
          },
        });

      this.unsubscribe.push(localSaleSub);
    }
  }

  initializeModels() {
    this.localSaleModel = {} as ICreateUpdateLocalSaleModel;
    this.localSaleModel.wholeTotalPounds = 0;
    this.localSaleModel.tailTotalPounds = 0;

    this.purchaseModel = {} as IReducedDetailedPurchaseModel;
    this.purchaseModel.period = {} as IReducedPeriodModel;
    this.purchaseModel.buyer = {} as IReducedUserModel;
    this.purchaseModel.broker = {} as IReducedUserModel;
    this.purchaseModel.client = {} as IReducedUserModel;
    this.purchaseModel.shrimpFarm = {} as IReducedShrimpFarmModel;
  }

  confirmSave() {
    if (this.saleForm && this.saleForm.invalid) {
      // Mark all controls as touched to trigger validation messages
      Object.values(this.saleForm.controls).forEach((control) => {
        control.markAsTouched();
        control.markAsDirty();
      });

      return;
    }

    // Check if both lists are empty
    const hasWholeDetails =
      Array.isArray(this.localSaleWholeDetails) &&
      this.localSaleWholeDetails.length > 0;
    const hasTailDetails =
      Array.isArray(this.localSaleTailDetails) &&
      this.localSaleTailDetails.length > 0;

    if (!hasWholeDetails && !hasTailDetails) {
      this.alertService.showTranslatedAlert({
        alertType: 'info',
        messageKey: 'MESSAGES.NO_SALE_DETAILS_ENTERED',
      });
      return;
    }

    this.alertService.confirm().then((result) => {
      if (result.isConfirmed) {
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
    this.localSaleModel.details = [
      ...this.localSaleWholeDetails,
      ...this.localSaleTailDetails,
    ];

    if (this.localSaleId) {
      this.localSaleService
        .updateLocalSale(this.localSaleId, this.localSaleModel)
        .subscribe({
          next: (response) => {
            this.alertService.showTranslatedAlert({ alertType: 'success' });
          },
          error: (error) => {
            console.error('Error updating local sale:', error);
            this.alertService.showTranslatedAlert({ alertType: 'error' });
          },
        });
    } else {
      this.localSaleService.createLocalSale(this.localSaleModel).subscribe({
        next: (response) => {
          this.localSaleId = response.id;
          this.cdr.detectChanges();
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
    if (this.purchaseModel.id) return false;
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
    this.location.back();
  }

  handleLocalSaleWholeDetailsChange(details: ILocalSaleDetailModel[]) {
    this.localSaleWholeDetails = details;
    this.calculateWholeTotalPounds();
    this.updateGroupedDetails(
      this.localSaleWholeDetails,
      this.localSaleTailDetails
    );
  }

  handleLocalSaleTailDetailsChange(details: ILocalSaleDetailModel[]) {
    this.localSaleTailDetails = details;
    this.calculateTailTotalPounds();
    this.updateGroupedDetails(
      this.localSaleWholeDetails,
      this.localSaleTailDetails
    );
  }

  calculateWholeTotalPounds(): void {
    let total = 0;

    this.localSaleWholeDetails.forEach((detail) => {
      detail.items.forEach((item) => {
        total += item.pounds || 0;
      });
    });

    this.localSaleModel.wholeTotalPounds = Number(total.toFixed(2));
  }

  calculateTailTotalPounds(): void {
    let total = 0;

    this.localSaleTailDetails.forEach((detail) => {
      detail.items.forEach((item) => {
        total += item.pounds || 0;
      });
    });

    this.localSaleModel.tailTotalPounds = Number(total.toFixed(2));
  }

  updateGroupedDetails(
    wholeDetails: ILocalSaleDetailModel[],
    tailDetails: ILocalSaleDetailModel[]
  ): void {
    const groupBySize = (details: ILocalSaleDetailModel[]) => {
      const groupMap: { [size: string]: { pounds: number; total: number } } =
        {};

      details.forEach((detail) => {
        detail.items.forEach((item) => {
          if (!groupMap[item.size]) {
            groupMap[item.size] = { pounds: 0, total: 0 };
          }
          groupMap[item.size].pounds += item.pounds || 0;
          groupMap[item.size].total += item.total || 0;
        });
      });

      return Object.entries(groupMap).map(([size, data]) => ({
        size,
        pounds: data.pounds,
        total: data.total,
      }));
    };

    this.groupedWhole = groupBySize(wholeDetails);
    this.groupedTail = groupBySize(tailDetails);

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

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
  }
}
