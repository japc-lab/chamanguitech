import { IReadBrokerModel } from '../../personal-profile/interfaces/broker.interface';
import { ICompany } from '../../settings/interfaces/company.interfaces';
import {
  IReadUserModel,
  IReducedUserModel,
} from '../../settings/interfaces/user.interface';
import { IReadClientModel } from '../../shared/interfaces/client.interface';
import {
  IReadPeriodModel,
  IReducedPeriodModel,
} from '../../shared/interfaces/period.interface';
import {
  IReadShrimpFarmModel,
  IReducedShrimpFarmModel,
} from '../../shared/interfaces/shrimp-farm.interface';

export interface ICreatePurchaseModel {
  buyer: string;
  company: string;
  period?: string;
  broker: string;
  client: string;
  status?: PurchaseStatusEnum;
  shrimpFarm: string;
  averageGrams: number;
  price: number;
  pounds: number;
  averageGrams2?: number;
  price2?: number;
  pounds2?: number;
  totalPounds: number;
  subtotal: number;
  subtotal2?: number;
  grandTotal: number;
  totalAgreedToPay: number;
  hasInvoice: boolean;
  invoice?: string;
  purchaseDate: string;
  controlNumber?: string;
}

export interface IBasePurchaseModel {
  averageGrams: number;
  price: number;
  pounds: number;
  averageGrams2?: number;
  price2?: number;
  pounds2?: number;
  totalPounds: number;
  subtotal: number;
  subtotal2?: number;
  grandTotal: number;
  totalAgreedToPay: number;
  hasInvoice: boolean;
  invoice?: string;
  status: PurchaseStatusEnum;
  deletedAt: string | null;
  purchaseDate: string;
  id: string;
  controlNumber?: string;
}

export interface IDetailedPurchaseModel extends IBasePurchaseModel {
  buyer: IReadUserModel;
  company: ICompany;
  period: IReadPeriodModel;
  broker: IReadBrokerModel;
  client: IReadClientModel;
  shrimpFarm: IReadShrimpFarmModel;
}

export interface IListPurchaseModel extends IBasePurchaseModel {
  buyer: string;
  company: string;
  period: string;
  broker: string;
  client: string;
  shrimpFarm: string;
  totalPayed?: number;
}

export interface IReducedDetailedPurchaseModel extends IBasePurchaseModel {
  buyer: IReducedUserModel;
  company: ICompany;
  period: IReducedPeriodModel;
  broker: IReducedUserModel;
  client: IReducedUserModel;
  shrimpFarm: IReducedShrimpFarmModel;
  totalPayed?: number;
  totalPounds: number;
  id: string;
}

export interface IUpdatePurchaseModel {
  averageGrams: number;
  price: number;
  pounds: number;
  averageGrams2?: number;
  price2?: number;
  pounds2?: number;
  totalPounds: number;
  subtotal: number;
  subtotal2?: number;
  grandTotal: number;
  totalAgreedToPay: number;
  hasInvoice: boolean;
  invoice?: string;
}

export enum PurchaseStatusEnum {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
}
