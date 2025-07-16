import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Observable, of, Subscription } from 'rxjs';
import { UserService } from '../../services/user.service';
import { PERMISSION_ROUTES } from '../../../../constants/routes.constants';
import { AlertService } from 'src/app/utils/alert.service';
import { CompanyService } from '../../services/company.service';
import { Router } from '@angular/router';

type Tabs = 'New Company' | 'Details';

@Component({
  selector: 'app-new-company',
  templateUrl: './new-company.component.html',
})
export class NewCompanyComponent implements OnInit, OnDestroy {
  PERMISSION_ROUTE = PERMISSION_ROUTES.SETTINGS.COMPANIES;

  isLoading$: Observable<boolean>;
  company = {
    name: '',
    city: '',
    mainPersonName: '',
    mainTelephone: '',
  };

  private unsubscribe: Subscription[] = [];

  constructor(
    private companyService: CompanyService,
    private alertService: AlertService,
    private userService: UserService,
    private router: Router
  ) {
    this.isLoading$ = this.userService.isLoading$;
  }

  ngOnInit(): void {}

  onSubmit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    this.alertService.confirm().then((result) => {
      if (result.isConfirmed) {
        this.companyService.createCompany(this.company).subscribe({
          next: () => {
            this.alertService.showTranslatedAlert({
              alertType: 'success',
            });
            form.resetForm();
            this.router.navigateByUrl('settings/companies/company-list');
          },
          error: () => {
            this.alertService.showTranslatedAlert({
              alertType: 'error',
            });
          },
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
  }
}
