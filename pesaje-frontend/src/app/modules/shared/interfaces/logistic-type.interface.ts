export interface ILogisticsCategoryModel {
  name: string;
  category: LogisticsCategoryEnum;
  deleteAt: Date;
  id: string;
}

export interface IReadLogisticsCategoryModel {
  ok: boolean;
  data: ILogisticsCategoryModel[];
}

export enum LogisticsCategoryEnum {
  PERSONNEL = 'PERSONNEL',
  INPUTS = 'INPUTS',
}
