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
import { SweetAlertOptions } from 'sweetalert2';
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

@Component({
  selector: 'app-assets-listing',
  templateUrl: './assets-listing.component.html',
})
export class AssetsListingComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  PERMISSION_ROUTE = PERMISSION_ROUTES.SETTINGS.ASSETS;

  isLoading = false;

  private unsubscribe: Subscription[] = [];

  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  assetModel: ICreateAssetModel = {
    name: '',
    quantity: 0,
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
        title: 'Nombre',
        data: 'name',
        render: function (data) {
          return data ? data : '-';
        },
      },
      {
        title: 'Cantidad',
        data: 'quantity',
        render: function (data) {
          return data ? data : '0';
        },
      },
      {
        title: 'Estado',
        data: 'deletedAt',
        render: function (data) {
          if (data) {
            return `<span class="badge bg-warning">Inactivo</span>`;
          } else {
            return `<span class="badge bg-success">Activo</span>`;
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
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAssets();
  }

  ngAfterViewInit(): void {}

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
        quantity: asset.quantity,
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
      quantity: 0,
    };
    this.isEditing = false;
    this.editingAssetId = null;
    this.isActive = true; // New assets are active by default
  }

  onSubmit(event: Event, myForm: NgForm) {
    if (myForm.invalid) {
      return;
    }

    this.isLoading = true;

    if (this.isEditing && this.editingAssetId) {
      // Update existing asset
      const updatePayload: IUpdateAssetModel = {
        id: this.editingAssetId,
        name: this.assetModel.name!,
        quantity: this.assetModel.quantity!,
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
        name: this.assetModel.name!,
        quantity: this.assetModel.quantity!,
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

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
    this.reloadEvent.unsubscribe();
  }
}
