import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PERMISSION_ROUTES } from '../../../../constants/routes.constants';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ReportService } from '../../services/report.service';
import { DateUtilsService } from 'src/app/utils/date-utils.service';
import { AlertService } from 'src/app/utils/alert.service';
import { AuthService } from 'src/app/modules/auth';
import {
  ICreateUpdateTotalReport,
  ILogisticsDetailsModel,
  IPurchaseDetailsModel,
  ISaleDetailsModel,
  ITotalReportModel,
} from '../../interfaces/total-report.interface';

@Component({
  selector: 'app-total-report',
  templateUrl: './total-report.component.html',
  styleUrl: './total-report.component.scss',
})
export class TotalReportComponent implements OnInit, OnDestroy {
  PERMISSION_ROUTE = PERMISSION_ROUTES.REPORTS.TOTAL;

  isOnlyBuyer = false;
  searchSubmitted = false;
  reportId: string;
  controlNumber: string;
  isHistory: boolean = false;

  totalReportModel?: ITotalReportModel;

  tempPrice = 0;

  diffPounds = 0;
  balanceNet = 0;
  subtotalGrossProfit = 0;
  totalGrossProfit = 0;
  totalFactors = 0;

  retentionFactorInput: number;
  retention = 0;

  payBrokerFactorInput: number;
  totalToPayBroker = 0;

  payQualifierFactorInput: number;
  totalToPayQualifier = 0;

  taxesFactorInput: number;
  taxes = 0;

  buyerProfitFactorInput: number;
  responsibleBuyerProfit = 0;

  secretaryProfitFactorInput: number;
  secretaryProfit = 0;

  ceoProfitFactorInput: number;
  ceoProfit = 0;

  techLegalProfitFactorInput: number;
  techLegalProfit = 0;

  investCapitalProfitFactorInput: number;
  investCapitalProfit = 0;

  profitFactorInput: number;
  profit = 0;

  private unsubscribe: Subscription[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private reportService: ReportService,
    private dateUtils: DateUtilsService,
    private alertService: AlertService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isOnlyBuyer = this.authService.isOnlyBuyer;
  }

  searchControlNumber() {
    this.searchSubmitted = true;

    if (!this.controlNumber?.trim()) {
      this.totalReportModel = undefined;
      return; // don't search if input is empty
    }

    const sub = this.reportService
      .getRecordedTotalReportByControlNumber(this.controlNumber)
      .subscribe({
        next: (report) => {
          if (!report) {
            this.loadReportInfo();
            return;
          }

          this.isHistory = true;

          this.populateFromPayload(report!);

          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching recorded total report:', error);
          this.alertService.showTranslatedAlert({ alertType: 'error' });
        },
      });

    this.unsubscribe.push(sub);
  }

  loadReportInfo() {
    const userId: string | null = this.isOnlyBuyer
      ? this.authService.currentUserValue?.id ?? null
      : null;

    const sub = this.reportService
      .getTotalReportByParams(false, userId, null, null, this.controlNumber)
      .subscribe({
        next: (report) => {
          const noValidPurchase =
            !report ||
            !report.purchase ||
            report.purchase.companyName === 'Local';

          if (noValidPurchase) {
            this.alertService.showTranslatedAlert({
              alertType: 'info',
              messageKey: 'MESSAGES.INCOMPLETE_TOTAL_REPORT_INFO',
              customIcon: 'info',
            });

            return;
          }

          this.totalReportModel = report;

          // Format purchase date
          if (this.totalReportModel.purchase?.purchaseDate) {
            this.totalReportModel.purchase.purchaseDate =
              this.dateUtils.formatISOToDateInput(
                this.totalReportModel.purchase.purchaseDate
              );
          }

          this.calculateDiffPounds();
          this.calculateBalanceNet();
          this.calculateSubtotal();

          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching total report:', error);
          this.alertService.showTranslatedAlert({ alertType: 'error' });
        },
      });

    this.unsubscribe.push(sub);
  }

