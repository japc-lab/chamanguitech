import { IPersonModel } from '../../shared/interfaces/person.interface';

export interface IUpdateMerchantModel {
  id: string;
  deletedAt?: Date | null;
  person: IPersonModel;
  companyName?: string;
  recommendedBy?: string;
  recommendedByPhone?: string;
  description?: string;
}

export interface ICreateMerchantModel {
  person?: IPersonModel;
  companyName?: string;
  recommendedBy?: string;
  recommendedByPhone?: string;
  description?: string;
}

export interface IReadMerchantModel {
  deletedAt?: Date;
  id: string;
  person: IPersonModel;
  createdAt?: Date;
  updatedAt?: Date;
  companyName?: string;
  recommendedBy?: string;
  recommendedByPhone?: string;
  description?: string;
}

export interface IReducedMerchantModel {
  id: string;
  fullName: string;
}
