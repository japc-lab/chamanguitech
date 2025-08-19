import { IReducedDetailedPurchaseModel } from '../../purchases/interfaces/purchase.interface';
import { IReducedUserModel } from '../../settings/interfaces/user.interface';
import {
  ICreateUpdateLogisticsItemModel,
  ILogisticsItemModel,
} from './logistics-item.interface';
import {
  ICreateUpdateLogisticsPaymentModel,
  ILogisticsPaymentModel,
} from './logistics-payment.interface';

export interface ICreateUpdateLogisticsModel {
  id?: string;
  purchase?: string;
  type: LogisticsTypeEnum;
  logisticsDate: string;
  grandTotal: number;
  status: LogisticsStatusEnum | null;
  items: ICreateUpdateLogisticsItemModel[];
  payments: ICreateUpdateLogisticsPaymentModel[];
  logisticsSheetNumber: string;
}

export interface IDetailedReadLogisticsModel {
  purchase: IReducedDetailedPurchaseModel;
  controlNumber: string;
  items: ILogisticsItemModel[];
  payments: ILogisticsPaymentModel[];
  type: LogisticsTypeEnum;
  logisticsDate: string;
  grandTotal: number;
  description: string;
  status: LogisticsStatusEnum | null;
  deletedAt: string | null;
  id: string;
  logisticsSheetNumber: string;
}

export interface IReadLogisticsModel {
  purchase: string;
  controlNumber: string;
  items: string[];
  payments: string[];
  type: LogisticsTypeEnum;
  logisticsDate: string;
  grandTotal: number;
  description: string;
  buyer: IReducedUserModel;
  client: IReducedUserModel;
  status: LogisticsStatusEnum | null;
  deletedAt: string | null;
  id: string;
  logisticsSheetNumber: string;
}

export enum LogisticsTypeEnum {
  SHIPMENT = 'SHIPMENT',
  LOCAL_PROCESSING = 'LOCAL_PROCESSING',
}

export enum LogisticsStatusEnum {
  DRAFT = 'DRAFT',
  CREATED = 'CREATED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CONFIRMED = 'CONFIRMED',
  CLOSED = 'CLOSED',
}

export enum LogisticsFinanceCategoryEnum {
  INVOICE = 'INVOICE',
  PETTY_CASH = 'PETTY_CASH',
  ADDITIONAL = 'ADDITIONAL',
}

export enum LogisticsResourceCategoryEnum {
  PERSONNEL = 'PERSONNEL',
  RESOURCES = 'RESOURCES',
  MATERIALS = 'MATERIALS',
}
