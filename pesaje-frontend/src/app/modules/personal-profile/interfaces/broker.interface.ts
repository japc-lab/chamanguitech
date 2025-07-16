import { IPersonModel } from '../../shared/interfaces/person.interface';

export interface ICreateBrokerModel {
  person: IPersonModel;
  buyerItBelongs: string;
}

export interface IUpdateBrokerModel {
  id: string;
  person: IPersonModel;
  buyerItBelongs: string;
}

export interface IReadBrokerModel {
  deletedAt: string;
  id: string;
  person: IPersonModel;
  buyerItBelongs: BuyerModel | string;
}

export interface BuyerModel {
  id: string;
  fullName: string;
}