  clearFilters() {
    this.controlNumber = '';
    this.searchSubmitted = false;

    this.totalReportModel = undefined;
  }

  calculateDiffPounds() {
    this.diffPounds =
      (this.totalReportModel!.sale.wholePoundsReceived || 0) -
      (this.totalReportModel!.purchase.pounds || 0);
  }

  calculateBalanceNet() {
    this.balanceNet =
      (this.totalReportModel!.sale.totalToReceive || 0) -
      (this.totalReportModel!.purchase.totalToPay || 0);
  }

  calculateRetention() {
    const totalPaidSale =
      Number(this.totalReportModel!.sale.totalToReceive) || 0;
    const retentionFactor = Number(this.retentionFactorInput) || 0;

    this.retention = totalPaidSale * (retentionFactor / 100);

    this.calculateSubtotal();
    this.calculateTotalFactors();
  }

  calculateSubtotal() {
    this.subtotalGrossProfit =
      (this.balanceNet || 0) -
      (this.totalReportModel!.logistics.totalToPay || 0) -
      (this.retention || 0);

    this.calculateTotal();
  }

  calculateTotalToPayBroker() {
    const shrimpPoundsBuyed =
      Number(this.totalReportModel!.purchase.pounds) || 0;
    const payBrokerFactor = Number(this.payBrokerFactorInput) || 0;

    this.totalToPayBroker = +(
      shrimpPoundsBuyed *
      (payBrokerFactor / 100)
    ).toFixed(2);

    this.calculateTotal();
    this.calculateTotalFactors();
  }

  calculateTotalToPayQualifier() {
    const shrimpPoundsReceived =
      Number(this.totalReportModel!.sale.wholePoundsReceived) || 0;
    const payQualifierFactor = Number(this.payQualifierFactorInput) || 0;

    this.totalToPayQualifier = +(
      shrimpPoundsReceived *
      (payQualifierFactor / 100)
    ).toFixed(2);

    this.calculateTotal();
    this.calculateTotalFactors();
  }

  calculateTaxes() {
    const subtotal = Number(this.subtotalGrossProfit) || 0;
    const taxesFactor = Number(this.taxesFactorInput) || 0;

    this.taxes = +(subtotal * (taxesFactor / 100)).toFixed(2);

    this.calculateTotal();
    this.calculateTotalFactors();
  }

  calculateTotal() {
    this.totalGrossProfit =
      (this.subtotalGrossProfit || 0) -
      (this.totalToPayBroker || 0) -
      (this.totalToPayQualifier || 0) -
      (this.taxes || 0);
  }

  calculateBuyerProfit() {
    const total = Number(this.totalGrossProfit) || 0;
    const buyerProfitFactor = Number(this.buyerProfitFactorInput) || 0;
    this.responsibleBuyerProfit = +(total * (buyerProfitFactor / 100)).toFixed(
      2
    );

    this.calculateTotalFactors();
  }

  calculateSecretaryProfit() {
    const total = Number(this.totalGrossProfit) || 0;
    const factor = Number(this.secretaryProfitFactorInput) || 0;
    this.secretaryProfit = +(total * (factor / 100)).toFixed(2);

    this.calculateTotalFactors();
  }

  calculateCeoProfit() {
    const total = Number(this.totalGrossProfit) || 0;
    const factor = Number(this.ceoProfitFactorInput) || 0;
    this.ceoProfit = +(total * (factor / 100)).toFixed(2);

    this.calculateTotalFactors();
  }

  calculateTechLegalProfit() {
    const total = Number(this.totalGrossProfit) || 0;
    const factor = Number(this.techLegalProfitFactorInput) || 0;
    this.techLegalProfit = +(total * (factor / 100)).toFixed(2);

    this.calculateTotalFactors();
  }

  calculateInvestCapitalProfit() {
    const total = Number(this.totalGrossProfit) || 0;
    const factor = Number(this.investCapitalProfitFactorInput) || 0;
    this.investCapitalProfit = +(total * (factor / 100)).toFixed(2);

    this.calculateTotalFactors();
  }

