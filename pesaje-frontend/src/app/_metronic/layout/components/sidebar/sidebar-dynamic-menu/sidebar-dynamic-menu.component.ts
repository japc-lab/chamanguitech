import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IPermissionModel } from 'src/app/modules/auth/interfaces/permission.interface';
import { TranslationService } from 'src/app/modules/i18n/translation.service';

@Component({
  selector: 'app-sidebar-dynamic-menu',
  templateUrl: './sidebar-dynamic-menu.component.html',
  styleUrls: ['./sidebar-dynamic-menu.component.scss'],
})
export class SidebarDynamicMenuComponent implements OnInit {
  @Input() menuOptions: IPermissionModel[];

  constructor(private router: Router, private translationService: TranslationService) {}

  ngOnInit(): void {}

  /**
   * ✅ Gets the translated label for an option based on current language
   */
  getOptionLabel(option: IPermissionModel): string {
    const currentLang = this.translationService.getSelectedLanguage();

    // If translations exist and current language is available, use it
    if (option.translations && currentLang && (currentLang === 'en' || currentLang === 'es')) {
      const translation = option.translations[currentLang as keyof typeof option.translations];
      if (translation) {
        return translation;
      }
    }

    // Fallback to default name
    return option.name;
  }

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
