export interface IPaymentMethodModel {
  name: {
    en: string;
    es: string;
  };
  id: string;
}

export interface IReadPaymentMethodModel {
  ok: boolean;
  data: IPaymentMethodModel[];
}
