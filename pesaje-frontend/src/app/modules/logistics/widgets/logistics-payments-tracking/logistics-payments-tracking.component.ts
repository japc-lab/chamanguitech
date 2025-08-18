import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { ILogisticsItemModel } from '../../interfaces/logistics-item.interface';
import { LogisticsFinanceCategoryEnum } from '../../interfaces/logistics.interface';
import { IPaymentMethodModel } from '../../../shared/interfaces/payment-method.interface';
import { PaymentMethodService } from '../../../shared/services/payment-method.service';
import { debounceTime, Subject, Subscription } from 'rxjs';

export interface ILogisticsPaymentModel {
  id?: string;
  description: string;
  amount: number;
  paymentStatus: 'NO_PAYMENT' | 'PENDING' | 'PAID';
  paymentDate?: string;
  paymentMethod?: IPaymentMethodModel;
  hasInvoice: 'true' | 'false' | 'null';
  invoiceNumber?: string;
  invoiceName?: string;
  personInCharge?: string;
  isComplete: boolean;
  observations?: string;
}

@Component({
  selector: 'app-logistics-payments-tracking',
  templateUrl: './logistics-payments-tracking.component.html',
  styleUrls: ['./logistics-payments-tracking.component.scss'],
})
export class LogisticsPaymentsTrackingComponent implements OnInit, OnChanges, OnDestroy {
  @Input() title: string = 'Seguimiento de Pagos de Logística';
  @Input() payments: ILogisticsPaymentModel[] = [];
  @Input() logisticsItems: ILogisticsItemModel[] = [];
  @Output() paymentsChange = new EventEmitter<ILogisticsPaymentModel[]>();

