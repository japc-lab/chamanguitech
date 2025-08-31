import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Config } from 'datatables.net';
import { PERMISSION_ROUTES } from '../../../../constants/routes.constants';
import { Router } from '@angular/router';
import { AssetService } from '../../services/asset.service';
import {
  ICreateAssetModel,
  IReadAssetModel,
  IUpdateAssetModel,
} from '../../interfaces/asset.interface';
import { AlertService } from 'src/app/utils/alert.service';
import { DateUtilsService } from 'src/app/utils/date-utils.service';

@Component({
  selector: 'app-assets-listing',
  templateUrl: './assets-listing.component.html',
})
export class AssetsListingComponent implements OnInit, OnDestroy {
  PERMISSION_ROUTE = PERMISSION_ROUTES.SETTINGS.ASSETS;

  isLoading = false;

  private unsubscribe: Subscription[] = [];

  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  assetModel: ICreateAssetModel = {
    name: '',
    purchaseDate: new Date(),
    cost: 0,
    desiredLife: 0,
    paymentStatus: 'pending',
    paidAmount: 0,
    pendingAmount: 0,
    responsible: '',
    location: '',
    currentSituation: undefined,
    disposalDate: undefined,
    daysOfUse: 0,
  } as ICreateAssetModel;

  isEditing = false;
  editingAssetId: string | null = null;
  isActive: boolean = true;

  assets: IReadAssetModel[] = [];

  datatableConfig: Config = {
    serverSide: false,
    paging: true,
    pageLength: 10,
    data: [], // ✅ Ensure default is an empty array
    columns: [
      {
        title: 'Código',
        data: 'id',
        render: function (data) {
          return data ? data : '-';
        },
      },
      {
        title: 'Nombre',
        data: 'name',
        render: function (data) {
          return data ? data : '-';
        },
      },
      {
        title: 'Fecha de Compra',
        data: 'purchaseDate',
        render: (data) => {
          return this.dateUtilsService.formatISOToDateInput(data);
        },
      },
      {
        title: 'Costo',
        data: 'cost',
        render: function (data) {
          return data ? `$${data.toLocaleString()}` : '$0';
        },
      },
      {
        title: 'Estado de Pago',
        data: 'paymentStatus',
        render: function (data) {
          if (data === 'paid') {
            return `<span class="badge bg-success">Pagado</span>`;
          } else {
            return `<span class="badge bg-warning">Pendiente</span>`;
          }
        },
      },
      {
        title: 'Monto Pendiente',
        data: 'pendingAmount',
        render: function (data) {
          return data ? `$${data.toLocaleString()}` : '$0';
        },
      },
      {
        title: 'Responsable',
        data: 'responsible',
        render: function (data) {
          return data ? data : '-';
        },
      },
      {
        title: 'Situación Actual',
        data: 'currentSituation',
        render: function (data) {
          if (data === 'good') {
            return `<span class="badge bg-success">Bueno</span>`;
          } else if (data === 'bad') {
            return `<span class="badge bg-danger">Malo</span>`;
          } else {
            return `<span class="badge bg-warning">Regular</span>`;
          }
        },
      },
    ],
    language: {
      url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json',
    },
  };

  constructor(
    private assetService: AssetService,
    private alertService: AlertService,
    private dateUtilsService: DateUtilsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAssets();
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
        this.alertService.showTranslatedAlert({ alertType: 'error' });
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
        this.alertService.showTranslatedAlert({ alertType: 'error' });
      },
    });
    this.unsubscribe.push(deleteSub);
  }

  edit(id: string) {
    const asset = this.assets.find((a) => a.id === id);
    if (asset) {
      this.assetModel = {
        name: asset.name,
        purchaseDate: asset.purchaseDate,
        cost: asset.cost,
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
      name: '',
      purchaseDate: new Date(),
      cost: 0,
      desiredLife: 0,
      paymentStatus: 'pending',
      paidAmount: 0,
      pendingAmount: 0,
      responsible: '',
      location: '',
      currentSituation: undefined,
      disposalDate: undefined,
      daysOfUse: 0,
    };
    this.isEditing = false;
    this.editingAssetId = null;
    this.isActive = true; // New assets are active by default
  }

  onSubmit(event: Event, myForm: NgForm) {
    if (myForm.invalid) {
      return;
    }

        // Validate that paid amount doesn't exceed cost
    if ((this.assetModel.paidAmount || 0) > (this.assetModel.cost || 0)) {
      this.alertService.showTranslatedAlert({
        alertType: 'error',
        messageKey: 'ERROR.ASSET_PAID_AMOUNT_EXCEEDED'
      });
      return;
    }

    this.isLoading = true;

    // Auto assign payment status based on paid amount vs cost
    const autoPaymentStatus = (this.assetModel.paidAmount || 0) >= (this.assetModel.cost || 0) ? 'paid' : 'pending';

    if (this.isEditing && this.editingAssetId) {
      // Update existing asset
      const updatePayload: IUpdateAssetModel = {
        id: this.editingAssetId,
        name: this.assetModel.name,
        purchaseDate: this.assetModel.purchaseDate,
        cost: this.assetModel.cost,
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

      this.assetService
        .updateAsset(this.editingAssetId, updatePayload)
        .subscribe({
          next: () => {
            this.alertService.showTranslatedAlert({ alertType: 'success' });
            this.loadAssets();
            this.isEditing = false;
            this.editingAssetId = null;
          },
          error: (error: any) => {
            this.alertService.showTranslatedAlert({ alertType: 'error' });
            this.isLoading = false;
          },
          complete: () => {
            this.isLoading = false;
          },
        });
    } else {
      // Create new asset
      const assetPayload: ICreateAssetModel = {
        name: this.assetModel.name,
        purchaseDate: this.assetModel.purchaseDate,
        cost: this.assetModel.cost,
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

      this.assetService.createAsset(assetPayload as any).subscribe({
        next: () => {
          this.alertService.showTranslatedAlert({ alertType: 'success' });
          this.loadAssets();
        },
        error: (error: any) => {
          this.alertService.showTranslatedAlert({ alertType: 'error' });
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        },
      });
    }
  }

  calculatePendingAmount(): void {
    this.assetModel.pendingAmount =
      (this.assetModel.cost || 0) - (this.assetModel.paidAmount || 0);
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

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
    this.reloadEvent.unsubscribe();
  }
}
