import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import {
  ILocalSaleDetailModel,
  ILocalSaleDetailItemModel,
} from '../../interfaces/local-sale-detail.interface';
import { SaleStyleEnum } from '../../interfaces/sale.interface';
import { InputUtilsService } from 'src/app/utils/input-utils.service';
import { NgModel } from '@angular/forms';
import { IPaymentMethodModel } from '../../../shared/interfaces/payment-method.interface';
import { PaymentMethodService } from '../../../shared/services/payment-method.service';

@Component({
  selector: 'app-local-sale-detail',
  templateUrl: './local-sale-detail.component.html',
  styleUrls: ['./local-sale-detail.component.scss'],
})
export class LocalSaleDetailComponent implements OnInit, OnChanges {
  @Input() style: SaleStyleEnum;
  @Input() localSaleDetail: ILocalSaleDetailModel | null = null;
  @Output() localSaleDetailChange = new EventEmitter<ILocalSaleDetailModel>();

  title = '';
  sizePlaceholder = '';
  paymentMethods: IPaymentMethodModel[] = [];
  paymentStatuses = [
    { value: 'NO_PAYMENT', label: 'Sin pagos' },
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'PAID', label: 'Pagado' },
  ];
  invoiceOptions = [
    { value: 'yes', label: 'SÍ' },
    { value: 'no', label: 'NO' },
    { value: 'not-applicable', label: 'N/A' },
  ];

  constructor(
    private inputUtils: InputUtilsService,
    private paymentMethodService: PaymentMethodService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Ensure the detail has the correct style whenever localSaleDetail changes
    if (changes['localSaleDetail'] && this.localSaleDetail) {
      this.localSaleDetail.style = this.style;
    }
  }

  ngOnInit(): void {
    if (this.style === SaleStyleEnum.WHOLE) {
      this.title = 'Con Cabeza';
      this.sizePlaceholder = '20/30';
    } else {
      this.title = 'Sin Cabeza';
      this.sizePlaceholder = '36/41';
    }

    // Ensure the detail has the correct style if it exists
    if (this.localSaleDetail) {
      this.localSaleDetail.style = this.style;
    }

    this.loadPaymentMethods();
    this.recalculateAll();
  }

  loadPaymentMethods(): void {
    this.paymentMethodService.getAllPaymentsMethods().subscribe({
      next: (paymentMethods: IPaymentMethodModel[]) => {
        this.paymentMethods = paymentMethods;
      },
      error: (error: any) => {
        console.error('Error loading payment methods:', error);
      },
    });
  }

  addDetail(): void {
    // Create detail if it doesn't exist
    if (!this.localSaleDetail) {
      this.localSaleDetail = {
        style: this.style,
        grandTotal: 0,
        receivedGrandTotal: 0,
        poundsGrandTotal: 0,
        items: [],
      };
      this.emitChanges();
    }
  }

  addItem(): void {
    // Ensure we have a detail first
    if (!this.localSaleDetail) {
      this.addDetail();
    }

    const newItem: ILocalSaleDetailItemModel = {
      size: '',
      pounds: 0,
      price: 0,
      total: 0,
      merchantName: '',
      merchantId: '',
      paymentStatus: 'NO_PAYMENT',
      hasInvoice: 'no',
    };

    this.localSaleDetail!.items.push(newItem);
    this.recalculateTotals(this.localSaleDetail!);
  }

  removeItem(itemIndex: number): void {
    if (this.localSaleDetail && this.localSaleDetail.items.length > 0) {
      this.localSaleDetail.items.splice(itemIndex, 1);
      this.recalculateTotals(this.localSaleDetail);
    }
  }

  recalculateTotals(detail: ILocalSaleDetailModel): void {
    let total = 0;
    let pounds = 0;
    let receivedTotal = 0;

    detail.items?.forEach((item) => {
      item.total = Number(
        (Number(item.pounds) || 0) * (Number(item.price) || 0)
      );
      pounds += Number(item.pounds) || 0;
      total += item.total || 0;
      receivedTotal += Number(item.totalReceived) || 0;
    });

    // Ensure two decimals
    detail.grandTotal = Number(total.toFixed(2));
    detail.receivedGrandTotal = Number(receivedTotal.toFixed(2));
    detail.poundsGrandTotal = Number(pounds.toFixed(2));

    this.emitChanges();
  }

  recalculateAll(): void {
    if (this.localSaleDetail) {
      this.recalculateTotals(this.localSaleDetail);
    }
  }

  validateNumber(event: KeyboardEvent) {
    this.inputUtils.validateNumber(event);
  }

  formatDecimal(control: NgModel) {
    if (!control || control.value == null) return;

    const value = parseFloat(control.value).toFixed(2);
    control.control.setValue(Number(value), { emitEvent: false });
  }

  validateSizeFormat(event: KeyboardEvent): void {
    const allowedPattern = /^[0-9\/]*$/;
    const inputChar = event.key;

    if (!allowedPattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  onPaymentStatusChange(item: ILocalSaleDetailItemModel, status: string): void {
    item.paymentStatus = status as 'NO_PAYMENT' | 'PENDING' | 'PAID';

    // Clear payment method and invoice fields if not PAID
    if (status !== 'PAID') {
      item.paymentMethod = undefined;
      item.hasInvoice = 'not-applicable';
      item.invoiceNumber = undefined;
    }

    this.emitChanges();
  }

  onPaymentMethodChange(
    item: ILocalSaleDetailItemModel,
    paymentMethodId: string
  ): void {
    const selectedMethod = this.paymentMethods.find(
      (pm) => pm.id === paymentMethodId
    );
    item.paymentMethod = selectedMethod || paymentMethodId;
    this.emitChanges();
  }

  onInvoiceChange(item: ILocalSaleDetailItemModel, hasInvoice: string): void {
    item.hasInvoice = hasInvoice as 'yes' | 'no' | 'not-applicable';

    // Clear invoice number if not 'yes'
    if (hasInvoice !== 'yes') {
      item.invoiceNumber = undefined;
    }

    this.emitChanges();
  }

  getSelectedPaymentMethodId(item: ILocalSaleDetailItemModel): string {
    if (typeof item.paymentMethod === 'string') {
      return item.paymentMethod;
    }
    return item.paymentMethod?.id || '';
  }

  isPaymentMethodRequired(item: ILocalSaleDetailItemModel): boolean {
    return item.paymentStatus === 'PAID';
  }

  isInvoiceNumberRequired(item: ILocalSaleDetailItemModel): boolean {
    return item.hasInvoice === 'yes';
  }

  getTotalPago(item: ILocalSaleDetailItemModel): number {
    const payment1 = Number(item.paymentOne) || 0;
    const payment2 = Number(item.paymentTwo) || 0;
    return Number((payment1 + payment2).toFixed(2));
  }

  emitChanges(): void {
    if (this.localSaleDetail) {
      // Ensure style is always set correctly before emitting
      this.localSaleDetail.style = this.style;
      this.localSaleDetailChange.emit(this.localSaleDetail);
    }
  }
}
