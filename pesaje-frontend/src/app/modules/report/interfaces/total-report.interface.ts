import { LogisticsTypeEnum } from '../../logistics/interfaces/logistics.interface';

export interface ITotalReportModel {
  purchase: IPurchaseDetailsModel;
  sale: ISaleDetailsModel;
  logistics: ILogisticsDetailsModel;
}

export interface IPurchaseDetailsModel {
  id: string;
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
  averageBatchGrams: number;
  netPoundsReceived: number;
  wholePoundsReceived: number;
  trashPounds: number;
  totalToReceive: number;
}

export interface ILogisticsDetailsModel {
  type: LogisticsTypeEnum;
  logisticsDate: string;
  personnelExpenses: number;
  productAndSupplyExpenses: number;
  totalToPay: number;
}

export interface ICreateUpdateTotalReport {
  // Purchase info
  purchaseId: string;
  controlNumber: string;
  responsibleBuyer: string;
  brokerName: string;
  purchaseDate: string; // ISO string or Date
  clientName: string;
  averageGramPurchase: number;
  pricePurchase: number;
  poundsPurchase: number;
  totalToPayPurchase: number;

  // Sale info
  averageBatchGramsSale: number;
  salePrice: number;
  wholePoundsReceived: number;
  diffPounds: number;
  totalToReceiveSale: number;
  balanceNet: number;

  // Logistics & retention
  logisticsTotalToPay: number;
  retention: number;
  retentionFactorInput: number; // input field

  // Subtotal Gross Profit
  subtotalGrossProfit: number;

  // Pay Broker & Qualifier
  totalToPayBroker: number;
  payBrokerFactorInput: number; // input field

  totalToPayQualifier: number;
  payQualifierFactorInput: number; // input field

  taxes: number;
  taxesFactorInput: number; // input field

  // Total Gross Profit
  totalGrossProfit: number;

  // Distribution
  responsibleBuyerProfit: number;
  buyerProfitFactorInput: number; // input field

  secretaryProfit: number;
  secretaryProfitFactorInput: number; // input field

  ceoProfit: number;
  ceoProfitFactorInput: number; // input field

  techLegalProfit: number;
  techLegalProfitFactorInput: number; // input field

  investCapitalProfit: number;
  investCapitalProfitFactorInput: number; // input field

  profit: number;
  profitFactorInput: number; // input field

  // Final Total Factors
  totalFactors: number;
}
