import { IPersonModel } from '../../shared/interfaces/person.interface';

export interface IUpdateFishermanModel {
  id: string;
  deletedAt?: Date | null;
  person: IPersonModel;
}

export interface ICreateFishermanModel {
  person?: IPersonModel;
}

export interface IReadFishermanModel {
  deletedAt?: Date;
  id: string;
  person: IPersonModel;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IReducedFishermanModel {
  id: string;
  fullName: string;
}
