export interface IReadSizeModel {
  id: string;
  size: string;
  type: SizeTypeEnum;
}

export enum SizeTypeEnum {
  WHOLE = 'WHOLE',
  'TAIL-A' = 'TAIL-A',
  'TAIL-A-' = 'TAIL-A-',
  'TAIL-B' = 'TAIL-B',
  RESIDUAL = 'RESIDUAL'
}
