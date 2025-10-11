import { SaleStyleEnum } from './sale.interface';
import { IPaymentMethodModel } from '../../shared/interfaces/payment-method.interface';

export interface ILocalSaleDetailModel {
  id?: string;
  style?: SaleStyleEnum;
  grandTotal: number;
  receivedGrandTotal: number;
  poundsGrandTotal: number;
  retentionPercentage?: number;
  retentionAmount?: number;
  netGrandTotal: number;
  otherPenalties?: number;
  items: ILocalSaleDetailItemModel[];
}

export interface ILocalSaleDetailItemModel {
  id?: string;
  size: string;
  pounds: number;
  price: number;
  total: number;
  merchantName: string;
  merchantId: string;
  paymentOne?: number;
  paymentTwo?: number;
  paymentStatus: 'NO_PAYMENT' | 'PENDING' | 'PAID';
  paymentMethod?: IPaymentMethodModel | string;
  hasInvoice: 'yes' | 'no' | 'not-applicable';
  invoiceNumber?: string;
  totalReceived?: number;
}
