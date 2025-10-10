import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { ILocalCompanySaleDetailModel } from '../../interfaces/local-company-sale-detail.interface';
import { ICompany } from '../../../settings/interfaces/company.interfaces';
import { CompanyService } from '../../../settings/services/company.service';
import { InputUtilsService } from 'src/app/utils/input-utils.service';
import { FormUtilsService } from 'src/app/utils/form-utils.service';
import { NgModel, NgForm } from '@angular/forms';

@Component({
  selector: 'app-local-company-sale-detail',
  templateUrl: './local-company-sale-detail.component.html',
  styleUrls: ['./local-company-sale-detail.component.scss'],
})
export class LocalCompanySaleDetailComponent implements OnInit {
  @Input() localCompanySaleDetail: ILocalCompanySaleDetailModel | null = null;
  @Output() localCompanySaleDetailChange =
    new EventEmitter<ILocalCompanySaleDetailModel | null>();

  @ViewChild('companyDetailsForm') companyDetailsForm!: NgForm;

  classOptions = ['A', 'B', 'C'];
  companies: ICompany[] = [];

  constructor(
    private inputUtils: InputUtilsService,
    private companyService: CompanyService,
    private formUtils: FormUtilsService
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
    this.recalculateAll();
  }

  loadCompanies(): void {
    this.companyService.getCompanies().subscribe({
      next: (companies) => {
        this.companies = companies;
      },
      error: (error) => {
        console.error('Error loading companies:', error);
      },
    });
  }

  addDetail(): void {
    // Initialize the single detail object if it doesn't exist
    if (!this.localCompanySaleDetail) {
      this.localCompanySaleDetail = {
        company: undefined,
        receiptDate: '',
        personInCharge: '',
        batch: 0,
        guideWeight: 0,
        guideNumber: '',
        weightDifference: 0,
        processedWeight: 0,
        items: [],
      };
      this.emitChanges();
    }
  }

  cancelAndCollapse(): void {
    // Clear all data and collapse the section
    this.localCompanySaleDetail = null;
    this.emitChanges();
  }

  addItem(): void {
    if (this.localCompanySaleDetail) {
      this.localCompanySaleDetail.items.push({
        size: '',
        class: 'A',
        pounds: 0,
        price: 0,
        total: 0,
      });
      this.recalculateTotals(this.localCompanySaleDetail);
    }
  }

  removeItem(itemIndex: number): void {
    if (this.localCompanySaleDetail) {
      this.localCompanySaleDetail.items.splice(itemIndex, 1);
      this.recalculateTotals(this.localCompanySaleDetail);
    }
  }

  recalculateTotals(detail: ILocalCompanySaleDetailModel): void {
    let totalProcessedWeight = 0;

    detail.items.forEach((item) => {
      item.total = Number((item.pounds || 0) * (item.price || 0));
      totalProcessedWeight += Number(item.pounds || 0);
    });

    // Update processed weight (sum of all item pounds)
    detail.processedWeight = Number(totalProcessedWeight.toFixed(2));

    // Calculate weight difference (guide weight - processed weight)
    detail.weightDifference = Number(
      (Number(detail.guideWeight || 0) - detail.processedWeight).toFixed(2)
    );

    this.emitChanges();
  }

  recalculateAll(): void {
    if (this.localCompanySaleDetail) {
      this.recalculateTotals(this.localCompanySaleDetail);
    }
  }

  onGuideWeightChange(detail: ILocalCompanySaleDetailModel): void {
    this.recalculateTotals(detail);
  }

  onCompanyChange(detail: ILocalCompanySaleDetailModel, event: any): void {
    const companyId = event.target?.value || event;
    if (companyId) {
      const selectedCompany = this.companies.find((c) => c.id === companyId);
      // Store the full company object when available, fallback to ID string
      detail.company = selectedCompany || companyId;
    } else {
      detail.company = undefined;
    }
    this.emitChanges();
  }

  getSelectedCompanyId(detail: ILocalCompanySaleDetailModel): string {
    if (typeof detail.company === 'string') {
      return detail.company;
    } else if (detail.company && detail.company.id) {
      return detail.company.id;
    }
    return '';
  }

  validateNumber(event: KeyboardEvent) {
    this.inputUtils.validateNumber(event);
  }

  formatDecimal(controlName: string) {
    const control = this.companyDetailsForm?.form?.get(controlName);
    if (control) {
      this.formUtils.formatControlToDecimal(control);
    }
  }

  validateSizeFormat(event: KeyboardEvent): void {
    const allowedPattern = /^[0-9\/]*$/;
    const inputChar = event.key;

    if (!allowedPattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  getTotalAmount(detail: ILocalCompanySaleDetailModel): number {
    return detail.items.reduce((sum, item) => sum + (item.total || 0), 0);
  }

  emitChanges(): void {
    this.localCompanySaleDetailChange.emit(this.localCompanySaleDetail);
  }
}
