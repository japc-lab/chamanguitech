import { SaleStyleEnum } from './sale.interface';

export interface ICompanySaleItemModel {
  id?: string;
  style: SaleStyleEnum;
  class: string;
  size: string;
  pounds: number;
  price: number;
  referencePrice?: number;
  total: number;
  percentage: number;
}
