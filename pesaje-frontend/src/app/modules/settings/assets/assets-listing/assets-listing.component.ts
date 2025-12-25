import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Config } from 'datatables.net';
import { SwalComponent } from '@sweetalert2/ngx-sweetalert2';
import { SweetAlertOptions } from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { PERMISSION_ROUTES } from '../../../../constants/routes.constants';
import { Router } from '@angular/router';
import { AssetService } from '../../services/asset.service';
import {
  ICreateAssetModel,
  IReadAssetModel,
  IUpdateAssetModel,
} from '../../interfaces/asset.interface';
import { DateUtilsService } from 'src/app/utils/date-utils.service';

@Component({
    selector: 'app-assets-listing',
    templateUrl: './assets-listing.component.html',
    standalone: false
})
export class AssetsListingComponent implements OnInit, OnDestroy {
  PERMISSION_ROUTE = PERMISSION_ROUTES.SETTINGS.ASSETS;

  isLoading = false;

  private unsubscribe: Subscription[] = [];

  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  @ViewChild('noticeSwal') noticeSwal!: SwalComponent;
  swalOptions: SweetAlertOptions = {};

  assetModel: ICreateAssetModel = {
    code: undefined,
    name: undefined,
    purchaseDate: new Date(),
    unitCost: undefined,
    units: undefined,
    totalCost: undefined,
    desiredLife: undefined,
    paymentStatus: 'pending',
    paidAmount: undefined,
    pendingAmount: undefined,
    responsible: undefined,
    location: undefined,
    currentSituation: undefined,
    disposalDate: undefined,
    daysOfUse: undefined,
  } as ICreateAssetModel;

  isEditing = false;
  editingAssetId: string | null = null;
  isActive: boolean = true;

  assets: IReadAssetModel[] = [];

  datatableConfig: Config = {} as Config;

  constructor(
    private assetService: AssetService,
    private dateUtilsService: DateUtilsService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.initializeDatatableConfig();

    // Subscribe to language changes and reinitialize datatable config with new translations
    const langSub = this.translate.onLangChange.subscribe(() => {
      this.initializeDatatableConfig();
      this.cdr.detectChanges();
    });
    this.unsubscribe.push(langSub);

    this.loadAssets();
  }

