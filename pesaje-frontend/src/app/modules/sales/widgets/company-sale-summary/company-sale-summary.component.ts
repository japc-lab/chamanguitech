import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { IReducedDetailedPurchaseModel } from '../../../purchases/interfaces/purchase.interface';
import { ICreateUpdateCompanySaleModel } from '../../interfaces/sale.interface';
import { ICompanySaleWholeDetailModel } from '../../interfaces/company-sale-whole-detail.interface';
import { ICompanySaleTailDetailModel } from '../../interfaces/company-sale-tail-detail.interface';
import { InputUtilsService } from 'src/app/utils/input-utils.service';
import { FormUtilsService } from 'src/app/utils/form-utils.service';

@Component({
  selector: 'app-company-sale-summary',
  templateUrl: './company-sale-summary.component.html',
  styleUrls: ['./company-sale-summary.component.scss'],
})
export class CompanySaleSummaryComponent implements OnChanges {
  @Input() purchaseModel: IReducedDetailedPurchaseModel | null = null;
  @Input() companySaleModel: ICreateUpdateCompanySaleModel | null = null;
  @Input() wholeDetail: ICompanySaleWholeDetailModel | null = null;
  @Input() tailDetail: ICompanySaleTailDetailModel | null = null;

  @ViewChild('summaryForm') summaryForm!: NgForm;

  // User input fields (editable)
  poundsReceivedInput = 0;
  performancePercentageInput = 0;
  retentionPercentage = 0;
  additionalPenalty = 0;

  // Computed values (will be calculated)
  grandTotal = 0;
  averagePurchasePrice = 0;
  averagePackingPrice = 0;
  netAmountToReceive = 0;

  constructor(
    private inputUtils: InputUtilsService,
    private formUtils: FormUtilsService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['purchaseModel'] ||
      changes['companySaleModel'] ||
      changes['wholeDetail'] ||
      changes['tailDetail']
    ) {
      this.calculateSummary();
    }
  }

  calculateSummary(): void {
    // Financial summary calculations
    const wholeSubtotal = this.wholeDetail?.grandTotal || 0;
    const tailSubtotal = this.tailDetail?.grandTotal || 0;
    this.grandTotal = wholeSubtotal + tailSubtotal;

    // Calculate average purchase price
    console.log('purchaseModel', this.purchaseModel);
    const poundsBought = this.purchaseModel?.totalPounds || 0;
    if (poundsBought > 0) {
      this.averagePurchasePrice =
        (this.purchaseModel?.grandTotal || 0) / poundsBought;
    }

    // Placeholder for packing price - needs business logic
    this.averagePackingPrice = 0;

    // Calculate net amount
    const retentionAmount = (this.grandTotal * this.retentionPercentage) / 100;
    this.netAmountToReceive =
      this.grandTotal - retentionAmount - this.additionalPenalty;
  }

  // Getter methods for template access to model properties
  get poundsBought(): number {
    return this.purchaseModel?.totalPounds || 0;
  }

  get poundsReceived(): number {
    return this.poundsReceivedInput;
  }

  get difference(): number {
    return this.poundsReceived - this.poundsBought;
  }

  get trashPounds(): number {
    return this.companySaleModel?.trashPounds || 0;
  }

  get poundsForWholeProcess(): number {
    return this.poundsReceived - this.trashPounds;
  }

  get performancePercentage(): number {
    return this.performancePercentageInput;
  }

  get wholeSubtotal(): number {
    return this.wholeDetail?.grandTotal || 0;
  }

  get tailReceivedPoundsReported(): number {
    return this.tailDetail?.receivedPoundsReported || 0;
  }

  get tailTotalPoundsProcessed(): number {
    return this.tailDetail?.totalTailPoundsProcessed || 0;
  }

  get tailPerformancePercentage(): number {
    return this.tailDetail?.performancePercentageTailPounts || 0;
  }

  get tailSubtotal(): number {
    return this.tailDetail?.grandTotal || 0;
  }

  get retentionAmount(): number {
    return (this.grandTotal * this.retentionPercentage) / 100;
  }

  validateNumber(event: KeyboardEvent) {
    this.inputUtils.validateNumber(event);
  }

  formatDecimal(controlName: string) {
    const control = this.summaryForm?.form?.get(controlName);
    if (control) {
      this.formUtils.formatControlToDecimal(control);
    }
  }
}
