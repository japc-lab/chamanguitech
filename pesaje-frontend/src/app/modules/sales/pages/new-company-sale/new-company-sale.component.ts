import {
  CompanySaleStatusEnum,
  ICompanySaleModel,
  ICreateUpdateCompanySaleModel,
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
import {
  IReducedShrimpFarmModel,
  TransportationMethodEnum,
} from '../../../shared/interfaces/shrimp-farm.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { ICompanySaleItemModel } from '../../interfaces/company-sale-item.interface';
import { CompanySaleService } from '../../services/company-sale.service';
import { InputUtilsService } from 'src/app/utils/input-utils.service';
import { FormUtilsService } from 'src/app/utils/form-utils.service';
import { IReducedPeriodModel } from 'src/app/modules/shared/interfaces/period.interface';
import { CompanySalePaymentListingComponent } from '../../widgets/company-sale-payment-listing/company-sale-payment-listing.component';
import { SaleService } from '../../services/sale.service';
import { ICompany } from 'src/app/modules/settings/interfaces/company.interfaces';

@Component({
  selector: 'app-new-company-sale',
  templateUrl: './new-company-sale.component.html',
  styleUrl: './new-company-sale.component.scss',
})
export class NewCompanySaleComponent implements OnInit, OnDestroy {
  PERMISSION_ROUTE = PERMISSION_ROUTES.SALES.COMPANY_SALE_FORM;

  private modalRef: NgbModalRef | null = null;

  @ViewChild('saleForm') saleForm!: NgForm;

  isOnlyBuyer = false;
  searchSubmitted = false;
  isAddingPayment = false;
  controlNumber: string;

  companySaleModel: ICreateUpdateCompanySaleModel;
  purchaseModel: IReducedDetailedPurchaseModel;

  receptionDate: string = '';
  receptionTime: string = '';
  settleDate: string = '';
  settleTime: string = '';

  companySaleItems: ICompanySaleItemModel[] = [];

  saleId: string | undefined;
  companySaleId: string | undefined;

  private unsubscribe: Subscription[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private alertService: AlertService,
    private authService: AuthService,
    private dateUtils: DateUtilsService,
    private purchaseService: PurchaseService,
    private companySaleService: CompanySaleService,
    private saleService: SaleService,
    private modalService: NgbModal,
    private formUtils: FormUtilsService,
    private inputUtils: InputUtilsService,
    private route: ActivatedRoute,
    private location: Location,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  get purchaseDateFormatted(): string | null {
    return this.dateUtils.formatISOToDateInput(this.purchaseModel.purchaseDate);
  }

  get transportationMethod(): string {
    switch (this.purchaseModel.shrimpFarm.transportationMethod) {
      case TransportationMethodEnum.CAR:
        return 'Carro';
      case TransportationMethodEnum.CARBOAT:
        return 'Carro y Bote';
      default:
        return 'No especificado';
    }
  }

  ngOnInit(): void {
    this.saleId = this.route.snapshot.paramMap.get('id') || undefined;
    this.isOnlyBuyer = this.authService.isOnlyBuyer;

    this.initializeModels();
    this.companySaleModel.predominantSize = 'P';

    if (this.saleId) {
      const companySaleSub = this.companySaleService
        .getCompanySaleBySaleId(this.saleId)
        .subscribe({
          next: (companySale: ICompanySaleModel) => {
            const { purchase, ...rest } = companySale;
            this.companySaleId = rest.id;
            this.companySaleModel = {
              ...rest,
              purchase: purchase.id,
            };
            this.controlNumber = companySale.purchase.controlNumber!;
            this.purchaseModel = companySale.purchase;

            this.receptionDate = this.dateUtils.formatISOToDateInput(
              this.companySaleModel.receptionDate
            );

            this.settleDate = this.dateUtils.formatISOToDateInput(
              this.companySaleModel.settleDate
            );

            this.companySaleItems = companySale.items;

            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('Error fetching logistics:', error);
            this.alertService.showTranslatedAlert({ alertType: 'error' });
          },
        });

      this.unsubscribe.push(companySaleSub);
    }
  }

  initializeModels() {
    this.companySaleModel = {} as ICreateUpdateCompanySaleModel;

    this.purchaseModel = {} as IReducedDetailedPurchaseModel;
    this.purchaseModel.period = {} as IReducedPeriodModel;
    this.purchaseModel.buyer = {} as IReducedUserModel;
    this.purchaseModel.broker = {} as IReducedUserModel;
    this.purchaseModel.client = {} as IReducedUserModel;
    this.purchaseModel.shrimpFarm = {} as IReducedShrimpFarmModel;
    this.purchaseModel.company = {} as ICompany;
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
    if (!this.companySaleItems || this.companySaleItems.length === 0) {
      this.alertService.showTranslatedAlert({
        alertType: 'info',
        messageKey: 'MESSAGES.NO_SALE_DETAILS_ENTERED',
      });
      return;
    }

    this.alertService.confirm().then((result) => {
      if (result.isConfirmed) {
        this.submitCompanySaleForm();
      }
    });
  }

  submitCompanySaleForm() {
    this.companySaleModel.purchase = this.purchaseModel.id;

    this.companySaleModel.items = this.companySaleItems.map(
      ({ id, ...rest }) => rest
    );
    this.companySaleModel.poundsGrandTotal = this.companySaleItems.reduce(
      (sum, item) => sum + Number(item.pounds || 0),
      0
    );
    this.companySaleModel.grandTotal = Number(
      this.companySaleItems
        .reduce((sum, item) => sum + Number(item.total || 0), 0)
        .toFixed(2)
    );
    this.companySaleModel.percentageTotal = this.companySaleItems.reduce(
      (sum, item) => sum + Number(item.percentage || 0),
      0
    );

    if (this.companySaleId) {
      this.companySaleService
        .updateCompanySale(this.companySaleId, this.companySaleModel)
        .subscribe({
          next: (response) => {
            this.alertService.showTranslatedAlert({ alertType: 'success' });
          },
          error: (error) => {
            console.error('Error updating company sale:', error);
            this.alertService.showTranslatedAlert({ alertType: 'error' });
          },
        });
    } else {
      this.companySaleService
        .createCompanySale(this.companySaleModel)
        .subscribe({
          next: (response) => {
            this.companySaleId = response.id; // ✅ Store the new ID for future updates

            // Navigate to edit URL with saleId to enable subsequent updates and payments
            if (response.sale) {
              this.saleId = response.sale;
              this.router.navigate(['/sales/company', this.saleId]);
            }

            this.alertService.showTranslatedAlert({ alertType: 'success' });
          },
          error: (error) => {
            console.error('Error creating company sale:', error);
            this.alertService.showTranslatedAlert({ alertType: 'error' });
          },
        });
    }
  }

  canSaveCompanySale(): boolean {
    if (this.saleId) {
      if (this.isOnlyBuyer) {
        return (
          this.companySaleModel.status !== CompanySaleStatusEnum.COMPLETED &&
          this.companySaleModel.status !== CompanySaleStatusEnum.CLOSED
        );
      } else {
        return this.companySaleModel.status !== CompanySaleStatusEnum.CLOSED;
      }
    } else {
      return !!this.purchaseModel.id;
    }
  }

  canAddPayments(): boolean {
    if (this.saleId) {
      if (this.isOnlyBuyer) {
        return (
          this.companySaleModel.status !== CompanySaleStatusEnum.COMPLETED &&
          this.companySaleModel.status !== CompanySaleStatusEnum.CLOSED
        );
      } else {
        return this.companySaleModel.status !== CompanySaleStatusEnum.CLOSED;
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
            purchases.length === 0 || purchases[0].company?.name === 'Local';

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
          const companySaleSub = this.saleService
            .getSalesByParams(false, userId, this.controlNumber)
            .subscribe({
              next: (sales: ISaleModel[]) => {
                if (sales.some((s) => s.type === SaleTypeEnum.COMPANY)) {
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

          this.unsubscribe.push(companySaleSub);
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

  handleCompanySaleItemsChange(items: ICompanySaleItemModel[]) {
    this.companySaleItems = items;
  }

  onDateChange(event: any): void {
    if (!event) return;

    this.companySaleModel.saleDate =
      this.dateUtils.convertLocalDateToUTC(event);
  }

  async openPaymentsModal(): Promise<any> {
    if (this.modalRef) {
      return;
    }

    if (!this.companySaleId) {
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
      this.modalRef.componentInstance.companySaleId = this.companySaleId;

      const result = await this.modalRef.result;
      return result;
    } catch (error) {
      return null;
    } finally {
      this.modalRef = null;
    }
  }

  formatDecimal(controlName: string) {
    const control = this.saleForm.controls[controlName];
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
