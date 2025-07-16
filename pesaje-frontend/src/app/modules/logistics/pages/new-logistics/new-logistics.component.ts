import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { NgForm } from '@angular/forms';
import { DateUtilsService } from '../../../../utils/date-utils.service';
import { AuthService } from '../../../auth';
import { IReducedDetailedPurchaseModel } from '../../../purchases/interfaces/purchase.interface';
import { PurchaseService } from '../../../purchases/services/purchase.service';
import { PERMISSION_ROUTES } from '../../../../constants/routes.constants';
import {
  ILogisticsCategoryModel,
  LogisticsCategoryEnum,
} from '../../../shared/interfaces/logistic-type.interface';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertService } from '../../../../utils/alert.service';
import { LogisticsCategoryService } from '../../../shared/services/logistics-category.service';
import {
  ICreateUpdateLogisticsModel,
  IDetailedReadLogisticsModel,
  IReadLogisticsModel,
  LogisticsStatusEnum,
  LogisticsTypeEnum,
} from '../../interfaces/logistics.interface';
import { LogisticsService } from '../../services/logistics.service';
import {
  ILogisticsItemModel,
  ICreateUpdateLogisticsItemModel,
} from '../../interfaces/logistics-item.interface';
import { IReducedUserModel } from '../../../settings/interfaces/user.interface';
import { IReducedShrimpFarmModel } from '../../../shared/interfaces/shrimp-farm.interface';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-new-logistics',
  templateUrl: './new-logistics.component.html',
  styleUrl: './new-logistics.component.scss',
})
export class NewLogisticsComponent implements OnInit, OnDestroy {
  PERMISSION_ROUTE = PERMISSION_ROUTES.LOGISTICS.LOGISTICS_FORM;

  isOnlyBuyer = false;
  hasRouteId = false;
  searchSubmitted = false;
  controlNumber: string;

  logisticsModel: ICreateUpdateLogisticsModel;
  purchaseModel: IReducedDetailedPurchaseModel;

  logisticsTypes: LogisticsTypeEnum[];
  logisticsTypeLabels: { [key in LogisticsTypeEnum]?: string } = {};

  logisticsItems: ILogisticsItemModel[] = [];
  personnelLogisticsItems: ILogisticsItemModel[] = [];
  inputLogisticsItems: ILogisticsItemModel[] = [];

  personnelLogisticsCategoryList: ILogisticsCategoryModel[] = [];
  inputLogisticsCategoryList: ILogisticsCategoryModel[] = [];

  logisticsId: string | undefined;

  private unsubscribe: Subscription[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private alertService: AlertService,
    private authService: AuthService,
    private dateUtils: DateUtilsService,
    private logisticsCategoryService: LogisticsCategoryService,
    private purchaseService: PurchaseService,
    private logisticsService: LogisticsService,
    private route: ActivatedRoute,
    private location: Location,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  get logisticsDateFormatted(): string | null {
    return this.dateUtils.formatISOToDateInput(
      this.logisticsModel.logisticsDate
    );
  }

  get purchaseDateFormatted(): string | null {
    return this.dateUtils.formatISOToDateInput(this.purchaseModel.purchaseDate);
  }

  get grandTotalDisplayed(): number {
    const personnelTotal = this.personnelLogisticsItems?.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0
    );

    const inputTotal = this.inputLogisticsItems?.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0
    );

