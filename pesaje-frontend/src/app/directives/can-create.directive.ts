import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { PermissionService } from '../modules/shared/services/permission.service';

@Directive({
  selector: '[appCanCreate]',
})
export class CanCreateDirective {
  private route: string;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService
  ) {}

  @Input()
  set appCanCreate(route: string) {
    this.route = route;
    this.updateView();
  }

  private updateView() {
    if (this.permissionService.canCreate(this.route)) {
      this.viewContainer.createEmbeddedView(this.templateRef); // ✅ Show element
    } else {
      this.viewContainer.clear(); // ❌ Hide element
    }
  }
}