  // 🔹 Initialize DataTable Configuration with Translations
  initializeDatatableConfig(): void {
    // Preserve existing data when reinitializing (e.g., during language change)
    const currentData = this.datatableConfig?.data || [];

    this.datatableConfig = {
      serverSide: false,
      paging: true,
      pageLength: 10,
      data: currentData,
      columns: [
        {
          title: this.translate.instant('SETTINGS.ASSETS.TABLE.CODE'),
          data: 'code',
          render: function (data) {
            return data ? data : '-';
          },
        },
        {
          title: this.translate.instant('SETTINGS.ASSETS.TABLE.NAME'),
          data: 'name',
          render: function (data) {
            return data ? data : '-';
          },
        },
        {
          title: this.translate.instant('SETTINGS.ASSETS.TABLE.PURCHASE_DATE'),
          data: 'purchaseDate',
          render: (data) => {
            return this.dateUtilsService.formatISOToDateInput(data);
          },
        },
        {
          title: this.translate.instant('SETTINGS.ASSETS.TABLE.UNIT_COST'),
          data: 'unitCost',
          render: function (data) {
            return data ? `$${data.toLocaleString()}` : '$0';
          },
        },
        {
          title: this.translate.instant('SETTINGS.ASSETS.TABLE.UNITS'),
          data: 'units',
          render: function (data) {
            return data ? data.toLocaleString() : '0';
          },
        },
        {
          title: this.translate.instant('SETTINGS.ASSETS.TABLE.TOTAL_COST'),
          data: 'totalCost',
          render: function (data) {
            return data ? `$${data.toLocaleString()}` : '$0';
          },
        },
        {
          title: this.translate.instant('SETTINGS.ASSETS.TABLE.PAYMENT_STATUS'),
          data: 'paymentStatus',
          render: (data) => {
            if (data === 'paid') {
              return `<span class="badge bg-success">${this.translate.instant('SETTINGS.ASSETS.STATUS.PAID')}</span>`;
            } else {
              return `<span class="badge bg-warning">${this.translate.instant('SETTINGS.ASSETS.STATUS.PENDING')}</span>`;
            }
          },
        },
        {
          title: this.translate.instant('SETTINGS.ASSETS.TABLE.PENDING_AMOUNT'),
          data: 'pendingAmount',
          render: function (data) {
            return data ? `$${data.toLocaleString()}` : '$0';
          },
        },
        {
          title: this.translate.instant('SETTINGS.ASSETS.TABLE.RESPONSIBLE'),
          data: 'responsible',
          render: function (data) {
            return data ? data : '-';
          },
        },
        {
          title: this.translate.instant('SETTINGS.ASSETS.TABLE.CURRENT_SITUATION'),
          data: 'currentSituation',
          render: (data) => {
            if (data === 'good') {
              return `<span class="badge bg-success">${this.translate.instant('SETTINGS.ASSETS.SITUATION.GOOD')}</span>`;
            } else if (data === 'bad') {
              return `<span class="badge bg-danger">${this.translate.instant('SETTINGS.ASSETS.SITUATION.BAD')}</span>`;
            } else {
              return `<span class="badge bg-warning">${this.translate.instant('SETTINGS.ASSETS.SITUATION.FAIR')}</span>`;
            }
          },
        },
      ],
      language: {
        url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json',
      },
    };
  }

  loadAssets(): void {
    const assetObservable = this.assetService.getAllAssets(true);

    const assetSub = assetObservable.subscribe({
      next: (data: IReadAssetModel[]) => {
        this.assets = data;
        this.datatableConfig = {
          ...this.datatableConfig,
          data: [...this.assets],
        };

        this.cdr.detectChanges();
        this.reloadEvent.emit(true);
      },
      error: () => {
        this.showAlert({
          icon: 'error',
          title: this.translate.instant('ERROR.TITLE'),
          text: this.translate.instant('SETTINGS.ASSETS.MESSAGES.LOAD_ERROR'),
        });
      },
    });

    this.unsubscribe.push(assetSub);
  }

  delete(id: string): void {
    const deleteSub = this.assetService.deleteAsset(id).subscribe({
      next: () => {
        this.loadAssets();
      },
      error: () => {
        this.showAlert({
          icon: 'error',
          title: this.translate.instant('ERROR.TITLE'),
          text: this.translate.instant('SETTINGS.ASSETS.MESSAGES.DELETE_ERROR'),
        });
      },
    });
    this.unsubscribe.push(deleteSub);
  }

  edit(id: string) {
    const asset = this.assets.find((a) => a.id === id);
    if (asset) {
      this.assetModel = {
        code: asset.code,
        name: asset.name,
        purchaseDate: asset.purchaseDate,
        unitCost: asset.unitCost,
        units: asset.units,
        totalCost: asset.totalCost,
        desiredLife: asset.desiredLife,
        paymentStatus: asset.paymentStatus,
        paidAmount: asset.paidAmount,
        pendingAmount: asset.pendingAmount,
        responsible: asset.responsible,
        location: asset.location,
        currentSituation: asset.currentSituation,
        disposalDate: asset.disposalDate,
        daysOfUse: asset.daysOfUse,
      };
      this.isEditing = true;
      this.editingAssetId = id;
      // If deletedAt is null or undefined, asset is active
      // If deletedAt has a date, asset is inactive
      this.isActive = Boolean(!asset.deletedAt);
    }
  }