  paymentStatuses = [
    { value: 'NO_PAYMENT', label: 'Sin pagos' },
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'PAID', label: 'Pagado' },
  ];

  paymentMethods: IPaymentMethodModel[] = [];

  // Debounced emit changes
  private emitChangesSubject = new Subject<void>();
  private emitChangesSubscription: Subscription;

  invoiceOptions = [
    { value: 'true', label: 'SÍ' },
    { value: 'false', label: 'NO' },
    { value: 'null', label: 'N/A' },
  ];

  // Default payment categories based on the image
  defaultPayments: ILogisticsPaymentModel[] = [
    {
      description: 'Subtotal logística a pagar con factura',
      amount: 0,
      paymentStatus: 'NO_PAYMENT',
      hasInvoice: 'true',
      isComplete: false,
    },
    {
      description: 'Subtotal logística a pagar con caja chica',
      amount: 0,
      paymentStatus: 'NO_PAYMENT',
      hasInvoice: 'false',
      isComplete: false,
    },
    {
      description: 'Subtotal logística adicional',
      amount: 0,
      paymentStatus: 'NO_PAYMENT',
      hasInvoice: 'null',
      isComplete: false,
    },
  ];

  constructor(private paymentMethodService: PaymentMethodService) {}

  ngOnInit(): void {
    this.loadPaymentMethods();
    if (!this.payments || this.payments.length === 0) {
      this.payments = [...this.defaultPayments];
    }
    this.updateCompleteness();

    // Update amounts if logistics items are already available
    if (this.logisticsItems && this.logisticsItems.length > 0) {
      this.updatePaymentAmounts();
    }

    // Set up debounced emit changes
    this.emitChangesSubscription = this.emitChangesSubject
      .pipe(debounceTime(300))
      .subscribe(() => {
        this.paymentsChange.emit(this.payments);
      });
  }

  loadPaymentMethods(): void {
    this.paymentMethodService.getAllPaymentsMethods().subscribe({
      next: (methods) => {
        this.paymentMethods = methods;
      },
      error: (error) => {
        console.error('Error loading payment methods:', error);
      },
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['logisticsItems'] && this.logisticsItems) {
      this.updatePaymentAmounts();
    }
  }

  updatePayment(
    index: number,
    field: keyof ILogisticsPaymentModel,
    value: any
  ): void {
    // Update the specific field directly to prevent full object recreation
    (this.payments[index] as any)[field] = value;
    this.updateCompleteness();
    this.emitChanges();
  }

  onPaymentStatusChange(index: number, value: string): void {
    this.updatePayment(index, 'paymentStatus', value);
  }

  onPaymentDateChange(index: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updatePayment(index, 'paymentDate', target.value);
  }

  onPaymentMethodChange(index: number, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedMethod = this.paymentMethods.find(
      (m) => m.id === target.value
    );
    this.updatePayment(index, 'paymentMethod', selectedMethod);
  }

  onHasInvoiceChange(index: number, value: string): void {
    this.updatePayment(index, 'hasInvoice', value);
  }

  onInvoiceNumberChange(index: number, value: string): void {
    this.updatePayment(index, 'invoiceNumber', value);
  }

  onInvoiceNameChange(index: number, value: string): void {
    this.updatePayment(index, 'invoiceName', value);
  }

  onPersonInChargeChange(index: number, value: string): void {
    this.updatePayment(index, 'personInCharge', value);
  }

  onObservationsChange(index: number, value: string): void {
    this.updatePayment(index, 'observations', value);
  }

  updateCompleteness(): void {
    this.payments.forEach((payment) => {
      const isComplete = this.checkPaymentCompleteness(payment);
      payment.isComplete = isComplete;
    });
  }

  checkPaymentCompleteness(payment: ILogisticsPaymentModel): boolean {
    // Basic required fields
    if (!payment.description || payment.amount <= 0) {
      return false;
    }

    // If payment status is PAID, require additional fields
    if (payment.paymentStatus === 'PAID') {
      if (
        !payment.paymentDate ||
        !payment.paymentMethod?.id ||
        !payment.personInCharge
      ) {
        return false;
      }

      // If has invoice is true, require invoice details
      if (payment.hasInvoice === 'true') {
        if (!payment.invoiceNumber || !payment.invoiceName) {
          return false;
        }
      }
    }

    return true;
  }

  getPaymentStatusLabel(status: string): string {
    const found = this.paymentStatuses.find((s) => s.value === status);
    return found ? found.label : status;
  }

  getPaymentMethodLabel(method: IPaymentMethodModel | undefined): string {
    return method ? method.name : '';
  }

  getInvoiceLabel(hasInvoice: boolean | null): string {
    if (hasInvoice === true) return 'SÍ';
    if (hasInvoice === false) return 'NO';
    return 'N/A';
  }

  getTotalAmount(): number {
    return this.getVisiblePayments().reduce(
      (sum, payment) => sum + (payment.amount || 0),
      0
    );
  }

  getOverallPaymentStatus(): string {
    const visiblePayments = this.getVisiblePayments();
    const paidPayments = visiblePayments.filter(
      (p) => p.paymentStatus === 'PAID'
    );
    const totalPayments = visiblePayments.filter((p) => p.amount > 0);

    if (totalPayments.length === 0) return 'NO_PAYMENT';
    if (paidPayments.length === totalPayments.length) return 'PAID';
    return 'PENDING';
  }

  getOverallPaymentStatusLabel(): string {
    const status = this.getOverallPaymentStatus();
    return this.getPaymentStatusLabel(status);
  }

  updatePaymentAmounts(): void {
    if (!this.logisticsItems || this.logisticsItems.length === 0) {
      return;
    }

    // Calculate subtotals for each finance category
    const categorySubtotals = this.calculateCategorySubtotals();

    // Update payment amounts based on category
    this.payments.forEach((payment) => {
      if (payment.description.includes('factura')) {
        payment.amount =
          categorySubtotals[LogisticsFinanceCategoryEnum.INVOICE] || 0;
      } else if (payment.description.includes('caja chica')) {
        payment.amount =
          categorySubtotals[LogisticsFinanceCategoryEnum.PETTY_CASH] || 0;
      } else if (payment.description.includes('adicional')) {
        payment.amount =
          categorySubtotals[LogisticsFinanceCategoryEnum.ADDITIONAL] || 0;
      }
    });

    this.updateCompleteness();
    this.emitChanges();
  }

  getVisiblePayments(): ILogisticsPaymentModel[] {
    if (!this.logisticsItems || this.logisticsItems.length === 0) {
      return [];
    }

    // Get categories that have items
    const categoriesWithItems = new Set(
      this.logisticsItems
        .filter(item => item.financeCategory && item.total && Number(item.total) > 0)
        .map(item => item.financeCategory)
    );

    // Filter payments to show only those with categories that have items
    return this.payments.filter(payment => {
      if (payment.description.includes('factura')) {
        return categoriesWithItems.has(LogisticsFinanceCategoryEnum.INVOICE);
      } else if (payment.description.includes('caja chica')) {
        return categoriesWithItems.has(LogisticsFinanceCategoryEnum.PETTY_CASH);
      } else if (payment.description.includes('adicional')) {
        return categoriesWithItems.has(LogisticsFinanceCategoryEnum.ADDITIONAL);
      }
      return false;
    });
  }

  private calculateCategorySubtotals(): {
    [key in LogisticsFinanceCategoryEnum]: number;
  } {
    const subtotals = {
      [LogisticsFinanceCategoryEnum.INVOICE]: 0,
      [LogisticsFinanceCategoryEnum.PETTY_CASH]: 0,
      [LogisticsFinanceCategoryEnum.ADDITIONAL]: 0,
    };

    this.logisticsItems.forEach((item) => {
      if (item.financeCategory && item.total) {
        subtotals[item.financeCategory] += Number(item.total) || 0;
      }
    });

    return subtotals;
  }

  private emitChanges(): void {
    this.emitChangesSubject.next();
  }

  ngOnDestroy(): void {
    if (this.emitChangesSubscription) {
      this.emitChangesSubscription.unsubscribe();
    }
  }
}
