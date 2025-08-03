import { IPersonModel } from './person.interface';

export interface ICreateUpdateClientModel {
  person: IPersonModel;
  buyersItBelongs: string[];
  description?: string;
  deletedAt?: Date | null;
}

export interface IReadClientModel {
  person: IPersonModel;
  buyersItBelongs:
    | {
        id: string;
        fullName: string;
      }[]
    | string[];
  description: string;
  createdBy: string;
  deletedBy: string;
  id: string;
  deletedAt?: Date;
}
