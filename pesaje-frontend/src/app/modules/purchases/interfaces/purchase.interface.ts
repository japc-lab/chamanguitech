import { IReadBrokerModel } from '../../personal-profile/interfaces/broker.interface';
import { ICompany } from '../../settings/interfaces/company.interfaces';
import { IReadFishermanModel } from '../../settings/interfaces/fisherman.interface';
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
  localSellCompany: string;
  period?: string;
  broker: string;
  fisherman: string;
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
  hasInvoice: 'yes' | 'no' | 'not-applicable';
  invoiceNumber?: string;
  invoiceName?: string;
  weightSheetNumber?: string;
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
  hasInvoice: 'yes' | 'no' | 'not-applicable';
  invoiceNumber?: string;
  invoiceName?: string;
  weightSheetNumber?: string;
  status: PurchaseStatusEnum;
  deletedAt: string | null;
  purchaseDate: string;
  id: string;
  controlNumber?: string;
}

export interface IDetailedPurchaseModel extends IBasePurchaseModel {
  buyer: IReadUserModel;
  company: ICompany;
  localSellCompany: ICompany;
  period: IReadPeriodModel;
  broker: IReadBrokerModel;
  fisherman: IReadFishermanModel;
  client: IReadClientModel;
  shrimpFarm: IReadShrimpFarmModel;
}

export interface IListPurchaseModel extends IBasePurchaseModel {
  buyer: string;
  company: string;
  localSellCompany: string;
  period: string;
  broker: string;
  fisherman: string;
  client: string;
  shrimpFarm: string;
  totalPayed?: number;
}

export interface IReducedDetailedPurchaseModel extends IBasePurchaseModel {
  buyer: IReducedUserModel;
  company: ICompany;
  localSellCompany: ICompany;
  period: IReducedPeriodModel;
  broker: IReducedUserModel;
  client: IReducedUserModel;
  shrimpFarm: IReducedShrimpFarmModel;
  totalPayed?: number;
  totalPounds: number;
  id: string;
}

export interface IUpdatePurchaseModel {
  localSellCompany: string;
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
  hasInvoice: 'yes' | 'no' | 'not-applicable';
  invoiceNumber?: string;
  invoiceName?: string;
  weightSheetNumber?: string;
}

export enum PurchaseStatusEnum {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
}
