import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Config } from 'datatables.net';
import { NgForm } from '@angular/forms';
import { distinctUntilChanged, Subscription } from 'rxjs';
import {
  NgbActiveModal,
  NgbModal,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import { AlertService } from 'src/app/utils/alert.service';
import { DateUtilsService } from 'src/app/utils/date-utils.service';
import { PERMISSION_ROUTES } from 'src/app/constants/routes.constants';
import { IPaymentMethodModel } from 'src/app/modules/shared/interfaces/payment-method.interface';
import { FormUtilsService } from 'src/app/utils/form-utils.service';
import { InputUtilsService } from 'src/app/utils/input-utils.service';
import { PaymentMethodService } from 'src/app/modules/shared/services/payment-method.service';
import {
  ICreateUpdateLocalCompanySaleDetailPaymentModel,
  ILocalCompanySaleDetailPaymentModel,
} from '../../interfaces/local-company-sale-detail-payment.interface';
import { LocalCompanySaleDetailPaymentService } from '../../services/local-company-sale-detail-payment.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-local-company-sale-detail-payment-listing',
    templateUrl: './local-company-sale-detail-payment-listing.component.html',
    styleUrls: ['./local-company-sale-detail-payment-listing.component.scss'],
    standalone: false
})
export class LocalCompanySaleDetailPaymentListingComponent
  implements OnInit, OnDestroy
{
  PERMISSION_ROUTE = PERMISSION_ROUTES.SALES.LOCAL_SALE_FORM;

  private modalRef: NgbModalRef | null = null;

  @Input() localCompanySaleDetailId!: string;
  @ViewChild('formModal') formModalTemplate!: any;

  private unsubscribe: Subscription[] = [];

  isLoading = false;

  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  payments: ILocalCompanySaleDetailPaymentModel[] = [];
  paymentModel: ILocalCompanySaleDetailPaymentModel =
    {} as ILocalCompanySaleDetailPaymentModel;

  paymentMethods: IPaymentMethodModel[] = [];

  @ViewChild('myForm') paymentForm!: NgForm;

  datatableConfig: Config = {
    serverSide: false,
    paging: true,
    pageLength: 10,
    data: [],
    columns: [
      {
        title: 'Tipo de Pago',
        data: 'paymentMethod',
        render: (data) => {
          if (!data) return '-';
          return this.getPaymentMethodName(data);
        },
      },
      {
        title: 'Nombre de Cuenta',
        data: 'accountName',
        render: function (data) {
          return data ? data : '-';
        },
      },
      {
        title: 'Monto',
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
        title: 'Fecha de Pago',
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

  constructor(
    private localCompanySaleDetailPaymentService: LocalCompanySaleDetailPaymentService,
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
    this.loadPaymentsMethods();
    this.loadPayments(this.localCompanySaleDetailId);
  }

  loadPayments(localCompanySaleDetailId: string): void {
    const sub = this.localCompanySaleDetailPaymentService
      .getPaymentsByLocalCompanySaleDetailId(localCompanySaleDetailId)
      .subscribe({
        next: (payments) => {
          this.payments = payments;

          this.datatableConfig = {
            ...this.datatableConfig,
            data: [...this.payments],
          };

          this.cdr.detectChanges();
          this.reloadEvent.emit(true);
        },
        error: (error) => {
          console.error('❌ Error loading payments:', error);
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

    const paymentPayload: ICreateUpdateLocalCompanySaleDetailPaymentModel = {
      localCompanySaleDetail: this.paymentModel.localCompanySaleDetail,
      paymentMethod: this.paymentModel.paymentMethod.id,
      amount: this.paymentModel.amount,
      paymentDate: this.dateUtils.convertLocalDateToUTC(
        this.paymentModel.paymentDate
      ),
      accountName: this.paymentModel.accountName,
      observation: this.paymentModel.observation,
    };

    const updateFn = () => {
      const updateSub = this.localCompanySaleDetailPaymentService
        .updatePayment(this.paymentModel.id!, paymentPayload)
        .subscribe({
          next: (updatedInfo: any) => {
            this.alertService.showTranslatedAlert({ alertType: 'success' });
            this.loadPayments(this.localCompanySaleDetailId);

            this.paymentForm.resetForm();
          },
          error: (error) => {
            const rawMessage = error?.error?.message ?? '';
            const matched = rawMessage.match(/amount of (\d+(\.\d+)?)/);
            const total = matched ? matched[1] : '---';

            this.alertService.showTranslatedAlert({
              alertType: 'error',
              messageKey: 'ERROR.PAYMENT_EXCEEDED_NET_TOTAL',
              params: { total: total },
            });

            this.isLoading = false;
          },
          complete: completeFn,
        });

      this.unsubscribe.push(updateSub);
    };

    const createFn = () => {
      const createSub = this.localCompanySaleDetailPaymentService
        .createPayment(paymentPayload)
        .subscribe({
          next: () => {
            this.alertService.showTranslatedAlert({ alertType: 'success' });
            this.loadPayments(this.localCompanySaleDetailId);

            this.paymentForm.resetForm();
          },
          error: (error) => {
            const rawMessage = error?.error?.message ?? '';
            const matched = rawMessage.match(/amount of (\d+(\.\d+)?)/);
            const total = matched ? matched[1] : '---';

            this.alertService.showTranslatedAlert({
              alertType: 'error',
              messageKey: 'ERROR.PAYMENT_EXCEEDED_NET_TOTAL',
              params: { total: total },
            });

            this.isLoading = false;
          },
          complete: completeFn,
        });

      this.unsubscribe.push(createSub);
    };

    if (this.paymentModel.id) {
      updateFn();
    } else {
      createFn();
    }
  }

  async create() {
    this.paymentModel = {} as ILocalCompanySaleDetailPaymentModel;
    this.paymentModel.localCompanySaleDetail = this.localCompanySaleDetailId;
    this.paymentModel.paymentMethod = {} as IPaymentMethodModel;

    await this.openPaymentModal();
  }

  delete(id: string): void {
    const deleteSub = this.localCompanySaleDetailPaymentService
      .deletePayment(id)
      .subscribe({
        next: () => {
          this.payments = this.payments.filter((item) => item.id !== id);

          this.datatableConfig = {
            ...this.datatableConfig,
            data: [...this.payments],
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
    const foundItem = this.payments.find((item) => item.id === id);
    this.paymentModel =
      foundItem ?? ({} as ILocalCompanySaleDetailPaymentModel);

    this.paymentModel.paymentDate = this.dateUtils.formatISOToDateInput(
      this.paymentModel.paymentDate
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
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
    this.reloadEvent.unsubscribe();
  }
}