  calculateProfit() {
    const total = Number(this.totalGrossProfit) || 0;
    const factor = Number(this.profitFactorInput) || 0;
    this.profit = +(total * (factor / 100)).toFixed(2);

    this.calculateTotalFactors();
  }

  calculateTotalFactors() {
    this.totalFactors =
      (Number(this.retentionFactorInput) || 0) +
      (Number(this.payBrokerFactorInput) || 0) +
      (Number(this.payQualifierFactorInput) || 0) +
      (Number(this.taxesFactorInput) || 0) +
      (Number(this.buyerProfitFactorInput) || 0) +
      (Number(this.secretaryProfitFactorInput) || 0) +
      (Number(this.ceoProfitFactorInput) || 0) +
      (Number(this.techLegalProfitFactorInput) || 0) +
      (Number(this.investCapitalProfitFactorInput) || 0) +
      (Number(this.profitFactorInput) || 0);
  }

  confirmSave(): void {
    this.alertService.confirm().then((result) => {
      if (result.isConfirmed) {
        this.saveTotalReport();
      }
    });
  }

  saveTotalReport() {
    const payload = this.mapPayload();

    const sub = this.reportService.createTotalReport(payload).subscribe({
      next: (response) => {
        this.isHistory = true;
        this.alertService.showTranslatedAlert({ alertType: 'success' });
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error creating total report:', error);
        this.alertService.showTranslatedAlert({ alertType: 'error' });
      },
    });

    this.unsubscribe.push(sub);
  }

  mapPayload(): ICreateUpdateTotalReport {
    return {
      // Purchase info
      purchaseId: this.totalReportModel!.purchase.id,
      controlNumber: this.totalReportModel!.purchase.controlNumber,
      responsibleBuyer: this.totalReportModel!.purchase.responsibleBuyer,
      brokerName: this.totalReportModel!.purchase.brokerName,
      purchaseDate: this.totalReportModel!.purchase.purchaseDate,
      clientName: this.totalReportModel!.purchase.clientName,
      averageGramPurchase: this.totalReportModel!.purchase.averageGram,
      pricePurchase: this.totalReportModel!.purchase.price,
      poundsPurchase: this.totalReportModel!.purchase.pounds,
      totalToPayPurchase: this.totalReportModel!.purchase.totalToPay,

      // Sale info
      averageBatchGramsSale: this.totalReportModel!.sale.averageBatchGrams,
      salePrice: this.tempPrice,
      wholePoundsReceived: this.totalReportModel!.sale.wholePoundsReceived,
      diffPounds: this.diffPounds,
      totalToReceiveSale: this.totalReportModel!.sale.totalToReceive,
      balanceNet: this.balanceNet,

      // Logistics & retention
      logisticsTotalToPay: this.totalReportModel!.logistics.totalToPay,
      retention: this.retention,
      retentionFactorInput: Number(this.retentionFactorInput) || 0,

      // Subtotal Gross Profit
      subtotalGrossProfit: this.subtotalGrossProfit,

      // Pay Broker & Qualifier
      totalToPayBroker: this.totalToPayBroker,
      payBrokerFactorInput: Number(this.payBrokerFactorInput) || 0,

      totalToPayQualifier: this.totalToPayQualifier,
      payQualifierFactorInput: Number(this.payQualifierFactorInput) || 0,

      taxes: this.taxes,
      taxesFactorInput: Number(this.taxesFactorInput) || 0,

      // Total Gross Profit
      totalGrossProfit: this.totalGrossProfit,

      // Distribution
      responsibleBuyerProfit: this.responsibleBuyerProfit,
      buyerProfitFactorInput: Number(this.buyerProfitFactorInput) || 0,

      secretaryProfit: this.secretaryProfit,
      secretaryProfitFactorInput: Number(this.secretaryProfitFactorInput) || 0,

      ceoProfit: this.ceoProfit,
      ceoProfitFactorInput: Number(this.ceoProfitFactorInput) || 0,

      techLegalProfit: this.techLegalProfit,
      techLegalProfitFactorInput: Number(this.techLegalProfitFactorInput) || 0,

      investCapitalProfit: this.investCapitalProfit,
      investCapitalProfitFactorInput:
        Number(this.investCapitalProfitFactorInput) || 0,

      profit: this.profit,
      profitFactorInput: Number(this.profitFactorInput) || 0,

      // Final Total Factors
      totalFactors: this.totalFactors,
    };
  }

