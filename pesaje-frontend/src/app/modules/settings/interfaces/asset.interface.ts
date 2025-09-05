export interface IUpdateAssetModel {
  id: string;
  code?: string;
  name?: string;
  purchaseDate?: Date;
  unitCost?: number;
  units?: number;
  totalCost?: number;
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
  code?: string;
  name?: string;
  purchaseDate?: Date;
  unitCost?: number;
  units?: number;
  totalCost?: number;
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
  code: string;
  name: string;
  purchaseDate: Date;
  unitCost: number;
  units: number;
  totalCost: number;
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
