import {
  ICreateSizePriceModel,
  IReadSizePriceModel,
  IUpdateSizePriceModel,
} from './size-price.interface';

export interface ICreatePeriodModel {
  name: string;
  receivedDateTime?: string;
  fromDate: string;
  toDate: string;
  timeOfDay?: TimeOfDayEnum;
  company: string;
  sizePrices: ICreateSizePriceModel[];
}

export interface IReadPeriodModel {
  id: string;
  name: string;
  receivedDateTime: string;
  fromDate: string;
  toDate: string;
  timeOfDay: TimeOfDayEnum;
  company: string;
  sizePrices?: IReadSizePriceModel[];
}

export interface IReducedPeriodModel {
  id: string;
  name: string;
}

export interface IUpdatePeriodModel {
  receivedDateTime?: string;
  fromDate: string;
  toDate: string;
  timeOfDay?: TimeOfDayEnum;
  sizePrices: IUpdateSizePriceModel[];
}

export enum TimeOfDayEnum {
  DAY = 'DAY',
  NIGHT = 'NIGHT',
}
