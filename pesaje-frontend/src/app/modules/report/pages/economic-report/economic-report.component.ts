import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PERMISSION_ROUTES } from '../../../../constants/routes.constants';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  IEconomicReportModel,
  ILogisticsDetailsModel,
} from '../../interfaces/economic-report.interface';
import { ReportService } from '../../services/report.service';
import { PurchaseStatusEnum } from 'src/app/modules/purchases/interfaces/purchase.interface';
import { DateUtilsService } from 'src/app/utils/date-utils.service';
import { AlertService } from 'src/app/utils/alert.service';
import { AuthService } from 'src/app/modules/auth';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-economic-report',
  templateUrl: './economic-report.component.html',
  styleUrl: './economic-report.component.scss',
})
export class EconomicReportComponent implements OnInit, OnDestroy {
  PERMISSION_ROUTE = PERMISSION_ROUTES.REPORTS.ECONOMIC;

  isOnlyBuyer = false;
  searchSubmitted = false;
  controlNumber: string;

  economicReportModel?: IEconomicReportModel;

  purchaseStatus: string;
  logisticsType: string;
  weightSheetNumberPurchase: string;
  weightSheetNumberSale: string;
  logisticsSheetNumber: string;

  private unsubscribe: Subscription[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private reportService: ReportService,
    private dateUtils: DateUtilsService,
    private alertService: AlertService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private translateService: TranslateService
  ) {}

  get logisticsArray(): ILogisticsDetailsModel[] {
    const logistics = this.economicReportModel?.logistics;

    if (Array.isArray(logistics)) {
      return logistics;
    } else if (logistics) {
      return [logistics];
    }

    return [];
  }

  get singleLogisticsObject(): ILogisticsDetailsModel | null {
    const logistics = this.economicReportModel?.logistics;

    if (!logistics) {
      return null;
    }

    if (Array.isArray(logistics)) {
      return logistics.length > 0 ? logistics[0] : null; // pick first if array
    }

    return logistics; // already a single object
  }

  ngOnInit(): void {
    this.isOnlyBuyer = this.authService.isOnlyBuyer;
  }

  loadReportInfo() {
    this.searchSubmitted = true;

    if (!this.controlNumber?.trim()) {
      this.economicReportModel = undefined;
      return; // don't search if input is empty
    }

    const userId: string | null = this.isOnlyBuyer
      ? this.authService.currentUserValue?.id ?? null
      : null;

    const sub = this.reportService
      .getEconomicReportByParams(false, userId, null, null, this.controlNumber)
      .subscribe({
        next: (report) => {
          if (!report) {
            this.alertService.showTranslatedAlert({
              alertType: 'info',
              messageKey: 'MESSAGES.PURCHASE_NOT_FOUND',
            });
            return;
          }

          this.economicReportModel = report;

          // Format purchase date
          if (this.economicReportModel.purchase?.purchaseDate) {
            this.economicReportModel.purchase.purchaseDate =
              this.dateUtils.formatISOToDateInput(
                this.economicReportModel.purchase.purchaseDate
              );
          }

          // Map purchase status
          const statusMap = {
            [PurchaseStatusEnum.DRAFT]: this.translateService.instant('PURCHASES.STATUS.DRAFT'),
            [PurchaseStatusEnum.CREATED]: this.translateService.instant('PURCHASES.STATUS.NO_PAYMENTS'),
            [PurchaseStatusEnum.IN_PROGRESS]: this.translateService.instant('PURCHASES.STATUS.IN_PROGRESS'),
            [PurchaseStatusEnum.COMPLETED]: this.translateService.instant('PURCHASES.STATUS.PAYMENT_COMPLETE'),
            [PurchaseStatusEnum.CONFIRMED]: this.translateService.instant('PURCHASES.STATUS.INFORMATION_COMPLETE'),
            [PurchaseStatusEnum.CLOSED]: this.translateService.instant('PURCHASES.STATUS.CLOSED'),
          };
          this.purchaseStatus =
            statusMap[this.economicReportModel.purchase?.status] || '-';

          // Set sheet numbers
          this.weightSheetNumberPurchase =
            this.economicReportModel.purchase?.weightSheetNumber || '-';
          this.weightSheetNumberSale =
            this.economicReportModel.sale?.weightSheetNumber || '-';
          this.logisticsSheetNumber = this.getLogisticsSheetNumber();

          // Format sale dates
          if (this.economicReportModel.sale) {
            if (this.economicReportModel.sale.saleDate) {
              this.economicReportModel.sale.saleDate =
                this.dateUtils.formatISOToDateInput(
                  this.economicReportModel.sale.saleDate
                );
            }

            if (this.economicReportModel.sale.receptionDate) {
              this.economicReportModel.sale.receptionDate =
                this.dateUtils.formatISOToDateInput(
                  this.economicReportModel.sale.receptionDate
                );
            }
          }

          // Format logistics dates
          if (this.economicReportModel.isCompanySale) {
            // Single logistics object
            this.economicReportModel.logistics =
              report.logistics as ILogisticsDetailsModel;
            if (this.economicReportModel.logistics?.logisticsDate) {
              this.economicReportModel.logistics.logisticsDate =
                this.dateUtils.formatISOToDateInput(
                  this.economicReportModel.logistics.logisticsDate
                );
            }
          } else {
            // Array of logistics
            if (Array.isArray(this.economicReportModel.logistics)) {
              this.economicReportModel.logistics =
                this.economicReportModel.logistics.map((logisticsItem) => ({
                  ...logisticsItem,
                  logisticsDate: this.dateUtils.formatISOToDateInput(
                    logisticsItem.logisticsDate
                  ),
                }));
            }
          }

          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching economic report:', error);
          this.alertService.showTranslatedAlert({ alertType: 'error' });
        },
      });

    this.unsubscribe.push(sub);
  }

  logisticsTypeLabel(type: string): string {
    switch (type) {
      case 'SHIPMENT':
        if (this.economicReportModel?.purchase.companyName !== 'Local')
          return this.translateService.instant('REPORTS.ECONOMIC.LOGISTICS_TYPES.SHIPMENT_COMPANY');
        else return this.translateService.instant('REPORTS.ECONOMIC.LOGISTICS_TYPES.SHIPMENT_LOCAL');
      case 'LOCAL_PROCESSING':
        return this.translateService.instant('REPORTS.ECONOMIC.LOGISTICS_TYPES.LOCAL_PROCESSING');
      default:
        return type;
    }
  }

  private getLogisticsSheetNumber(): string {
    const logistics = this.economicReportModel?.logistics;

    if (!logistics) {
      return '-';
    }

    if (Array.isArray(logistics)) {
      // For local sales, show all logistics sheet numbers
      const sheetNumbers = logistics
        .map((log) => log.logisticsSheetNumber)
        .filter((sheet) => sheet && sheet.trim() !== '');

      return sheetNumbers.length > 0 ? sheetNumbers.join(', ') : '-';
    } else {
      // For company sales, show single logistics sheet number
      return logistics.logisticsSheetNumber || '-';
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
  }
}
