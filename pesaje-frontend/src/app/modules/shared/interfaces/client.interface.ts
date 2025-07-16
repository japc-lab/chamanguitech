import { IPersonModel } from './person.interface';

export interface ICreateUpdateClientModel {
  person: IPersonModel;
  buyersItBelongs: string[];
}

export interface IReadClientModel {
  person: IPersonModel;
  buyersItBelongs:
    | {
        id: string;
        fullName: string;
      }[]
    | string[];
  createdBy: string;
  deletedBy: string;
  id: string;
}
