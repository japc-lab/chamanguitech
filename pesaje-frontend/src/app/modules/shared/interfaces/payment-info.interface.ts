import { IPersonModel } from './person.interface';

export interface IPaymentInfoModel {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  identification: string;
  mobilePhone: string;
  email: string;
  person: IPersonModel;
  personId: string;
  deletedAt?: Date;
}
