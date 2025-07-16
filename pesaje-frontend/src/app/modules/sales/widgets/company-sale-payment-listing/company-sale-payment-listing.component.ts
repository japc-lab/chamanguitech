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
import { ICompanySalePaymentModel } from 'src/app/modules/shared/interfaces/company-sale-payment.interface';
import { IPaymentMethodModel } from 'src/app/modules/shared/interfaces/payment-method.interface';
import { CompanySalePaymentService } from 'src/app/modules/shared/services/company-sale-payment.service';
import { FormUtilsService } from 'src/app/utils/form-utils.service';
import { InputUtilsService } from 'src/app/utils/input-utils.service';
import { PaymentMethodService } from 'src/app/modules/shared/services/payment-method.service';
import { ICreateUpdateCompanySalePaymentModel } from '../../../shared/interfaces/company-sale-payment.interface';

@Component({
  selector: 'app-company-sale-payment-listing',
  templateUrl: './company-sale-payment-listing.component.html',
  styleUrls: ['./company-sale-payment-listing.component.scss'],
})
export class CompanySalePaymentListingComponent implements OnInit, OnDestroy {
  PERMISSION_ROUTE = PERMISSION_ROUTES.SALES.COMPANY_SALE_FORM;

  private modalRef: NgbModalRef | null = null;

  @Input() companySaleId!: string;
  @ViewChild('formModal') formModalTemplate!: any;

  private unsubscribe: Subscription[] = [];

  isLoading = false;

  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  companySalePayments: ICompanySalePaymentModel[] = [];
  companySalePaymentModel: ICompanySalePaymentModel =
    {} as ICompanySalePaymentModel;

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
        data: 'paymentMethod.name',
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
    private companySalePaymentService: CompanySalePaymentService,
    private paymentMethodService: PaymentMethodService,
    private formUtils: FormUtilsService,
    private inputUtils: InputUtilsService,
    public activeModal: NgbActiveModal,
    private alertService: AlertService,
    private dateUtils: DateUtilsService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPaymentsMethods();
    this.loadCompanySalePaymentsById(this.companySaleId);
  }

  loadCompanySalePaymentsById(companySaleId: string): void {
    const sub = this.companySalePaymentService
      .getCompanySalePaymentsById(companySaleId)
      .subscribe({
        next: (payments) => {
          this.companySalePayments = payments;

          this.datatableConfig = {
            ...this.datatableConfig,
            data: [...this.companySalePayments],
          };

          this.cdr.detectChanges();
          this.reloadEvent.emit(true);
        },
        error: (error) => {
          console.error('❌ Error loading company sale payments:', error);
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

    const paymentPayload: ICreateUpdateCompanySalePaymentModel = {
      companySale: this.companySalePaymentModel.companySale,
      paymentMethod: this.companySalePaymentModel.paymentMethod.id,
      amount: this.companySalePaymentModel.amount,
      paymentDate: this.dateUtils.convertLocalDateToUTC(
        this.companySalePaymentModel.paymentDate
      ),
    };

    const updateFn = () => {
      const updateSub = this.companySalePaymentService
        .updateCompanySalePayment(
          this.companySalePaymentModel.id,
          paymentPayload
        )
        .subscribe({
          next: (updatedInfo) => {
            if (!updatedInfo.id) {
              return;
            }

            const index = this.companySalePayments.findIndex(
              (item) => item.id === updatedInfo.id
            );

            if (index > -1) {
              const fullUpdatedPayment: ICompanySalePaymentModel = {
                id: updatedInfo.id,
                companySale: updatedInfo.companySale,
                amount: updatedInfo.amount,
                paymentDate: updatedInfo.paymentDate,
                paymentMethod: this.paymentMethods.find(
                  (x) => x.id === updatedInfo.paymentMethod
                )!,
              };

              this.companySalePayments[index] = fullUpdatedPayment;
            }

            this.alertService.showTranslatedAlert({ alertType: 'success' });

            this.datatableConfig = {
              ...this.datatableConfig,
              data: [...this.companySalePayments],
            };

            this.cdr.detectChanges();
            this.reloadEvent.emit(true);
          },
          error: (error) => {
            const rawMessage = error?.error?.message ?? '';
            const matched = rawMessage.match(/amount of (\d+(\.\d+)?)/); // Extract number
            const total = matched ? matched[1] : '---';

            this.alertService.showTranslatedAlert({
              alertType: 'error',
              messageKey: 'ERROR.COMPANY_SALE_TOTAL_AGREED_EXCEEDED',
              params: { total: total },
            });

            this.isLoading = false;
          },
          complete: completeFn,
        });

      this.unsubscribe.push(updateSub);
    };

    const createFn = () => {
      const createSub = this.companySalePaymentService
        .createCompanySalePayment(paymentPayload)
        .subscribe({
          next: () => {
            this.alertService.showTranslatedAlert({ alertType: 'success' });
            this.loadCompanySalePaymentsById(this.companySaleId);

            this.paymentForm.resetForm();
          },
          error: (error) => {
            const rawMessage = error?.error?.message ?? '';
            const matched = rawMessage.match(/amount of (\d+(\.\d+)?)/); // Extract number
            const total = matched ? matched[1] : '---';

            this.alertService.showTranslatedAlert({
              alertType: 'error',
              messageKey: 'ERROR.COMPANY_SALE_TOTAL_AGREED_EXCEEDED',
              params: { total: total },
            });

            this.isLoading = false;
          },
          complete: completeFn,
        });

      this.unsubscribe.push(createSub);
    };

    if (this.companySalePaymentModel.id) {
      updateFn();
    } else {
      createFn();
    }
  }

  async create() {
    this.companySalePaymentModel = {} as ICompanySalePaymentModel;
    this.companySalePaymentModel.companySale = this.companySaleId;
    this.companySalePaymentModel.paymentMethod = {} as IPaymentMethodModel;

    await this.openPaymentModal();
  }

  delete(id: string): void {
    const deleteSub = this.companySalePaymentService
      .deleteCompanySalePayment(id)
      .subscribe({
        next: () => {
          this.companySalePayments = this.companySalePayments.filter(
            (item) => item.id !== id
          );

          this.datatableConfig = {
            ...this.datatableConfig,
            data: [...this.companySalePayments],
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
    const foundItem = this.companySalePayments.find((item) => item.id === id);
    this.companySalePaymentModel =
      foundItem ?? ({} as ICompanySalePaymentModel);

    this.companySalePaymentModel.paymentDate =
      this.dateUtils.formatISOToDateInput(
        this.companySalePaymentModel.paymentDate
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

  ngOnDestroy(): void {
    // Limpiar todas las suscripciones
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
    this.reloadEvent.unsubscribe();
  }
}