    return personnelTotal + inputTotal;
  }

  ngOnInit(): void {
    this.logisticsId = this.route.snapshot.paramMap.get('id') || undefined;
    this.hasRouteId = !!this.logisticsId;
    this.isOnlyBuyer = this.authService.isOnlyBuyer;

    this.initializeModels();
    this.loadLogisticsCategories();

    if (this.logisticsId) {
      const logisticsSub = this.logisticsService
        .getLogisticsById(this.logisticsId)
        .subscribe({
          next: (logistics: IDetailedReadLogisticsModel) => {
            this.logisticsModel = {
              id: logistics.id,
              purchase: logistics.purchase?.id,
              type: logistics.type,
              logisticsDate: logistics.logisticsDate,
              status: logistics.status,
              grandTotal: logistics.grandTotal,
              items: [],
            };
            this.controlNumber = logistics.purchase.controlNumber!;
            this.purchaseModel = logistics.purchase;

            this.personnelLogisticsItems = logistics.items.filter(
              (item) =>
                item.logisticsCategory.category ===
                LogisticsCategoryEnum.PERSONNEL
            );

            this.inputLogisticsItems = logistics.items.filter(
              (item) =>
                item.logisticsCategory.category === LogisticsCategoryEnum.INPUTS
            );

            if (this.purchaseModel.controlNumber?.includes('CO')) {
              this.logisticsTypeLabels = {
                [LogisticsTypeEnum.SHIPMENT]: 'Envío a Compañía',
              };
              this.logisticsTypes = [LogisticsTypeEnum.SHIPMENT];
            } else {
              this.logisticsTypeLabels = {
                [LogisticsTypeEnum.SHIPMENT]: 'Envío Local',
                [LogisticsTypeEnum.LOCAL_PROCESSING]: 'Procesamiento Local',
              };
              this.logisticsTypes = Object.values(LogisticsTypeEnum);
            }

            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('Error fetching logistics:', error);
            this.alertService.showTranslatedAlert({ alertType: 'error' });
          },
        });

      this.unsubscribe.push(logisticsSub);
    }
  }

  initializeModels() {
    this.logisticsModel = {} as ICreateUpdateLogisticsModel;

    this.purchaseModel = {} as IReducedDetailedPurchaseModel;
    this.purchaseModel.buyer = {} as IReducedUserModel;
    this.purchaseModel.broker = {} as IReducedUserModel;
    this.purchaseModel.client = {} as IReducedUserModel;
    this.purchaseModel.shrimpFarm = {} as IReducedShrimpFarmModel;
  }

  loadLogisticsCategories(): void {
    this.logisticsCategoryService.getAllLogisticsCategories().subscribe({
      next: (categories) => {
        this.personnelLogisticsCategoryList = categories
          .filter(
            (logistic) => logistic.category === LogisticsCategoryEnum.PERSONNEL
          )
          .sort((a, b) => a.name.localeCompare(b.name));

        this.inputLogisticsCategoryList = categories
          .filter(
            (logistic) => logistic.category === LogisticsCategoryEnum.INPUTS
          )
          .sort((a, b) => a.name.localeCompare(b.name));

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching logistics categories:', error);
      },
    });
  }

  confirmSave(event: Event, form: NgForm) {
    if (form && form.invalid) {
      return;
    }

    // Check if both lists are empty
    if (
      (!this.personnelLogisticsItems ||
        this.personnelLogisticsItems.length === 0) &&
      (!this.inputLogisticsItems || this.inputLogisticsItems.length === 0)
    ) {
      this.alertService.showTranslatedAlert({
        alertType: 'info',
      });
      return;
    }

    this.alertService.confirm().then((result) => {
      if (result.isConfirmed) {
        this.submitLogisticsForm();
      }
    });
  }

  submitLogisticsForm() {
    this.logisticsItems = [
      ...this.personnelLogisticsItems,
      ...this.inputLogisticsItems,
    ];

    this.logisticsModel.purchase = this.purchaseModel.id;
    this.logisticsModel.items = this.logisticsItems.map(
      (x) =>
      ({
        logisticsCategory: x.logisticsCategory.id,
        unit: x.unit,
        cost: x.cost,
        total: x.total,
        description: x.description,
      } as ICreateUpdateLogisticsItemModel)
    );
    this.logisticsModel.grandTotal = this.grandTotalDisplayed;

    if (this.logisticsId) {
      this.logisticsService
        .updateLogistics(this.logisticsId, this.logisticsModel)
        .subscribe({
          next: (response) => {
            this.alertService.showTranslatedAlert({ alertType: 'success' });
          },
          error: (error) => {
            console.error('Error updating logistics:', error);
            this.alertService.showTranslatedAlert({ alertType: 'error' });
          },
        });
    } else {
      this.logisticsService.createLogistics(this.logisticsModel).subscribe({
        next: (response) => {
          this.logisticsId = response.id; // ✅ Store the new ID for future updates
          this.cdr.detectChanges();
          this.alertService.showTranslatedAlert({ alertType: 'success' });
        },
        error: (error) => {
          console.error('Error creating logistics:', error);
          this.alertService.showTranslatedAlert({ alertType: 'error' });
        },
      });
    }
  }

  canSaveLogistics(): boolean {
    if (this.logisticsId) {
      return this.logisticsModel.status !== LogisticsStatusEnum.CLOSED;
    } else {
      return !!this.purchaseModel.id;
    }
    return true;
  }

  searchPurchase(): void {
    this.searchSubmitted = true;

    if (!this.controlNumber?.trim()) {
      return; // don't search if input is empty
    }

    const userId =
      this.isOnlyBuyer && this.authService.currentUserValue?.id
        ? this.authService.currentUserValue.id
        : null;

    const purchaseSub = this.purchaseService
      .getPurchaseByParams(false, userId, null, null, null, this.controlNumber)
      .subscribe({
        next: (purchases: IReducedDetailedPurchaseModel[]) => {
          if (purchases.length === 0) {
            this.alertService.showTranslatedAlert({
              alertType: 'info',
              messageKey: 'MESSAGES.PURCHASE_NOT_FOUND',
              customIcon: 'info',
            });

            this.initializeModels();
            return;
          }

          const purchase = purchases[0];

          // Fetch logistics before assigning
          const logisticsSub = this.logisticsService
            .getLogisticsByParams(false, userId, this.controlNumber)
            .subscribe({
              next: (logistics: IReadLogisticsModel[]) => {
                const isLocal =
                  purchase.company.name?.toLowerCase() === 'local';
                const maxAllowed = isLocal ? 2 : 1;
                const hasDifferentTypes = isLocal ? new Set(logistics.map(l => l.type)).size > 1 : true;
                if (logistics.length >= maxAllowed && hasDifferentTypes) {
                  this.alertService.showTranslatedAlert({
                    alertType: 'warning',
                    messageKey: 'MESSAGES.LOGISTICS_LIMIT_REACHED',
                    params: { count: isLocal ? 2 : 1, record: Array.from(new Set(logistics.map(l => l.description))).join(', ') },
                  });

                  this.initializeModels();
                  this.cdr.detectChanges();
                  return;
                }

                this.purchaseModel = purchase;

                const controlNumberIncludesCO =
                  purchase.controlNumber?.includes('CO');

                if (controlNumberIncludesCO) {
                  this.logisticsTypeLabels = {
                    [LogisticsTypeEnum.SHIPMENT]: 'Envío a Compañía',
                  };
                  this.logisticsTypes = [LogisticsTypeEnum.SHIPMENT];

                  this.cdr.detectChanges();
                  return;
                }

                if (logistics.length === 0) {
                  this.logisticsTypeLabels = {
                    [LogisticsTypeEnum.SHIPMENT]: 'Envío Local',
                    [LogisticsTypeEnum.LOCAL_PROCESSING]: 'Procesamiento Local',
                  };
                  this.logisticsTypes = Object.values(LogisticsTypeEnum);

                  this.cdr.detectChanges();
                  return;
                }

                const existingType = logistics[0].type;

                if (existingType === LogisticsTypeEnum.SHIPMENT) {
                  this.logisticsTypeLabels = {
                    [LogisticsTypeEnum.LOCAL_PROCESSING]: 'Procesamiento Local',
                  };
                  this.logisticsTypes = [LogisticsTypeEnum.LOCAL_PROCESSING];
                } else {
                  this.logisticsTypeLabels = {
                    [LogisticsTypeEnum.SHIPMENT]: 'Envío Local',
                  };
                  this.logisticsTypes = [LogisticsTypeEnum.SHIPMENT];
                }

                this.cdr.detectChanges();
              },
              error: (error) => {
                console.error('Error fetching logistics:', error);
                this.alertService.showTranslatedAlert({ alertType: 'error' });
              },
            });

          this.unsubscribe.push(logisticsSub);
        },
        error: (error) => {
          console.error('Error fetching purchases:', error);
          this.alertService.showTranslatedAlert({ alertType: 'error' });
        },
      });

    this.unsubscribe.push(purchaseSub);
  }

  handleNewLogistics(): void {
    const currentUrl = this.router.url;

    if (currentUrl === '/logistics/form') {
      // If already on /logistics/form, reload the route (force component reset)
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate(['/logistics/form']);
      });
    } else {
      // Otherwise, navigate to /logistics/new
      this.router.navigate(['/logistics/form']);
    }
  }

  goBack(): void {
    this.location.back();
  }

  handlePersonnelLogisticsItems(items: ILogisticsItemModel[]) {
    this.personnelLogisticsItems = items;
  }

  handleInputLogisticsItems(items: ILogisticsItemModel[]) {
    this.inputLogisticsItems = items;
  }

  onDateChange(event: any): void {
    if (!event) return;

    this.logisticsModel.logisticsDate =
      this.dateUtils.convertLocalDateToUTC(event);
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
  }
}
