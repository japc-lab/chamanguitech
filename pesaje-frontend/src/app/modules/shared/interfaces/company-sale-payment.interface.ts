import { IPaymentMethodModel } from './payment-method.interface';

export interface ICompanySalePaymentModel {
  companySale: string;
  paymentMethod: IPaymentMethodModel;
  amount: number;
  paymentDate: string;
  deletedAt?: Date;
  id: string;
}

export interface ICreateUpdateCompanySalePaymentModel {
  id?: string;
  companySale: string;
  paymentMethod: string;
  amount: number;
  paymentDate: string;
}

export interface IReadCompanySalePaymentModel {
  ok: boolean;
  data: ICompanySalePaymentModel[];
}
