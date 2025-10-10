import { IPaymentMethodModel } from '../../shared/interfaces/payment-method.interface';

export interface ILocalCompanySaleDetailPaymentModel {
  id?: string;
  localCompanySaleDetail: string;
  paymentMethod: IPaymentMethodModel;
  amount: number;
  paymentDate: any;
  accountName: string;
  observation?: string;
}

export interface ICreateUpdateLocalCompanySaleDetailPaymentModel {
  localCompanySaleDetail: string;
  paymentMethod: string;
  amount: number;
  paymentDate: any;
  accountName: string;
  observation?: string;
}

