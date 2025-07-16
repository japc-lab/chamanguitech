import { IReducedDetailedPurchaseModel } from '../../purchases/interfaces/purchase.interface';
import { ICompany } from '../../settings/interfaces/company.interfaces';
import { IReducedUserModel } from '../../settings/interfaces/user.interface';
import { ICompanySaleItemModel } from './company-sale-item.interface';
import { ILocalSaleDetailModel } from './local-sale-detail.interface';

export interface ISaleModel {
  id?: string;
  purchase: string;
  controlNumber: string;
  total: number;
  totalPaid: number;
  paidPercentage: number;
  saleDate: string;
  buyer: IReducedUserModel;
  client: IReducedUserModel;
  company: ICompany;
  type: SaleTypeEnum;
  status: CompanySaleStatusEnum;
  deletedAt?: string;
}

export interface ICreateUpdateCompanySaleModel {
  id?: string;
  purchase: string;
  saleDate: string;
  document: string;
  batch: string;
  provider: string;
  np?: string;
  serialNumber: number;
  receptionDateTime: string;
  settleDateTime: string;
  batchAverageGram: number;
  wholeReceivedPounds: number;
  trashPounds: number;
  netReceivedPounds: number;
  processedPounds: number;
  performance: number;
  poundsGrandTotal: number;
  grandTotal: number;
  percentageTotal: number;
  status: CompanySaleStatusEnum;
  items: ICompanySaleItemModel[];
}

export interface ICompanySaleModel {
  id: string;
  purchase: IReducedDetailedPurchaseModel;
  sale: string;
  saleDate: string;
  document: string;
  batch: string;
  provider: string;
  np: string;
  serialNumber: number;
  receptionDateTime: string;
  settleDateTime: string;
  batchAverageGram: number;
  wholeReceivedPounds: number;
  trashPounds: number;
  netReceivedPounds: number;
  processedPounds: number;
  performance: number;
  poundsGrandTotal: number;
  grandTotal: number;
  percentageTotal: number;
  status: CompanySaleStatusEnum;
  items: ICompanySaleItemModel[];
}

export interface ICreateUpdateLocalSaleModel {
  id?: string;
  purchase: string;
  saleDate: string;
  wholeTotalPounds: number;
  tailTotalPounds: number;
  wholeRejectedPounds: number;
  trashPounds: number;
  totalProcessedPounds: number;
  grandTotal: number;
  seller: string;
  details: ILocalSaleDetailModel[];
}

export interface ILocalSaleModel {
  id: string;
  purchase: IReducedDetailedPurchaseModel;
  sale: string;
  saleDate: string;
  wholeTotalPounds: number;
  tailTotalPounds: number;
  wholeRejectedPounds: number;
  trashPounds: number;
  totalProcessedPounds: number;
  grandTotal: number;
  seller: string;
  details: ILocalSaleDetailModel[];
}

export enum SaleTypeEnum {
  COMPANY = 'COMPANY',
  LOCAL = 'LOCAL',
}

export enum SaleStyleEnum {
  WHOLE = 'WHOLE',
  TAIL = 'TAIL',
  RESIDUAL = 'RESIDUAL'
}

export enum CompanySaleStatusEnum {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
}
