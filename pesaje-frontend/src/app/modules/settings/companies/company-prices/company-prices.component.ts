import { Component, OnInit } from '@angular/core';
import { CompanyService } from '../../services/company.service';
import { ICompany } from '../../interfaces/company.interfaces';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-company-prices',
  templateUrl: './company-prices.component.html',
  styleUrls: ['./company-prices.component.scss'],
})
export class CompanyPricesComponent implements OnInit {
  companies: ICompany[] = [];
  selectedCompany: ICompany | null = null;
  selectedCompanyInput: string = '';
  isLoading$: Observable<boolean>;

  constructor(private companyService: CompanyService) {
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

    this.selectedCompanyInput = company.id ?? '';
  }
}
