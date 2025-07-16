export interface IPersonModel {
  id: string;
  photo?: string;
  names: string;
  lastNames: string;
  identification: string;
  birthDate?: string | null;
  address: string;
  phone?: string;
  mobilePhone: string;
  mobilePhone2?: string;
  email?: string | null;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}
