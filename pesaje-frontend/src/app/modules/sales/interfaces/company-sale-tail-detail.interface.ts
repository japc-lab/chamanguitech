import { ICompanySaleItemModel } from './company-sale-item.interface';

export interface ICompanySaleTailDetailModel {
  id?: string;
  batch: string;
  performancePercentageTailPounts: number;
  settleDate: string;
  predominantSize: string;
  receivedPoundsReported: number;
  totalTailPoundsProcessed: number;
  poundsGrandTotal: number;
  grandTotal: number;
  items: ICompanySaleItemModel[];
  deletedAt?: Date;
}

