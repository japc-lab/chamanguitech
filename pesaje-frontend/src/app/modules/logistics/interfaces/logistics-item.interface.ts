import { ILogisticsCategoryModel } from '../../shared/interfaces/logistic-type.interface';

export interface ILogisticsItemModel {
  logisticsCategory: ILogisticsCategoryModel;
  unit: number;
  cost: number;
  total: number;
  description?: string;
}

export interface ICreateUpdateLogisticsItemModel {
  logisticsCategory: string;
  unit: number;
  cost: number;
  total: number;
  description?: string;
}
