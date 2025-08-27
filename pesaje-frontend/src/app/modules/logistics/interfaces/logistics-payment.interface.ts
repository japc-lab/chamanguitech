import { IPaymentMethodModel } from '../../shared/interfaces/payment-method.interface';
import { LogisticsFinanceCategoryEnum } from './logistics.interface';

export interface ILogisticsPaymentModel {
  id: string;
  financeCategory: LogisticsFinanceCategoryEnum;
  amount: number;
  paymentStatus: 'NO_PAYMENT' | 'PENDING' | 'PAID';
  paymentDate?: string;
  paymentMethod?: IPaymentMethodModel;
  hasInvoice: 'yes' | 'no' | 'not-applicable';
  invoiceNumber?: string;
  invoiceName?: string;
  personInCharge?: string;
  isCompleted: boolean;
  observation?: string;
}

export interface ICreateUpdateLogisticsPaymentModel {
  id?: string;
  financeCategory: LogisticsFinanceCategoryEnum;
  amount: number;
  paymentStatus: 'NO_PAYMENT' | 'PENDING' | 'PAID';
  paymentDate?: string;
  paymentMethod?: string;
  hasInvoice: 'yes' | 'no' | 'not-applicable';
  invoiceNumber?: string;
  invoiceName?: string;
  personInCharge?: string;
  isCompleted: boolean;
  observation?: string;
}
