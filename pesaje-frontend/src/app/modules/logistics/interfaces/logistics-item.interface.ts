import {
  LogisticsFinanceCategoryEnum,
  LogisticsResourceCategoryEnum,
} from './logistics.interface';

export interface ILogisticsItemModel {
  financeCategory: LogisticsFinanceCategoryEnum;
  resourceCategory: LogisticsResourceCategoryEnum;
  unit: number;
  cost: number;
  total: number;
  description?: string;
}

export interface ICreateUpdateLogisticsItemModel {
  financeCategory: LogisticsFinanceCategoryEnum;
  resourceCategory: LogisticsResourceCategoryEnum;
  unit: number;
  cost: number;
  total: number;
  description?: string;
}
