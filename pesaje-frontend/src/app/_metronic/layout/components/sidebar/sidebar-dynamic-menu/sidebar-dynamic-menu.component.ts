import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IPermissionModel } from 'src/app/modules/auth/interfaces/permission.interface';

@Component({
  selector: 'app-sidebar-dynamic-menu',
  templateUrl: './sidebar-dynamic-menu.component.html',
  styleUrls: ['./sidebar-dynamic-menu.component.scss'],
})
export class SidebarDynamicMenuComponent implements OnInit {
  @Input() menuOptions: IPermissionModel[];

  constructor(private router: Router) {}

  ngOnInit(): void {}

  /**
   * ✅ Checks if the option's route is active
   */
  isOptionActive(option: IPermissionModel): boolean {
    if (!option) return false;

    // console.log(
    //   'Checking active status for:',
    //   option.name,
    //   'with route:',
    //   option.route
    // );
    // console.log('Current URL:', this.router.url);

    // 🔹 Direct match for main options
    if (option.route && this.router.url.includes(option.route)) {
      // console.log('✅ Matched main route:', option.route);
      return true;
    }

    // 🔹 Check suboptions recursively
    if (option.suboptions?.length > 0) {
      return option.suboptions.some((sub: IPermissionModel) =>
        this.isOptionActive(sub)
      );
    }

    return false;
  }
}
