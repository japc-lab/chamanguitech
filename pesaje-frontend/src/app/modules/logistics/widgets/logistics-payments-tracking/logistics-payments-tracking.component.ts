import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ILogisticsItemModel } from '../../interfaces/logistics-item.interface';
import { LogisticsFinanceCategoryEnum } from '../../interfaces/logistics.interface';
import { IPaymentMethodModel } from '../../../shared/interfaces/payment-method.interface';
import { PaymentMethodService } from '../../../shared/services/payment-method.service';

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
export class LogisticsPaymentsTrackingComponent implements OnInit, OnChanges {
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
      hasInvoice: 'false',
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
      hasInvoice: 'false',
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
    this.updatePaymentAmounts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['logisticsItems'] && this.logisticsItems) {
      this.updatePaymentAmounts();
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

  updatePaymentAmounts(): void {
    if (!this.logisticsItems || this.logisticsItems.length === 0) return;

    const categorySubtotals = this.calculateCategorySubtotals();

    this.payments.forEach((payment) => {
      if (payment.description.includes('factura')) {
        payment.amount = categorySubtotals[LogisticsFinanceCategoryEnum.INVOICE] || 0;
      } else if (payment.description.includes('caja chica')) {
        payment.amount = categorySubtotals[LogisticsFinanceCategoryEnum.PETTY_CASH] || 0;
      } else if (payment.description.includes('adicional')) {
        payment.amount = categorySubtotals[LogisticsFinanceCategoryEnum.ADDITIONAL] || 0;
      }
    });
  }

  calculateCategorySubtotals(): { [key: string]: number } {
    const subtotals: { [key: string]: number } = {};

    this.logisticsItems.forEach((item) => {
      if (item.financeCategory && item.total) {
        if (!subtotals[item.financeCategory]) {
          subtotals[item.financeCategory] = 0;
        }
        subtotals[item.financeCategory] += item.total;
      }
    });

    return subtotals;
  }

  // Event handlers
  onPaymentStatusChange(index: number, value: string): void {
    this.payments[index].paymentStatus = value as 'NO_PAYMENT' | 'PENDING' | 'PAID';
    this.updateCompleteness();
    this.emitChanges();
  }

  onPaymentDateChange(index: number, event: any): void {
    this.payments[index].paymentDate = event.target.value;
    this.updateCompleteness();
    this.emitChanges();
  }

  onPaymentMethodChange(index: number, event: any): void {
    const methodId = event.target.value;
    const method = this.paymentMethods.find(m => m.id === methodId);
    this.payments[index].paymentMethod = method;
    this.updateCompleteness();
    this.emitChanges();
  }

  onHasInvoiceChange(index: number, value: string): void {
    this.payments[index].hasInvoice = value as 'true' | 'false' | 'null';
    this.updateCompleteness();
    this.emitChanges();
  }

  onInvoiceNumberChange(index: number, value: string): void {
    this.payments[index].invoiceNumber = value;
    this.updateCompleteness();
    this.emitChanges();
  }

  onInvoiceNameChange(index: number, value: string): void {
    this.payments[index].invoiceName = value;
    this.updateCompleteness();
    this.emitChanges();
  }

  onPersonInChargeChange(index: number, value: string): void {
    this.payments[index].personInCharge = value;
    this.updateCompleteness();
    this.emitChanges();
  }

  onObservationsChange(index: number, value: string): void {
    this.payments[index].observations = value;
    this.emitChanges();
  }

  updateCompleteness(): void {
    this.payments.forEach((payment) => {
      payment.isComplete = this.checkPaymentCompleteness(payment);
    });
  }

  checkPaymentCompleteness(payment: ILogisticsPaymentModel): boolean {
    // Only show "Completo" when status is PAID and all required fields are filled
    if (payment.paymentStatus !== 'PAID') {
      return false;
    }

    // Check required fields for paid status
    const hasRequiredFields = payment.paymentDate && payment.paymentMethod?.id && payment.personInCharge;

    if (!hasRequiredFields) return false;

    // Check invoice fields if invoice is required
    if (payment.hasInvoice === 'true') {
      return !!(payment.invoiceNumber && payment.invoiceName);
    }

    return true;
  }

  getPaymentStatusLabel(status: string): string {
    const statusObj = this.paymentStatuses.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  }

  getPaymentMethodLabel(methodId: string): string {
    const method = this.paymentMethods.find(m => m.id === methodId);
    return method ? method.name : 'Seleccionar';
  }

  getInvoiceLabel(value: string): string {
    const option = this.invoiceOptions.find(o => o.value === value);
    return option ? option.label : value;
  }

  getTotalAmount(): number {
    return this.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  }

  getOverallPaymentStatus(): 'NO_PAYMENT' | 'PENDING' | 'PAID' {
    const paidCount = this.payments.filter(p => p.paymentStatus === 'PAID').length;
    const pendingCount = this.payments.filter(p => p.paymentStatus === 'PENDING').length;
    const noPaymentCount = this.payments.filter(p => p.paymentStatus === 'NO_PAYMENT').length;

    if (paidCount === this.payments.length) return 'PAID';
    if (pendingCount > 0 || paidCount > 0) return 'PENDING';
    return 'NO_PAYMENT';
  }

  getOverallPaymentStatusLabel(): string {
    return this.getPaymentStatusLabel(this.getOverallPaymentStatus());
  }

  getVisiblePayments(): ILogisticsPaymentModel[] {
    if (!this.logisticsItems || this.logisticsItems.length === 0) {
      return [];
    }

    const categorySubtotals = this.calculateCategorySubtotals();

    return this.payments.filter(payment => {
      if (payment.description.includes('factura')) {
        return categorySubtotals[LogisticsFinanceCategoryEnum.INVOICE] > 0;
      } else if (payment.description.includes('caja chica')) {
        return categorySubtotals[LogisticsFinanceCategoryEnum.PETTY_CASH] > 0;
      } else if (payment.description.includes('adicional')) {
        return categorySubtotals[LogisticsFinanceCategoryEnum.ADDITIONAL] > 0;
      }
      return true;
    });
  }

  emitChanges(): void {
    this.paymentsChange.emit(this.payments);
  }
}
