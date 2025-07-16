import { Component } from '@angular/core';
import { ICompany } from '../../interfaces/company.interfaces';
import { Observable } from 'rxjs';
import { PeriodService } from 'src/app/modules/shared/services/period.service';

@Component({
  selector: 'app-company-best-prices',
  templateUrl: './company-best-prices.component.html',
  styleUrl: './company-best-prices.component.scss',
})
export class CompanyBestPricesComponent {
  periods: string[] = [];
  typeSizeData: any;
  groupedSizes: any;

  selectedCompany: ICompany | null = null;
  selectedCompanyInput = '';
  selectedPeriod = '';

  showErrors = false;

  isLoading$: Observable<boolean>;

  constructor(private periodService: PeriodService) {
    this.isLoading$ = this.periodService.isLoading$;
  }

  ngOnInit(): void {
    this.fetchPeriods();
  }

  fetchPeriods() {
    // No need to set isLoading here, handled by the service
    this.periodService.getDistinctPeriodNames().subscribe({
      next: (period) => {
        this.periods = period;
      },
      error: () => {
        // Optionally handle error
      },
    });
  }

  search() {
    this.showErrors = !this.selectedPeriod;
    if (!this.selectedPeriod) {
      return;
    }

    this.periodService.getPeriodByName(this.selectedPeriod).subscribe({
      next: (prices) => {
        this.typeSizeData = prices;
        this.groupedSizes = [
          {
            type: 'ENTERO',
            sizes: this.typeSizeData.filter((size: any) =>
              size.type.includes('WHOLE')
            ),
          },
          {
            type: 'COLA',
            sizes: this.typeSizeData
              .filter((size: any) => size.type.includes('TAIL'))
              .sort((a: any, b: any) => {
                const order = ['TAIL-A', 'TAIL-A-', 'TAIL-B'];
                const aIndex = order.indexOf(a.type);
                const bIndex = order.indexOf(b.type);
                if (aIndex !== -1 && bIndex !== -1) {
                  return aIndex - bIndex;
                }
                if (aIndex !== -1) return -1;
                if (bIndex !== -1) return 1;
                return a.type.localeCompare(b.type);
              }),
          },
          {
            type: 'RESIDUAL',
            sizes: this.typeSizeData.filter((size: any) =>
              size.type.includes('RESIDUAL')
            ),
          },
        ].filter((group) => group.sizes.length > 0); // Eliminar grupos vacíos
      },
      error: () => {
        // Optionally handle error
      },
    });
  }
}
