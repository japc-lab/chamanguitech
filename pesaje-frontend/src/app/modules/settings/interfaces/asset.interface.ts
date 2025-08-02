export interface IUpdateAssetModel {
  id: string;
  name?: string;
  quantity?: number;
  deletedAt?: Date | null;
}

export interface ICreateAssetModel {
  name?: string;
  quantity?: number;
}

export interface IReadAssetModel {
  id: string;
  name: string;
  quantity: number;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