  create() {
    this.assetModel = {
      code: undefined,
      name: undefined,
      purchaseDate: new Date(),
      unitCost: undefined,
      units: undefined,
      totalCost: undefined,
      desiredLife: undefined,
      paymentStatus: 'pending',
      paidAmount: undefined,
      pendingAmount: undefined,
      responsible: undefined,
      location: undefined,
      currentSituation: undefined,
      disposalDate: undefined,
      daysOfUse: undefined,
    };
    this.isEditing = false;
    this.editingAssetId = null;
    this.isActive = true; // New assets are active by default
  }

  onSubmit(event: Event, myForm: NgForm) {
    if (myForm.invalid) {
      return;
    }

    // Auto-calculate totalCost from unitCost and units
    if (this.assetModel.unitCost && this.assetModel.units) {
      this.assetModel.totalCost = this.assetModel.unitCost * this.assetModel.units;
    }

    // Validate that paid amount doesn't exceed totalCost
    if ((this.assetModel.paidAmount || 0) > (this.assetModel.totalCost || 0)) {
      this.showAlert({
        icon: 'error',
        title: this.translate.instant('ERROR.TITLE'),
        text: this.translate.instant('ERROR.ASSET_PAID_AMOUNT_EXCEEDED'),
      });
      return;
    }

    this.isLoading = true;

    // Auto assign payment status based on paid amount vs totalCost
    const autoPaymentStatus =
      (this.assetModel.paidAmount || 0) >= (this.assetModel.totalCost || 0)
        ? 'paid'
        : 'pending';

    const successAlert: SweetAlertOptions = {
      icon: 'success',
      title: this.translate.instant('SUCCESS.TITLE'),
      text: this.isEditing
        ? this.translate.instant('SETTINGS.ASSETS.MESSAGES.UPDATE_SUCCESS')
        : this.translate.instant('SETTINGS.ASSETS.MESSAGES.CREATE_SUCCESS'),
    };

    const errorAlert: SweetAlertOptions = {
      icon: 'error',
      title: this.translate.instant('ERROR.TITLE'),
      text: '',
    };

    const completeFn = () => {
      this.isLoading = false;
    };

    if (this.isEditing && this.editingAssetId) {
      // Update existing asset - build payload with all fields first
      const fullUpdatePayload = {
        id: this.editingAssetId,
        code: this.assetModel.code,
        name: this.assetModel.name,
        purchaseDate: this.assetModel.purchaseDate,
        unitCost: this.assetModel.unitCost,
        units: this.assetModel.units,
        totalCost: this.assetModel.totalCost,
        desiredLife: this.assetModel.desiredLife,
        paymentStatus: autoPaymentStatus,
        paidAmount: this.assetModel.paidAmount,
        pendingAmount: this.assetModel.pendingAmount,
        responsible: this.assetModel.responsible,
        location: this.assetModel.location,
        currentSituation: this.assetModel.currentSituation,
        disposalDate: this.assetModel.disposalDate,
        daysOfUse: this.assetModel.daysOfUse,
        deletedAt: this.isActive ? null : new Date(),
      };

      // Remove empty values but keep id and deletedAt
      const updatePayload = this.removeEmptyValues(fullUpdatePayload) as IUpdateAssetModel;
      updatePayload.id = this.editingAssetId; // Always include id
      updatePayload.deletedAt = this.isActive ? null : new Date(); // Always include deletedAt

      this.assetService
        .updateAsset(this.editingAssetId, updatePayload)
        .subscribe({
          next: () => {
            this.showAlert(successAlert);
            this.loadAssets();
            this.isEditing = false;
            this.editingAssetId = null;
          },
          error: (error: any) => {
            errorAlert.text = this.translate.instant(
              'SETTINGS.ASSETS.MESSAGES.UPDATE_ERROR'
            );
            this.showAlert(errorAlert);
            this.isLoading = false;
          },
          complete: completeFn,
        });
    } else {
      // Create new asset - build payload with all fields first
      const fullCreatePayload = {
        code: this.assetModel.code,
        name: this.assetModel.name,
        purchaseDate: this.assetModel.purchaseDate,
        unitCost: this.assetModel.unitCost,
        units: this.assetModel.units,
        totalCost: this.assetModel.totalCost,
        desiredLife: this.assetModel.desiredLife,
        paymentStatus: autoPaymentStatus,
        paidAmount: this.assetModel.paidAmount,
        pendingAmount: this.assetModel.pendingAmount,
        responsible: this.assetModel.responsible,
        location: this.assetModel.location,
        currentSituation: this.assetModel.currentSituation,
        disposalDate: this.assetModel.disposalDate,
        daysOfUse: this.assetModel.daysOfUse,
      };

      // Remove empty values
      const assetPayload = this.removeEmptyValues(fullCreatePayload) as ICreateAssetModel;

      this.assetService.createAsset(assetPayload as any).subscribe({
        next: () => {
          this.showAlert(successAlert);
          this.loadAssets();
        },
        error: (error: any) => {
          errorAlert.text = this.translate.instant(
            'SETTINGS.ASSETS.MESSAGES.CREATE_ERROR'
          );
          this.showAlert(errorAlert);
          this.isLoading = false;
        },
        complete: completeFn,
      });
    }
  }

