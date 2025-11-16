import { PaymentMethodService } from './../../shared/services/payment-method.service';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { PERMISSION_ROUTES } from '../../../constants/routes.constants';
import { Config } from 'datatables.net';
import { NgForm } from '@angular/forms';
import { PurchasePaymentService } from '../../shared/services/purchase-payment.service';
import {
  ICreateUpdatePurchasePaymentModel,
  IPurchasePaymentModel,
} from '../../shared/interfaces/purchase-payment.interface';
import { FormUtilsService } from '../../../utils/form-utils.service';
import { InputUtilsService } from '../../../utils/input-utils.service';
import { distinctUntilChanged, Subscription } from 'rxjs';
import {
  NgbActiveModal,
  NgbModal,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import { AlertService } from 'src/app/utils/alert.service';
import { IPaymentMethodModel } from '../../shared/interfaces/payment-method.interface';
import { DateUtilsService } from 'src/app/utils/date-utils.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-purchase-payment-listing',
  templateUrl: './purchase-payment-listing.component.html',
  styleUrls: ['./purchase-payment-listing.component.scss'],
})
export class PurchasePaymentListingComponent implements OnInit, OnDestroy {
  PERMISSION_ROUTE = PERMISSION_ROUTES.PURCHASES.PURCHASE_FORM;

  private modalRef: NgbModalRef | null = null;
  private unsubscribe: Subscription[] = [];

  @Input() purchaseId!: string;

  @ViewChild('formModal') formModalTemplate!: any;

  isLoading = false;

  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  purchasePayments: IPurchasePaymentModel[] = [];
  purchasePaymentModel: IPurchasePaymentModel = {} as IPurchasePaymentModel;

  paymentMethods: IPaymentMethodModel[] = [];

  @ViewChild('myForm') paymentForm!: NgForm;

  datatableConfig: Config = {} as Config;

  constructor(
    private purchasePaymentService: PurchasePaymentService,
    private paymentMethodService: PaymentMethodService,
    private formUtils: FormUtilsService,
    private inputUtils: InputUtilsService,
    public activeModal: NgbActiveModal,
    private alertService: AlertService,
    private dateUtils: DateUtilsService,
    private modalService: NgbModal,
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

    this.loadPaymentsMethods();
    this.loadPurchasePaymentsById(this.purchaseId);
  }

