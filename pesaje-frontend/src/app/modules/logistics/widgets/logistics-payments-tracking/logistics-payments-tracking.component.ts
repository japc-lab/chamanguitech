import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { ILogisticsItemModel } from '../../interfaces/logistics-item.interface';
import { LogisticsFinanceCategoryEnum } from '../../interfaces/logistics.interface';
import { IPaymentMethodModel } from '../../../shared/interfaces/payment-method.interface';
import { ILogisticsPaymentModel } from '../../interfaces/logistics-payment.interface';
import { PaymentMethodService } from '../../../shared/services/payment-method.service';
import { DateUtilsService } from '../../../../utils/date-utils.service';

@Component({
  selector: 'app-logistics-payments-tracking',
  templateUrl: './logistics-payments-tracking.component.html',
  styleUrls: ['./logistics-payments-tracking.component.scss'],
})
export class LogisticsPaymentsTrackingComponent implements OnInit, OnChanges {
  @Input() logisticsItems: ILogisticsItemModel[] = [];
  @Input() logisticsPayments: ILogisticsPaymentModel[] = [];
  @Input() isEditMode: boolean = false;
  @Input() showValidationErrors: boolean = false;
  @Output() logisticsPaymentsChange = new EventEmitter<ILogisticsPaymentModel[]>();

  title: string = 'Resumen de Logística';

  paymentStatuses = [
    { value: 'NO_PAYMENT', label: 'Sin pagos' },
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'PAID', label: 'Pagado' },
  ];

  paymentMethods: IPaymentMethodModel[] = [];

  invoiceOptions = [
    { value: 'yes', label: 'SÍ' },
    { value: 'no', label: 'NO' },
    { value: 'not-applicable', label: 'N/A' },
  ];

  constructor(
    private paymentMethodService: PaymentMethodService,
    private dateUtils: DateUtilsService
  ) {}

  ngOnInit(): void {
    this.loadPaymentMethods();
    this.initializePaymentsForCategories();
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
      const existingPayment = this.logisticsPayments.find(p => p.financeCategory === category);

      if (existingPayment && this.isEditMode) {
        // In edit mode: preserve existing payment data, only update amount and format date
        const updatedPayment = {
          ...existingPayment,
          amount: total,
          paymentDate: existingPayment.paymentDate ? this.dateUtils.formatISOToDateInput(existingPayment.paymentDate) : undefined
        };

        // Ensure payment method is properly set for dropdown
        if (existingPayment.paymentMethod && this.paymentMethods.length > 0) {
          // Find the matching payment method object from the loaded methods
          const paymentMethodId = typeof existingPayment.paymentMethod === 'string'
            ? existingPayment.paymentMethod
            : existingPayment.paymentMethod?.id;

          const matchingMethod = this.paymentMethods.find(method => method.id === paymentMethodId);
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

  onPaymentMethodChange(payment: ILogisticsPaymentModel, method: IPaymentMethodModel): void {
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
    return method ? method.name : 'Seleccionar';
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
        return 'Subtotal logística a pagar con factura';
      case 'PETTY_CASH':
        return 'Subtotal logística a pagar con caja chica';
      case 'ADDITIONAL':
        return 'Subtotal logística adicional';
      default:
        return 'Subtotal logística';
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
    return !this.isPaymentDateValid(payment) ||
           !this.isPaymentMethodValid(payment) ||
           !this.isPersonInChargeValid(payment) ||
           !this.isInvoiceNumberValid(payment) ||
           !this.isInvoiceNameValid(payment);
  }

  getValidationErrors(payment: ILogisticsPaymentModel): string[] {
    const errors: string[] = [];

    if (!this.isPaymentDateValid(payment)) {
      errors.push('Fecha de pago es requerida');
    }
    if (!this.isPaymentMethodValid(payment)) {
      errors.push('Método de pago es requerido');
    }
    if (!this.isPersonInChargeValid(payment)) {
      errors.push('Persona encargada es requerida');
    }
    if (!this.isInvoiceNumberValid(payment)) {
      errors.push('Número de factura es requerido');
    }
    if (!this.isInvoiceNameValid(payment)) {
      errors.push('Nombre de factura es requerido');
    }

    return errors;
  }
}