  /**
   * Calculate total cost from unit cost and units
   * Called when unitCost or units change
   */
  calculateTotalCost(): void {
    if (this.assetModel.unitCost && this.assetModel.units) {
      this.assetModel.totalCost = this.assetModel.unitCost * this.assetModel.units;
      // Also recalculate pending amount when total cost changes
      this.calculatePendingAmount();
    } else {
      this.assetModel.totalCost = 0;
      this.calculatePendingAmount();
    }
  }

  /**
   * Calculate pending amount from total cost and paid amount
   * Called when totalCost or paidAmount change
   */
  calculatePendingAmount(): void {
    this.assetModel.pendingAmount =
      (this.assetModel.totalCost || 0) - (this.assetModel.paidAmount || 0);
  }

  /**
   * Handle unit cost changes - recalculate dependent fields
   */
  onUnitCostChange(): void {
    this.calculateTotalCost();
  }

  /**
   * Handle units changes - recalculate dependent fields
   */
  onUnitsChange(): void {
    this.calculateTotalCost();
  }

  /**
   * Handle paid amount changes - recalculate pending amount
   */
  onPaidAmountChange(): void {
    this.calculatePendingAmount();
  }

  calculateDaysOfUse(): void {
    if (this.assetModel.disposalDate) {
      const disposalDate = new Date(this.assetModel.disposalDate);
      const purchaseDate = new Date(this.assetModel.purchaseDate!);
      this.assetModel.daysOfUse = Math.floor(
        (disposalDate.getTime() - purchaseDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
    }
  }

  /**
   * Helper function to remove empty, undefined, null values from an object
   * Keeps zero values for numbers as they might be valid
   */
  private removeEmptyValues(obj: any): any {
    const cleaned: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // Skip if value is null or undefined
      if (value === null || value === undefined) {
        continue;
      }

      // Skip empty strings
      if (typeof value === 'string' && value.trim() === '') {
        continue;
      }

      // Include all other values (including 0 for numbers, dates, etc.)
      cleaned[key] = value;
    }

    return cleaned;
  }

  // 🔹 Show SweetAlert Message
  showAlert(swalOptions: SweetAlertOptions): void {
    this.swalOptions = {
      buttonsStyling: false,
      confirmButtonText: this.translate.instant('BUTTONS.OK'),
      customClass: {
        confirmButton:
          'btn btn-' + (swalOptions.icon === 'error' ? 'danger' : 'primary'),
      },
      ...swalOptions,
    };
    this.cdr.detectChanges();
    this.noticeSwal.fire();
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
    this.reloadEvent.unsubscribe();
  }
}
