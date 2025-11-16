import { IReducedDetailedPurchaseModel } from '../../purchases/interfaces/purchase.interface';
import { ICompany } from '../../settings/interfaces/company.interfaces';
import { IReducedUserModel } from '../../settings/interfaces/user.interface';
import { ICompanySaleItemModel } from './company-sale-item.interface';
import { ILocalCompanySaleDetailModel } from './local-company-sale-detail.interface';
import { ILocalSaleDetailModel } from './local-sale-detail.interface';
import { ICompanySaleWholeDetailModel } from './company-sale-whole-detail.interface';
import { ICompanySaleTailDetailModel } from './company-sale-tail-detail.interface';

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
  weightSheetNumber?: string;
  deletedAt?: string;
}

export interface ICreateUpdateCompanySaleModel {
  id?: string;
  purchase: string;
  saleDate?: string;
  batch: string;
  provider: string;
  receptionDate: string;
  settleDate: string;
  predominantSize: string;
  wholeReceivedPounds: number;
  trashPounds: number;
  netReceivedPounds: number;
  processedPounds: number;
  performance: number;
  poundsGrandTotal: number;
  grandTotal: number;
  percentageTotal: number;
  summaryPoundsReceived?: number;
  summaryPerformancePercentage?: number;
  summaryRetentionPercentage?: number;
  summaryAdditionalPenalty?: number;
  weightSheetNumber?: string;
  status: CompanySaleStatusEnum;
  wholeDetail?: ICompanySaleWholeDetailModel;
  tailDetail?: ICompanySaleTailDetailModel;
}

export interface ICompanySaleModel {
  id: string;
  purchase: IReducedDetailedPurchaseModel;
  sale: string;
  saleDate?: string;
  batch: string;
  provider: string;
  receptionDate: string;
  settleDate: string;
  predominantSize: string;
  wholeReceivedPounds: number;
  trashPounds: number;
  netReceivedPounds: number;
  processedPounds: number;
  performance: number;
  poundsGrandTotal: number;
  grandTotal: number;
  percentageTotal: number;
  summaryPoundsReceived?: number;
  summaryPerformancePercentage?: number;
  summaryRetentionPercentage?: number;
  summaryAdditionalPenalty?: number;
  weightSheetNumber?: string;
  status: CompanySaleStatusEnum;
  wholeDetail?: ICompanySaleWholeDetailModel;
  tailDetail?: ICompanySaleTailDetailModel;
}

export interface ICreateUpdateLocalSaleModel {
  id?: string;
  purchase: string;
  saleDate: string;
  wholeTotalPounds: number;
  moneyIncomeForRejectedHeads: number;
  wholeRejectedPounds: number;
  trashPounds: number;
  totalProcessedPounds: number;
  grandTotal: number;
  seller: string;
  localSaleDetails: ILocalSaleDetailModel[];
  localCompanySaleDetail?: ILocalCompanySaleDetailModel;
  hasInvoice: 'yes' | 'no' | 'not-applicable';
  invoiceNumber?: string;
  invoiceName?: string;
  weightSheetNumber?: string;
   status?: LocalSaleStatusEnum;
}

export interface ILocalSaleModel {
  id: string;
  purchase: IReducedDetailedPurchaseModel;
  sale: string;
  saleDate: string;
  wholeTotalPounds: number;
  moneyIncomeForRejectedHeads: number;
  wholeRejectedPounds: number;
  trashPounds: number;
  totalProcessedPounds: number;
  grandTotal: number;
  seller: string;
  localSaleDetails: ILocalSaleDetailModel[];
  localCompanySaleDetail?: ILocalCompanySaleDetailModel;
  hasInvoice: 'yes' | 'no' | 'not-applicable';
  invoiceNumber?: string;
  invoiceName?: string;
  status?: LocalSaleStatusEnum;
}

export enum SaleTypeEnum {
  COMPANY = 'COMPANY',
  LOCAL = 'LOCAL',
}

export enum SaleStyleEnum {
  WHOLE = 'WHOLE',
  TAIL = 'TAIL',
  RESIDUAL = 'RESIDUAL',
}

export enum CompanySaleStatusEnum {
  DRAFT = 'DRAFT',
  CREATED = 'CREATED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
}

export enum LocalSaleStatusEnum {
  DRAFT = 'DRAFT',
  CREATED = 'CREATED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
}
