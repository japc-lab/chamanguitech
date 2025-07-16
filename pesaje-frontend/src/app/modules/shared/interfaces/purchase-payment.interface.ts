import { IPaymentMethodModel } from './payment-method.interface';

export interface IPurchasePaymentModel {
  purchase: string;
  paymentMethod: IPaymentMethodModel;
  amount: number;
  paymentDate: string;
  deletedAt?: Date;
  id: string;
}

export interface ICreateUpdatePurchasePaymentModel {
  id?: string;
  purchase: string;
  paymentMethod: string;
  amount: number;
  paymentDate: string;
}

export interface IReadPurchasePaymentModel {
  ok: boolean;
  data: IPurchasePaymentModel[];
}
