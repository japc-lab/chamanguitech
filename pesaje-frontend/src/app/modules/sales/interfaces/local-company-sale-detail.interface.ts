import { ICompany } from '../../settings/interfaces/company.interfaces';

export interface ILocalCompanySaleDetailModel {
  id?: string;
  company?: ICompany | string;
  receiptDate: string;
  personInCharge: string;
  batch: number;
  guideWeight: number;
  guideNumber: string;
  weightDifference: number;
  processedWeight: number;
  poundsGrandTotal: number;
  grandTotal: number;
  retentionPercentage?: number;
  retentionAmount?: number;
  netGrandTotal: number;
  otherPenalties?: number;
  deletedAt?: string;
  items: ILocalCompanySaleDetailItemModel[];
}

export interface ILocalCompanySaleDetailItemModel {
  id?: string;
  size: string;
  class: string;
  pounds: number;
  price: number;
  total: number;
}
