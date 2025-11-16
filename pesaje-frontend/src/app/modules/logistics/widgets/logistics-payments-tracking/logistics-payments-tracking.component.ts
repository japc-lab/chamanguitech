import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { ILogisticsItemModel } from '../../interfaces/logistics-item.interface';
import { LogisticsFinanceCategoryEnum } from '../../interfaces/logistics.interface';
import { IPaymentMethodModel } from '../../../shared/interfaces/payment-method.interface';
import { ILogisticsPaymentModel } from '../../interfaces/logistics-payment.interface';
import { PaymentMethodService } from '../../../shared/services/payment-method.service';
import { DateUtilsService } from '../../../../utils/date-utils.service';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-logistics-payments-tracking',
  templateUrl: './logistics-payments-tracking.component.html',
  styleUrls: ['./logistics-payments-tracking.component.scss'],
})
export class LogisticsPaymentsTrackingComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() logisticsItems: ILogisticsItemModel[] = [];
  @Input() logisticsPayments: ILogisticsPaymentModel[] = [];
  @Input() isEditMode: boolean = false;
  @Input() showValidationErrors: boolean = false;
  @Output() logisticsPaymentsChange = new EventEmitter<
    ILogisticsPaymentModel[]
  >();

  title: string = '';

  paymentStatuses: { value: string; label: string }[] = [];
  paymentMethods: IPaymentMethodModel[] = [];
  invoiceOptions: { value: string; label: string }[] = [];

  private langChangeSubscription?: Subscription;

  constructor(
    private paymentMethodService: PaymentMethodService,
    private dateUtils: DateUtilsService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.initializeTranslations();
    this.loadPaymentMethods();
    this.initializePaymentsForCategories();
    this.subscribeToLanguageChanges();
  }

  ngOnDestroy(): void {
    if (this.langChangeSubscription) {
      this.langChangeSubscription.unsubscribe();
    }
  }

  subscribeToLanguageChanges(): void {
    this.langChangeSubscription = this.translate.onLangChange.subscribe(() => {
      this.initializeTranslations();
    });
  }

  initializeTranslations(): void {
    this.title = this.translate.instant('LOGISTICS.PAYMENTS.TITLE');

    this.paymentStatuses = [
      {
        value: 'NO_PAYMENT',
        label: this.translate.instant(
          'LOGISTICS.PAYMENTS.PAYMENT_STATUS_OPTIONS.NO_PAYMENT'
        ),
      },
      {
        value: 'PENDING',
        label: this.translate.instant(
          'LOGISTICS.PAYMENTS.PAYMENT_STATUS_OPTIONS.PENDING'
        ),
      },
      {
        value: 'PAID',
        label: this.translate.instant(
          'LOGISTICS.PAYMENTS.PAYMENT_STATUS_OPTIONS.PAID'
        ),
      },
    ];

    this.invoiceOptions = [
      {
        value: 'yes',
        label: this.translate.instant('LOGISTICS.PAYMENTS.INVOICE_OPTIONS.YES'),
      },
      {
        value: 'no',
        label: this.translate.instant('LOGISTICS.PAYMENTS.INVOICE_OPTIONS.NO'),
      },
      {
        value: 'not-applicable',
        label: this.translate.instant(
          'LOGISTICS.PAYMENTS.INVOICE_OPTIONS.NOT_APPLICABLE'
        ),
      },
    ];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['logisticsItems'] && this.logisticsItems) {
      this.initializePaymentsForCategories();
    }
  }

  loadPaymentMethods(): void {
    this.paymentMethodService.getAllPaymentsMethods().subscribe({
      next: (methods: IPaymentMethodModel[]) => {
        this.paymentMethods = methods;
      },
      error: (error: any) => {
        console.error('Error loading payment methods:', error);
      },
    });
  }

  initializePaymentsForCategories(): void {
    if (!this.logisticsItems || this.logisticsItems.length === 0) {
      // Clear all payments if no items
      this.logisticsPayments = [];
      this.emitChanges();
      return;
    }

    // Group items by finance category and calculate totals
    const categoryTotals = new Map<string, number>();
    this.logisticsItems.forEach((item) => {
      const category = item.financeCategory;
      const currentTotal = categoryTotals.get(category) || 0;
      categoryTotals.set(category, currentTotal + item.total);
    });

    // Always create/update payments for categories with items, regardless of edit mode
    const updatedPayments: ILogisticsPaymentModel[] = [];

    categoryTotals.forEach((total, category) => {
      // Check if we have an existing payment for this category
      const existingPayment = this.logisticsPayments.find(
        (p) => p.financeCategory === category
      );

      if (existingPayment && this.isEditMode) {
        // In edit mode: preserve existing payment data, only update amount and format date
        const updatedPayment = {
          ...existingPayment,
          amount: total,
          paymentDate: existingPayment.paymentDate
            ? this.dateUtils.formatISOToDateInput(existingPayment.paymentDate)
            : undefined,
        };

        // Ensure payment method is properly set for dropdown
        if (existingPayment.paymentMethod && this.paymentMethods.length > 0) {
          // Find the matching payment method object from the loaded methods
          const paymentMethodId =
            typeof existingPayment.paymentMethod === 'string'
              ? existingPayment.paymentMethod
              : existingPayment.paymentMethod?.id;

          const matchingMethod = this.paymentMethods.find(
            (method) => method.id === paymentMethodId
          );
          if (matchingMethod) {
            updatedPayment.paymentMethod = matchingMethod;
          }
        }

        updatedPayments.push(updatedPayment);
      } else {
        // Create new payment for this category
        updatedPayments.push({
          financeCategory: category as LogisticsFinanceCategoryEnum,
          amount: total,
          paymentStatus: 'NO_PAYMENT',
          hasInvoice: 'no',
          isCompleted: false,
        } as ILogisticsPaymentModel);
      }
    });

    this.logisticsPayments = updatedPayments;

    // Emit changes to update parent component
    this.emitChanges();
  }

  // Event handlers for payments
  onPaymentStatusChange(payment: ILogisticsPaymentModel, value: string): void {
    payment.paymentStatus = value as 'NO_PAYMENT' | 'PENDING' | 'PAID';
    this.updatePaymentCompleteness(payment);
    this.emitChanges();
  }

  onPaymentDateChange(payment: ILogisticsPaymentModel, value: string): void {
    payment.paymentDate = value;
    this.updatePaymentCompleteness(payment);
    this.emitChanges();
  }

  onPaymentMethodChange(
    payment: ILogisticsPaymentModel,
    method: IPaymentMethodModel
  ): void {
    payment.paymentMethod = method;
    this.updatePaymentCompleteness(payment);
    this.emitChanges();
  }

  onHasInvoiceChange(payment: ILogisticsPaymentModel, value: string): void {
    payment.hasInvoice = value as 'yes' | 'no' | 'not-applicable';
    this.updatePaymentCompleteness(payment);
    this.emitChanges();
  }

  onInvoiceNumberChange(payment: ILogisticsPaymentModel, value: string): void {
    payment.invoiceNumber = value;
    this.updatePaymentCompleteness(payment);
    this.emitChanges();
  }

  onInvoiceNameChange(payment: ILogisticsPaymentModel, value: string): void {
    payment.invoiceName = value;
    this.updatePaymentCompleteness(payment);
    this.emitChanges();
  }

  onPersonInChargeChange(payment: ILogisticsPaymentModel, value: string): void {
    payment.personInCharge = value;
    this.updatePaymentCompleteness(payment);
    this.emitChanges();
  }

  onObservationChange(payment: ILogisticsPaymentModel, value: string): void {
    payment.observation = value;
    this.emitChanges();
  }

  updatePaymentCompleteness(payment: ILogisticsPaymentModel): void {
    payment.isCompleted = this.checkPaymentCompleteness(payment);
  }

  checkPaymentCompleteness(payment: ILogisticsPaymentModel): boolean {
    // Only show "Completo" when status is PAID and all required fields are filled
    if (payment.paymentStatus !== 'PAID') {
      return false;
    }

    // Check required fields for paid status
    const hasRequiredFields =
      payment.paymentDate &&
      (payment.paymentMethod?.id || payment.paymentMethod) &&
      payment.personInCharge;

    if (!hasRequiredFields) return false;

    // Check invoice fields if invoice is required
    if (payment.hasInvoice === 'yes') {
      return !!(payment.invoiceNumber && payment.invoiceName);
    }

    return true;
  }

  getPaymentStatusLabel(status: string): string {
    const statusObj = this.paymentStatuses.find((s) => s.value === status);
    return statusObj ? statusObj.label : status;
  }

  getPaymentMethodLabel(methodId: string): string {
    const method = this.paymentMethods.find((m) => m.id === methodId);
    return method
      ? this.getPaymentMethodName(method)
      : this.translate.instant('LOGISTICS.PAYMENTS.SELECT_PAYMENT_METHOD');
  }

  getInvoiceLabel(value: string): string {
    const option = this.invoiceOptions.find((o) => o.value === value);
    return option ? option.label : value;
  }

  getTotalAmount(): number {
    return this.logisticsPayments.reduce(
      (sum, payment) => sum + (payment.amount || 0),
      0
    );
  }

  getOverallPaymentStatus(): 'NO_PAYMENT' | 'PENDING' | 'PAID' {
    const paidCount = this.logisticsPayments.filter(
      (p) => p.paymentStatus === 'PAID'
    ).length;
    const pendingCount = this.logisticsPayments.filter(
      (p) => p.paymentStatus === 'PENDING'
    ).length;

    if (paidCount === this.logisticsPayments.length) return 'PAID';
    if (pendingCount > 0 || paidCount > 0) return 'PENDING';
    return 'NO_PAYMENT';
  }

  getOverallPaymentStatusLabel(): string {
    return this.getPaymentStatusLabel(this.getOverallPaymentStatus());
  }

  emitChanges(): void {
    this.logisticsPaymentsChange.emit(this.logisticsPayments);
  }

  getDescriptionForCategory(financeCategory: string): string {
    switch (financeCategory) {
      case 'INVOICE':
        return this.translate.instant(
          'LOGISTICS.PAYMENTS.CATEGORY_DESCRIPTIONS.INVOICE'
        );
      case 'PETTY_CASH':
        return this.translate.instant(
          'LOGISTICS.PAYMENTS.CATEGORY_DESCRIPTIONS.PETTY_CASH'
        );
      case 'ADDITIONAL':
        return this.translate.instant(
          'LOGISTICS.PAYMENTS.CATEGORY_DESCRIPTIONS.ADDITIONAL'
        );
      default:
        return this.translate.instant(
          'LOGISTICS.PAYMENTS.CATEGORY_DESCRIPTIONS.DEFAULT'
        );
    }
  }

  // Validation methods
  isPaymentDateRequired(payment: ILogisticsPaymentModel): boolean {
    return payment.paymentStatus === 'PAID';
  }

  isPaymentDateValid(payment: ILogisticsPaymentModel): boolean {
    if (!this.isPaymentDateRequired(payment)) return true;
    return !!payment.paymentDate;
  }

  isPaymentMethodRequired(payment: ILogisticsPaymentModel): boolean {
    return payment.paymentStatus === 'PAID';
  }

  isPaymentMethodValid(payment: ILogisticsPaymentModel): boolean {
    if (!this.isPaymentMethodRequired(payment)) return true;
    return !!(payment.paymentMethod?.id || payment.paymentMethod);
  }

  isPersonInChargeRequired(payment: ILogisticsPaymentModel): boolean {
    return payment.paymentStatus === 'PAID';
  }

  isPersonInChargeValid(payment: ILogisticsPaymentModel): boolean {
    if (!this.isPersonInChargeRequired(payment)) return true;
    return !!payment.personInCharge;
  }

  isInvoiceNumberRequired(payment: ILogisticsPaymentModel): boolean {
    return payment.paymentStatus === 'PAID' && payment.hasInvoice === 'yes';
  }

  isInvoiceNumberValid(payment: ILogisticsPaymentModel): boolean {
    if (!this.isInvoiceNumberRequired(payment)) return true;
    return !!payment.invoiceNumber;
  }

  isInvoiceNameRequired(payment: ILogisticsPaymentModel): boolean {
    return payment.paymentStatus === 'PAID' && payment.hasInvoice === 'yes';
  }

  isInvoiceNameValid(payment: ILogisticsPaymentModel): boolean {
    if (!this.isInvoiceNameRequired(payment)) return true;
    return !!payment.invoiceName;
  }

  hasValidationErrors(payment: ILogisticsPaymentModel): boolean {
    return (
      !this.isPaymentDateValid(payment) ||
      !this.isPaymentMethodValid(payment) ||
      !this.isPersonInChargeValid(payment) ||
      !this.isInvoiceNumberValid(payment) ||
      !this.isInvoiceNameValid(payment)
    );
  }

  getValidationErrors(payment: ILogisticsPaymentModel): string[] {
    const errors: string[] = [];

    if (!this.isPaymentDateValid(payment)) {
      errors.push(
        this.translate.instant('LOGISTICS.VALIDATIONS.PAYMENT_DATE_REQUIRED')
      );
    }
    if (!this.isPaymentMethodValid(payment)) {
      errors.push(
        this.translate.instant('LOGISTICS.VALIDATIONS.PAYMENT_METHOD_REQUIRED')
      );
    }
    if (!this.isPersonInChargeValid(payment)) {
      errors.push(
        this.translate.instant(
          'LOGISTICS.VALIDATIONS.PERSON_IN_CHARGE_REQUIRED'
        )
      );
    }
    if (!this.isInvoiceNumberValid(payment)) {
      errors.push(
        this.translate.instant('LOGISTICS.VALIDATIONS.INVOICE_NUMBER_REQUIRED')
      );
    }
    if (!this.isInvoiceNameValid(payment)) {
      errors.push(
        this.translate.instant('LOGISTICS.VALIDATIONS.INVOICE_NAME_REQUIRED')
      );
    }

    return errors;
  }

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
}
