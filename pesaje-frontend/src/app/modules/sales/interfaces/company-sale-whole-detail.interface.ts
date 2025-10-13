import { ICompanySaleItemModel } from './company-sale-item.interface';

export interface ICompanySaleWholeDetailModel {
  id?: string;
  batch: string;
  settleDate: string;
  predominantSize: string;
  totalWholePoundsProcessed: number;
  totalTrashPounds: number;
  averagePrice?: number;
  poundsGrandTotal: number;
  grandTotal: number;
  items: ICompanySaleItemModel[];
  deletedAt?: Date;
}