  // 🔹 Initialize DataTable Configuration with Translations
  initializeDatatableConfig(): void {
    // Preserve existing data when reinitializing (e.g., during language change)
    const currentData = this.datatableConfig?.data || [];

    this.datatableConfig = {
      serverSide: false,
      paging: true,
      pageLength: 10,
      data: currentData,
      columns: [
        {
          title: this.translate.instant('PAYMENTS.FIELDS.PAYMENT_TYPE'),
          data: 'paymentMethod',
          render: (data) => {
            if (!data) return '-';
            return this.getPaymentMethodName(data);
          },
        },
        {
          title: this.translate.instant('PAYMENTS.FIELDS.ACCOUNT_NAME'),
          data: 'accountName',
          render: function (data) {
            return data ? data : '-';
          },
        },
        {
          title: this.translate.instant('PAYMENTS.FIELDS.AMOUNT'),
          data: 'amount',
          render: function (data) {
            if (!data && data !== 0) return '-';

            const formatted = new Intl.NumberFormat('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(data);

            return `$${formatted}`;
          },
        },
        {
          title: this.translate.instant('PAYMENTS.FIELDS.PAYMENT_DATE'),
          data: 'paymentDate',
          render: function (data) {
            if (!data) return '-';
            const date = new Date(data);
            return date.toLocaleDateString('es-ES');
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

  loadPurchasePaymentsById(purchaseId: string): void {
    const sub = this.purchasePaymentService
      .getPurchasePaymentsById(purchaseId)
      .subscribe({
        next: (payments) => {
          this.purchasePayments = payments;

          this.datatableConfig = {
            ...this.datatableConfig,
            data: [...this.purchasePayments],
          };

          this.cdr.detectChanges();
          this.reloadEvent.emit(true);
        },
        error: (error) => {
          console.error('❌ Error loading purchase payments:', error);
          this.alertService.showTranslatedAlert({ alertType: 'error' });
        },
      });

    this.unsubscribe.push(sub);
  }

  loadPaymentsMethods(): void {
    const paymentMethodSub = this.paymentMethodService
      .getAllPaymentsMethods()
      .pipe(distinctUntilChanged())
      .subscribe({
        next: (methods) => {
          this.paymentMethods = methods;
        },
        error: (error) => {
          console.error('Error fetching payment methods:', error);
        },
      });

    this.unsubscribe.push(paymentMethodSub);
  }

  onClickAfterSubmit(myForm: NgForm, modal: NgbActiveModal) {
    if (myForm && myForm.invalid) {
      return;
    }

    modal.dismiss('submit');
  }

  onSubmit(event: Event, myForm: NgForm): void {
    if (myForm && myForm.invalid) {
      return;
    }

    this.isLoading = true;

    const completeFn = () => {
      this.isLoading = false;
    };

    const paymentPayload: ICreateUpdatePurchasePaymentModel = {
      purchase: this.purchasePaymentModel.purchase,
      paymentMethod: this.purchasePaymentModel.paymentMethod.id,
      amount: this.purchasePaymentModel.amount,
      paymentDate: this.dateUtils.convertLocalDateToUTC(
        this.purchasePaymentModel.paymentDate
      ),
      accountName: this.purchasePaymentModel.accountName,
      observation: this.purchasePaymentModel.observation,
    };

    const updateFn = () => {
      const updateSub = this.purchasePaymentService
        .updatePurchasePayment(this.purchasePaymentModel.id, paymentPayload)
        .subscribe({
          next: (updatedInfo) => {
            if (!updatedInfo.id) {
              console.error('Updated payment has no ID');
              return;
            }

            const index = this.purchasePayments.findIndex(
              (item) => item.id === updatedInfo.id
            );

            if (index > -1) {
              const fullUpdatedPayment: IPurchasePaymentModel = {
                id: updatedInfo.id,
                purchase: updatedInfo.purchase,
                amount: updatedInfo.amount,
                paymentDate: updatedInfo.paymentDate,
                paymentMethod: this.paymentMethods.find(
                  (x) => x.id === updatedInfo.paymentMethod
                )!,
                accountName: updatedInfo.accountName,
                observation: updatedInfo.observation,
              };

              this.purchasePayments[index] = fullUpdatedPayment;
            }

            this.alertService.showTranslatedAlert({ alertType: 'success' });

            this.datatableConfig = {
              ...this.datatableConfig,
              data: [...this.purchasePayments],
            };

            this.cdr.detectChanges();
            this.reloadEvent.emit(true);
          },
          error: (error) => {
            const rawMessage = error?.error?.message ?? '';
            const matched = rawMessage.match(/amount of (\d+(\.\d+)?)/); // Extract number
            const totalAgreed = matched ? matched[1] : '---';

            this.alertService.showTranslatedAlert({
              alertType: 'error',
              messageKey: 'ERROR.PURCHASE_TOTAL_AGREED_EXCEEDED',
              params: { total: totalAgreed },
            });

            this.isLoading = false;
          },
          complete: completeFn,
        });

      this.unsubscribe.push(updateSub);
    };

    const createFn = () => {
      const createSub = this.purchasePaymentService
        .createPurchasePayment(paymentPayload)
        .subscribe({
          next: () => {
            this.alertService.showTranslatedAlert({ alertType: 'success' });
            this.loadPurchasePaymentsById(this.purchaseId);

            this.paymentForm.resetForm(); // ✅ Clear the form
            this.create(); // ✅ Reset the model (optional)
          },
          error: (error) => {
            const rawMessage = error?.error?.message ?? '';
            const matched = rawMessage.match(/amount of (\d+(\.\d+)?)/); // Extract number
            const totalAgreed = matched ? matched[1] : '---';

            this.alertService.showTranslatedAlert({
              alertType: 'error',
              messageKey: 'ERROR.PURCHASE_TOTAL_AGREED_EXCEEDED',
              params: { total: totalAgreed },
            });

            this.isLoading = false;
          },
          complete: completeFn,
        });

      this.unsubscribe.push(createSub);
    };

    if (this.purchasePaymentModel.id) {
      updateFn();
    } else {
      createFn();
    }
  }

  create() {
    this.purchasePaymentModel = {} as IPurchasePaymentModel;
    this.purchasePaymentModel.purchase = this.purchaseId;
    this.purchasePaymentModel.paymentMethod = {} as IPaymentMethodModel;
  }

  delete(id: string): void {
    const deleteSub = this.purchasePaymentService
      .deletePurchasePayment(id)
      .subscribe({
        next: () => {
          this.purchasePayments = this.purchasePayments.filter(
            (item) => item.id !== id
          );

          this.datatableConfig = {
            ...this.datatableConfig,
            data: [...this.purchasePayments],
          };

          this.cdr.detectChanges();
          this.reloadEvent.emit(true);
        },
        error: () => {
          this.alertService.showTranslatedAlert({ alertType: 'error' });
        },
      });
    this.unsubscribe.push(deleteSub);
  }

  async edit(id: string) {
    console.log(id);
    const foundItem = this.purchasePayments.find((item) => item.id === id);
    this.purchasePaymentModel = foundItem ?? ({} as IPurchasePaymentModel);

    this.purchasePaymentModel.paymentDate = this.dateUtils.formatISOToDateInput(
      this.purchasePaymentModel.paymentDate
    );

    await this.openPaymentModal();
  }

  async openPaymentModal(): Promise<any> {
    if (this.modalRef) return;

    try {
      this.modalRef = this.modalService.open(this.formModalTemplate, {
        size: 'md',
        centered: true,
        backdrop: true,
        keyboard: true,
      });

      const result = await this.modalRef.result;
      return result;
    } catch (error) {
      return null;
    } finally {
      this.modalRef = null;
    }
  }

  formatDecimal(controlName: string) {
    const control = this.paymentForm?.controls[controlName];
    if (control) {
      this.formUtils.formatControlToDecimal(control);
    }
  }

  validateNumber(event: KeyboardEvent) {
    this.inputUtils.validateNumber(event);
  }

  /**
   * Gets the payment method name based on the current language
   */
  getPaymentMethodName(paymentMethod: IPaymentMethodModel): string {
    if (!paymentMethod || !paymentMethod.name) {
      return '';
    }

    const currentLang = this.translate.currentLang || 'es';
    const lang = currentLang === 'en' ? 'en' : 'es';

    return (
      paymentMethod.name[lang] ||
      paymentMethod.name.es ||
      paymentMethod.name.en ||
      ''
    );
  }

  ngOnDestroy(): void {
    // Limpiar todas las suscripciones
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
    this.reloadEvent.unsubscribe();
  }
}
