import { Injectable } from '@angular/core';
import { AuthService } from 'src/app/modules/auth';
import {
  IPermissionModel,
  PermissionEnum,
} from 'src/app/modules/auth/interfaces/permission.interface';

@Injectable({
  providedIn: 'root', // ✅ This makes the service available across the entire app
})
export class PermissionService {
  permissions: IPermissionModel[];

  constructor(private authService: AuthService) {
    this.permissions = this.authService.currentUserValue?.permissions || [];
  }

  /**
   * Checks if the user has a specific action for a given route.
   */
  hasPermission(route: string, action: PermissionEnum): boolean {
    return this.permissions.some(
      (option) =>
        // ✅ Check parent option
        (option.route === route && option.actions.includes(action)) ||
        // ✅ Check suboptions
        option.suboptions?.some(
          (suboption) =>
            suboption.route === route && suboption.actions.includes(action)
        )
    );
  }

  canRead(route: string): boolean {
    return this.hasPermission(route, PermissionEnum.VIEW);
  }

  canCreate(route: string): boolean {
    return this.hasPermission(route, PermissionEnum.ADD);
  }

  canEdit(route: string): boolean {
    return this.hasPermission(route, PermissionEnum.EDIT);
  }

  canDelete(route: string): boolean {
    return this.hasPermission(route, PermissionEnum.DELETE);
  }
}
