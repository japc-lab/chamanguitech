import { ILocalSaleDetailItemModel } from './local-sale-detail-item.interface';
import { SaleStyleEnum } from './sale.interface';

export interface ILocalSaleDetailModel {
  id?: string;
  style?: SaleStyleEnum;
  merchat: string;
  grandTotal: number;
  poundsGrandTotal: number;
  items: ILocalSaleDetailItemModel[];
}
