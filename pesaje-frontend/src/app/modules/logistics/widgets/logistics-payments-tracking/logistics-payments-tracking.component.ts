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

    // Check if we're in edit mode (existing payments)
    const isEditMode = this.logisticsPayments.length > 0;

    if (isEditMode) {
      // In edit mode: preserve existing payment data, only update amounts and filter out categories without items
      const updatedPayments: ILogisticsPaymentModel[] = [];

      this.logisticsPayments.forEach(existingPayment => {
        const categoryTotal = categoryTotals.get(existingPayment.financeCategory);
        if (categoryTotal !== undefined) {
          // Category has items, keep the payment with updated amount and format date
          const updatedPayment = {
            ...existingPayment,
            amount: categoryTotal,
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
        }
        // If categoryTotal is undefined, the category has no items, so we don't include this payment
      });

      this.logisticsPayments = updatedPayments;
    } else {
      // In create mode: create new payments for categories with items
      this.logisticsPayments = [];
      categoryTotals.forEach((total, category) => {
        this.logisticsPayments.push({
          financeCategory: category as LogisticsFinanceCategoryEnum,
          amount: total,
          paymentStatus: 'NO_PAYMENT',
          hasInvoice: 'no',
          isCompleted: false,
        } as ILogisticsPaymentModel);
      });
    }

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
}
