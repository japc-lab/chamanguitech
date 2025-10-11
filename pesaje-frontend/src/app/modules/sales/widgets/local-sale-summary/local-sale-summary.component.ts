import { Component, Input, OnChanges, SimpleChanges, DoCheck } from '@angular/core';
import { ILocalSaleDetailModel } from '../../interfaces/local-sale-detail.interface';
import { ILocalCompanySaleDetailModel } from '../../interfaces/local-company-sale-detail.interface';
import { IReducedDetailedPurchaseModel } from '../../../purchases/interfaces/purchase.interface';
import {
  ICreateUpdateLocalSaleModel,
  ILocalSaleModel,
} from '../../interfaces/sale.interface';

@Component({
  selector: 'app-local-sale-summary',
  templateUrl: './local-sale-summary.component.html',
  styleUrls: ['./local-sale-summary.component.scss'],
})
export class LocalSaleSummaryComponent implements OnChanges, DoCheck {
  @Input() purchaseModel: IReducedDetailedPurchaseModel | null = null;
  @Input() localSaleModel: ICreateUpdateLocalSaleModel | null = null;
  @Input() companyPaymentTotal: number = 0; // Total payments for company detail

  private previousLocalSaleModelString: string = '';
  private previousPurchaseModelString: string = '';
  private previousCompanyPaymentTotal: number = 0;

  // Quantity and Yield Calculations
  totalPurchasedPounds = 0;
  totalTailPoundsCalculated = 0;
  totalWholePoundsCalculated = 0;
  totalTailCompanyPoundsCalculated = 0;
  yieldPercentage = 0;

  // Display properties for template
  displayTotalWholePounds = 0;
  displayTotalTailPounds = 0;
  displayTotalTailPoundsOnly = 0; // Only TAIL section, not including company
  displayTotalCompanyPounds = 0;
  displayTotalYieldPercentage = 0; // Sum of all yield percentages

  // Financial Calculations
  wholeSubtotal = 0;
  tailSubtotal = 0;
  companySubtotal = 0;
  wholeRetentionPercentage = 0;
  tailRetentionPercentage = 0;
  companyRetentionPercentage = 0;
  wholeRetentionAmount = 0;
  tailRetentionAmount = 0;
  companyRetentionAmount = 0;
  wholeAdditionalPenalty = 0;
  tailAdditionalPenalty = 0;
  companyAdditionalPenalty = 0;
  wholeFinalSubtotal = 0;
  tailFinalSubtotal = 0;
  companyFinalSubtotal = 0;
  netAmountToReceive = 0;

  // Status
  localSaleStatus = 'CREATED';
  wholeStatus = 'PENDIENTE';
  tailStatus = 'PENDIENTE';
  companyStatus = 'PENDIENTE';

  ngOnChanges(changes: SimpleChanges): void {
    this.calculateSummary();
    this.updatePreviousValues();
  }

  ngDoCheck(): void {
    // Check for deep changes by comparing stringified versions
    const currentLocalSaleModelString = JSON.stringify(this.localSaleModel);
    const currentPurchaseModelString = JSON.stringify(this.purchaseModel);
    const currentCompanyPaymentTotal = this.companyPaymentTotal;

    if (
      currentLocalSaleModelString !== this.previousLocalSaleModelString ||
      currentPurchaseModelString !== this.previousPurchaseModelString ||
      currentCompanyPaymentTotal !== this.previousCompanyPaymentTotal
    ) {
      this.calculateSummary();
      this.updatePreviousValues();
    }
  }

  private updatePreviousValues(): void {
    this.previousLocalSaleModelString = JSON.stringify(this.localSaleModel);
    this.previousPurchaseModelString = JSON.stringify(this.purchaseModel);
    this.previousCompanyPaymentTotal = this.companyPaymentTotal;
  }

  private calculateSummary(): void {
    this.calculateQuantityAndYield();
    this.calculateFinancialSummary();
    this.calculateLocalSaleStatus();
  }

