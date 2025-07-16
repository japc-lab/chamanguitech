export interface IPaymentMethodModel {
  name: string;
  id: string;
}

export interface IReadPaymentMethodModel {
  ok: boolean;
  data: IPaymentMethodModel[];
}
