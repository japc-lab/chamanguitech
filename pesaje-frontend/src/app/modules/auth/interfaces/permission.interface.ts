export interface IPermissionModel {
  id: string;
  name: string;
  parentOption?: string;
  route?: string;
  icon?: string;
  actions: PermissionEnum[];
  suboptions: IPermissionModel[];
}

export enum PermissionEnum {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  ADD = 'ADD',
  DELETE = 'DELETE',
}