  private calculateQuantityAndYield(): void {
    // Get data from purchase model
    this.totalPurchasedPounds = this.purchaseModel?.totalPounds || 0;

    // Calculate total tail pounds (WHOLE + TAIL + COMPANY)
    this.totalTailPoundsCalculated = this.getTotalTailPounds();

    // Calculate total whole pounds (from WHOLE section)
    this.totalWholePoundsCalculated = this.getTotalWholePounds();

    // Calculate total company pounds (from COMPANY section)
    this.totalTailCompanyPoundsCalculated = this.getTotalCompanyPounds();

    // Set display properties for template
    this.displayTotalWholePounds = this.totalWholePoundsCalculated;
    this.displayTotalTailPounds = this.getTotalTailPoundsOnly();
    this.displayTotalTailPoundsOnly = this.getTailPoundsOnly(); // Only TAIL section
    this.displayTotalCompanyPounds = this.getTotalCompanyPounds();

    // Calculate total yield percentage (sum of all yields)
    this.displayTotalYieldPercentage = Number(
      (
        this.getWholeYieldPercentage() +
        this.getTailYieldPercentage() +
        this.getCompanyYieldPercentage()
      ).toFixed(2)
    );

    // Calculate yield percentage
    if (this.totalPurchasedPounds > 0) {
      this.yieldPercentage = Number(
        (
          (this.totalWholePoundsCalculated / this.totalPurchasedPounds) *
          100
        ).toFixed(2)
      );
    }
  }

  private calculateFinancialSummary(): void {
    if (!this.localSaleModel) return;

    // Calculate subtotals from localSaleDetails array
    const wholeDetail = this.getWholeDetail();
    const tailDetail = this.getTailDetail();
    const companyDetail = this.localSaleModel.localCompanySaleDetail;

    this.wholeSubtotal = wholeDetail?.grandTotal || 0;
    this.tailSubtotal = tailDetail?.grandTotal || 0;
    this.companySubtotal = companyDetail?.grandTotal || 0;

    // Get retention percentages
    this.wholeRetentionPercentage = wholeDetail?.retentionPercentage || 0;
    this.tailRetentionPercentage = tailDetail?.retentionPercentage || 0;
    this.companyRetentionPercentage = companyDetail?.retentionPercentage || 0;

    // Calculate retention amounts
    this.wholeRetentionAmount = wholeDetail?.retentionAmount || 0;
    this.tailRetentionAmount = tailDetail?.retentionAmount || 0;
    this.companyRetentionAmount = companyDetail?.retentionAmount || 0;

    // Get additional penalties
    this.wholeAdditionalPenalty = wholeDetail?.otherPenalties || 0;
    this.tailAdditionalPenalty = tailDetail?.otherPenalties || 0;
    this.companyAdditionalPenalty = companyDetail?.otherPenalties || 0;

    // Calculate final subtotals (after deductions)
    this.wholeFinalSubtotal = wholeDetail?.netGrandTotal || 0;
    this.tailFinalSubtotal = tailDetail?.netGrandTotal || 0;
    this.companyFinalSubtotal = companyDetail?.netGrandTotal || 0;

    // Calculate net amount to receive
    this.netAmountToReceive = Number(
      (
        this.wholeFinalSubtotal +
        this.tailFinalSubtotal +
        this.companyFinalSubtotal
      ).toFixed(2)
    );
  }

  private calculateLocalSaleStatus(): void {
    // Calculate individual statuses based on items
    this.calculateWholeStatus();
    this.calculateTailStatus();
    this.calculateCompanyStatus();

    // Overall local sale status (keep for general display)
    const status = (this.localSaleModel as any)?.status;

    if (!status) {
      this.localSaleStatus = 'SIN PAGOS';
      return;
    }

    switch (status) {
      case 'CREATED':
        this.localSaleStatus = 'SIN PAGOS';
        break;
      case 'IN_PROGRESS':
        this.localSaleStatus = 'PENDIENTE';
        break;
      case 'COMPLETED':
        this.localSaleStatus = 'PAGADO';
        break;
      default:
        this.localSaleStatus = 'SIN PAGOS';
    }
  }

  private calculateWholeStatus(): void {
    const wholeDetail = this.getWholeDetail();
    if (!wholeDetail || !wholeDetail.items || wholeDetail.items.length === 0) {
      this.wholeStatus = 'SIN PAGOS';
      return;
    }

    const allPaid = wholeDetail.items.every(
      (item: any) => item.paymentStatus === 'PAID'
    );
    const anyPaid = wholeDetail.items.some(
      (item: any) => item.paymentStatus === 'PAID'
    );

    if (allPaid) {
      this.wholeStatus = 'PAGADO';
    } else if (anyPaid) {
      this.wholeStatus = 'PENDIENTE';
    } else {
      this.wholeStatus = 'SIN PAGOS';
    }
  }