  populateFromPayload(payload: ICreateUpdateTotalReport): void {
    this.totalReportModel = {} as ITotalReportModel;
    this.totalReportModel.purchase = {} as IPurchaseDetailsModel;
    this.totalReportModel.logistics = {} as ILogisticsDetailsModel;
    this.totalReportModel.sale = {} as ISaleDetailsModel;
    // Purchase info
    this.totalReportModel!.purchase.id = payload.purchaseId;
    this.totalReportModel!.purchase.controlNumber = payload.controlNumber;
    this.totalReportModel!.purchase.responsibleBuyer = payload.responsibleBuyer;
    this.totalReportModel!.purchase.brokerName = payload.brokerName;
    this.totalReportModel!.purchase.purchaseDate = payload.purchaseDate;
    this.totalReportModel!.purchase.clientName = payload.clientName;
    this.totalReportModel!.purchase.averageGram = payload.averageGramPurchase;
    this.totalReportModel!.purchase.price = payload.pricePurchase;
    this.totalReportModel!.purchase.pounds = payload.poundsPurchase;
    this.totalReportModel!.purchase.totalToPay = payload.totalToPayPurchase;

    // Sale info
    this.totalReportModel!.sale.averageBatchGrams =
      payload.averageBatchGramsSale;
    this.tempPrice = payload.salePrice;
    this.totalReportModel!.sale.wholePoundsReceived =
      payload.wholePoundsReceived;
    this.diffPounds = payload.diffPounds;
    this.totalReportModel!.sale.totalToReceive = payload.totalToReceiveSale;
    this.balanceNet = payload.balanceNet;

    // Logistics & retention
    this.totalReportModel!.logistics.totalToPay = payload.logisticsTotalToPay;
    this.retention = payload.retention;
    this.retentionFactorInput = payload.retentionFactorInput;

    // Subtotal Gross Profit
    this.subtotalGrossProfit = payload.subtotalGrossProfit;

    // Pay Broker & Qualifier
    this.totalToPayBroker = payload.totalToPayBroker;
    this.payBrokerFactorInput = payload.payBrokerFactorInput;

    this.totalToPayQualifier = payload.totalToPayQualifier;
    this.payQualifierFactorInput = payload.payQualifierFactorInput;

    this.taxes = payload.taxes;
    this.taxesFactorInput = payload.taxesFactorInput;

    // Total Gross Profit
    this.totalGrossProfit = payload.totalGrossProfit;

    // Distribution
    this.responsibleBuyerProfit = payload.responsibleBuyerProfit;
    this.buyerProfitFactorInput = payload.buyerProfitFactorInput;

    this.secretaryProfit = payload.secretaryProfit;
    this.secretaryProfitFactorInput = payload.secretaryProfitFactorInput;

    this.ceoProfit = payload.ceoProfit;
    this.ceoProfitFactorInput = payload.ceoProfitFactorInput;

    this.techLegalProfit = payload.techLegalProfit;
    this.techLegalProfitFactorInput = payload.techLegalProfitFactorInput;

    this.investCapitalProfit = payload.investCapitalProfit;
    this.investCapitalProfitFactorInput =
      payload.investCapitalProfitFactorInput;

    this.profit = payload.profit;
    this.profitFactorInput = payload.profitFactorInput;

    // Final Total Factors
    this.totalFactors = payload.totalFactors;
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
  }
}
