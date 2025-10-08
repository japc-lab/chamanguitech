import { SaleStyleEnum } from './sale.interface';

export interface ILocalSaleDetailModel {
  id?: string;
  style?: SaleStyleEnum;
  merchat: string;
  grandTotal: number;
  poundsGrandTotal: number;
  items: ILocalSaleDetailItemModel[];
}

export interface ILocalSaleDetailItemModel {
  id?: string;
  size: string;
  pounds: number;
  price: number;
  total: number;
}
