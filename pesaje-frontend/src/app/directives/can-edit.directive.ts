import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { PermissionService } from '../modules/shared/services/permission.service';

@Directive({
  selector: '[appCanEdit]',
})
export class CanEditDirective {
  private route: string;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService
  ) {}

  @Input()
  set appCanEdit(route: string) {
    this.route = route;
    this.updateView();
  }

  private updateView() {
    if (this.permissionService.canEdit(this.route)) {
      this.viewContainer.createEmbeddedView(this.templateRef); // ✅ Show element
    } else {
      this.viewContainer.clear(); // ❌ Hide element
    }
  }
}