  private calculateTailStatus(): void {
    const tailDetail = this.getTailDetail();
    if (!tailDetail || !tailDetail.items || tailDetail.items.length === 0) {
      this.tailStatus = 'SIN PAGOS';
      return;
    }

    const allPaid = tailDetail.items.every(
      (item: any) => item.paymentStatus === 'PAID'
    );
    const anyPaid = tailDetail.items.some(
      (item: any) => item.paymentStatus === 'PAID'
    );

    if (allPaid) {
      this.tailStatus = 'PAGADO';
    } else if (anyPaid) {
      this.tailStatus = 'PENDIENTE';
    } else {
      this.tailStatus = 'SIN PAGOS';
    }
  }

  private calculateCompanyStatus(): void {
    const companyDetail = this.localSaleModel?.localCompanySaleDetail;
    if (
      !companyDetail ||
      !companyDetail.items ||
      companyDetail.items.length === 0
    ) {
      this.companyStatus = 'SIN PAGOS';
      return;
    }

    const netGrandTotal = Number(companyDetail.netGrandTotal) || 0;
    const totalPaid = Number(this.companyPaymentTotal) || 0;

    if (netGrandTotal <= 0) {
      this.companyStatus = 'SIN PAGOS';
      return;
    }

    // Check if payments cover the netGrandTotal (with small tolerance for rounding)
    if (totalPaid >= netGrandTotal - 0.01) {
      this.companyStatus = 'PAGADO';
    } else if (totalPaid > 0) {
      this.companyStatus = 'PENDIENTE';
    } else {
      this.companyStatus = 'SIN PAGOS';
    }
  }

  private getTotalTailPounds(): number {
    const wholePounds = this.getTotalWholePounds();
    const tailPounds = this.getTotalTailPoundsOnly();
    const companyPounds = this.getTotalCompanyPounds();
    return Number((wholePounds + tailPounds + companyPounds).toFixed(2));
  }

  private getTotalWholePounds(): number {
    const wholeDetail = this.getWholeDetail();
    return wholeDetail?.poundsGrandTotal || 0;
  }

  getTotalTailPoundsOnly(): number {
    const tailDetail = this.getTailDetail();
    const tailPounds = tailDetail?.poundsGrandTotal || 0;

    // Add company detail pounds since it's also headless shrimp (tail)
    const companyPounds =
      this.localSaleModel?.localCompanySaleDetail?.poundsGrandTotal || 0;

    return Number((tailPounds + companyPounds).toFixed(2));
  }

  getTailPoundsOnly(): number {
    const tailDetail = this.getTailDetail();
    return tailDetail?.poundsGrandTotal || 0;
  }

  getTotalCompanyPounds(): number {
    return this.localSaleModel?.localCompanySaleDetail?.poundsGrandTotal || 0;
  }

  private getWholeDetail(): any {
    if (!this.localSaleModel?.localSaleDetails) return null;
    return this.localSaleModel.localSaleDetails.find(
      (detail: any) => detail.style === 'WHOLE'
    );
  }

  private getTailDetail(): any {
    if (!this.localSaleModel?.localSaleDetails) return null;
    return this.localSaleModel.localSaleDetails.find(
      (detail: any) => detail.style === 'TAIL'
    );
  }

  // Helper methods for display
  getWholeYieldPercentage(): number {
    if (this.totalPurchasedPounds > 0) {
      return Number(
        (
          (this.totalWholePoundsCalculated / this.totalPurchasedPounds) *
          100
        ).toFixed(2)
      );
    }
    return 0;
  }

  getTailYieldPercentage(): number {
    if (this.totalPurchasedPounds > 0) {
      return Number(
        (
          (this.getTotalTailPoundsOnly() / this.totalPurchasedPounds) *
          100
        ).toFixed(2)
      );
    }
    return 0;
  }

  getCompanyYieldPercentage(): number {
    if (this.totalPurchasedPounds > 0) {
      return Number(
        (
          (this.getTotalCompanyPounds() / this.totalPurchasedPounds) *
          100
        ).toFixed(2)
      );
    }
    return 0;
  }
}
