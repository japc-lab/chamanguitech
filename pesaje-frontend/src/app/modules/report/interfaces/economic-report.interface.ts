import { LogisticsTypeEnum } from '../../logistics/interfaces/logistics.interface';
import { PurchaseStatusEnum } from '../../purchases/interfaces/purchase.interface';

export interface IEconomicReportModel {
  grossProfit: number;
  purchase: IPurchaseDetailsModel;
  sale: ISaleDetailsModel;
  isCompanySale: boolean;
  logistics: ILogisticsDetailsModel | ILogisticsDetailsModel[];
}

export interface IPurchaseDetailsModel {
  clientName: string;
  shrimpFarmLocation: string;
  shrimpFarm: string;
  responsibleBuyer: string;
  controlNumber: string;
  companyName: string;
  period: string;
  brokerName: string;
  purchaseDate: string; // ISO date string
  averageGram: number;
  invoiceNumber: string;
  status: PurchaseStatusEnum;
  price: number;
  pounds: number;
  averageGrams2: number;
  price2: number;
  pounds2: number;
  totalPoundsPurchased: number;
  totalToPay: number;
  totalAgreed: number;
}

export interface ISaleDetailsModel {
  saleDate: string;
  receptionDate: string;
  batch: string;
  document: string;
  averageBatchGrams: number;
  netPoundsReceived: number;
  wholePoundsReceived: number;
  trashPounds: number;
  performance: number;
  totalToReceive: number;
  wholeTotalPounds: number;
  tailTotalPounds: number;
  totalProcessedPounds: number;
  wholeRejectedPounds: number;
}

export interface ILogisticsDetailsModel {
  type: LogisticsTypeEnum;
  logisticsDate: string;
  personnelExpenses: number;
  productAndSupplyExpenses: number;
  totalToPay: number;
}
