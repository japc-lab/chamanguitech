export interface IUpdateAssetModel {
  id: string;
  name?: string;
  purchaseDate?: Date;
  cost?: number;
  desiredLife?: number;
  paymentStatus?: string;
  paidAmount?: number;
  pendingAmount?: number;
  responsible?: string;
  location?: string;
  currentSituation?: 'good' | 'bad' | 'neutral';
  disposalDate?: Date;
  daysOfUse?: number;
  deletedAt?: Date | null;
}

export interface ICreateAssetModel {
  name?: string;
  purchaseDate?: Date;
  cost?: number;
  desiredLife?: number;
  paymentStatus?: string;
  paidAmount?: number;
  pendingAmount?: number;
  responsible?: string;
  location?: string;
  currentSituation?: 'good' | 'bad' | 'neutral';
  disposalDate?: Date;
  daysOfUse?: number;
}

export interface IReadAssetModel {
  id: string;
  name: string;
  purchaseDate: Date;
  cost: number;
  desiredLife: number;
  paymentStatus: string;
  paidAmount: number;
  pendingAmount: number;
  responsible: string;
  location?: string;
  currentSituation?: 'good' | 'bad' | 'neutral';
  disposalDate?: Date;
  daysOfUse?: number;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
