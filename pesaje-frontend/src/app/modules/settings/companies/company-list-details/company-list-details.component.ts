import { Component, OnInit, ViewChild } from '@angular/core';
import { CompanyService } from '../../services/company.service';
import { NgForm } from '@angular/forms';
import { ICompany } from '../../interfaces/company.interfaces';
import { Observable } from 'rxjs';
import { AlertService } from 'src/app/utils/alert.service';
import { FormUtilsService } from '../../../../utils/form-utils.service';
import { InputUtilsService } from 'src/app/utils/input-utils.service';

@Component({
  selector: 'app-company-list-details',
  templateUrl: './company-list-details.component.html',
  styleUrls: ['./company-list-details.component.scss'],
})
export class CompanyListDetailsComponent implements OnInit {
  @ViewChild('companyForm') companyForm!: NgForm;

  companies: ICompany[] = [];
  selectedCompany: ICompany | null = null;

  isLoading$: Observable<boolean>;

  constructor(
    private companyService: CompanyService,
    private alertService: AlertService,
    private formUtils: FormUtilsService,
    private inputUtils: InputUtilsService
  ) {
    this.isLoading$ = this.companyService.isLoading$;
  }

  ngOnInit(): void {
    this.fetchCompanies();
  }

  fetchCompanies() {
    // No need to set isLoading here, handled by the service
    this.companyService.getCompanies().subscribe({
      next: (companies) => {
        this.companies = companies.filter((c) => c.name !== 'Local');
      },
      error: () => {
        // Optionally handle error
      },
    });
  }

  selectCompany(company: ICompany) {
    this.selectedCompany = { ...company };
    if (!this.selectedCompany.maxAndMinTideQuotaReceived) {
      this.selectedCompany.maxAndMinTideQuotaReceived = {
        max: 0,
        min: 0,
      };
    }
  }

  onLogisticsPayedChange() {
    if (this.selectedCompany && !this.selectedCompany.isLogisticsPayed) {
      this.selectedCompany.wholeAmountToPay = 0;
      this.selectedCompany.tailAmountToPay = 0;
    }
  }

  onSubmit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.alertService.confirm().then((result) => {
      if (result.isConfirmed) {
        this.companyService
          .updateCompany(this.selectedCompany as ICompany)
          .subscribe({
            next: () => {
              this.alertService.showTranslatedAlert({
                alertType: 'success',
              });
              this.fetchCompanies();
            },
            error: (error) => {
              const rawMessage = error?.error?.message ?? '';
              if (rawMessage === 'Company code already exists') {
                this.alertService.showTranslatedAlert({
                  alertType: 'error',
                  messageKey: 'ERROR.REPEATED_COMPANY_CODE',
                });
                return;
              }
              this.alertService.showTranslatedAlert({
                alertType: 'error',
              });
            },
          });
      }
    });
  }

  formatDecimal(controlName: string) {
    const control = this.companyForm.controls[controlName];
    if (control) {
      this.formUtils.formatControlToDecimal(control);
    }
  }

  validateNumber(event: KeyboardEvent) {
    this.inputUtils.validateNumber(event);
  }

  validateWholeNumber(event: KeyboardEvent) {
    this.inputUtils.validateWholeNumber(event);
  }

  deleteCompany(company: ICompany, event: MouseEvent) {
    event.stopPropagation();
    this.alertService
      .confirm({
        title: this.alertService['translate'].instant(
          'MESSAGES.DELETE_CONFIRM_TITLE',
          { name: company.name }
        ),
        text: this.alertService['translate'].instant(
          'MESSAGES.DELETE_CONFIRM_TEXT',
          { name: company.name }
        ),
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.companyService.deleteCompany(company.id!).subscribe({
            next: () => {
              this.alertService.showTranslatedAlert({
                alertType: 'success',
                messageKey: 'MESSAGES.DELETE_SUCCESS',
              });
              this.fetchCompanies();
              if (
                this.selectedCompany &&
                this.selectedCompany.id === company.id
              ) {
                this.selectedCompany = null;
              }
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
}
