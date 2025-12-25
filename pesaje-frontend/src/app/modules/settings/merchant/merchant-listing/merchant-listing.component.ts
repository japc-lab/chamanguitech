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
import { IPersonModel } from 'src/app/modules/shared/interfaces/person.interface';
import { MerchantService } from '../../services/merchant.service';
import {
  ICreateMerchantModel,
  IReadMerchantModel,
} from '../../interfaces/merchant.interface';
import { AlertService } from 'src/app/utils/alert.service';
import { DateUtilsService } from 'src/app/utils/date-utils.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-merchant-listing',
    templateUrl: './merchant-listing.component.html',
    standalone: false
})
export class MerchantListingComponent implements OnInit, AfterViewInit, OnDestroy {
  PERMISSION_ROUTE = PERMISSION_ROUTES.SETTINGS.PEOPLE;

  isLoading = false;

  private unsubscribe: Subscription[] = [];

  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  merchantModel: ICreateMerchantModel = {
    person: {} as IPersonModel,
  } as ICreateMerchantModel;

  merchants: IReadMerchantModel[] = [];

  datatableConfig: Config = {
    serverSide: false,
    paging: true,
    pageLength: 10,
    data: [],
    columns: [
      {
        title: '',
        data: 'person',
        render: function (data, type, full) {
          const colorClasses = ['success', 'info', 'warning', 'danger'];
          const randomColorClass =
            colorClasses[Math.floor(Math.random() * colorClasses.length)];
          const initials =
            data && data.names.length > 0 && data.lastNames.length > 0
              ? `${data.names[0].toUpperCase()}${data.lastNames[0].toUpperCase()}`
              : '?';
          const symbolLabel = `
          <div class="symbol-label fs-3 bg-light-${randomColorClass} text-${randomColorClass}">
            ${initials}
          </div>
        `;

          const nameAndEmail = `
              <div class="d-flex flex-column" data-action="view" data-id="${
                full.id
              }">
                <div class="text-gray-800 text-hover-primary mb-1">${
                  data.names || 'Sin nombre'
                } ${data.lastNames || ''}</div>
                <span>${data.email || 'Sin correo'}</span>
              </div>
          `;

          return `
              <div class="symbol symbol-circle symbol-50px overflow-hidden me-3" data-action="view" data-id="${full.id}">
                <a href="javascript:;">
                  ${symbolLabel}
                </a>
              </div>
              ${nameAndEmail}
          `;
        },
      },
      {
        title: '',
        data: 'person',
        render: function (data) {
          return data.identification || '-';
        },
      },
      {
        title: '',
        data: 'person',
        render: function (data) {
          return data.mobilePhone || '-';
        },
      },
      {
        title: '',
        data: 'deletedAt',
        render: (data: any) => {
          if (data) {
            return `<span class="badge bg-warning">${this.translateService.instant('LISTING.STATUS_BADGES.INACTIVE')}</span>`;
          } else {
            return `<span class="badge bg-success">${this.translateService.instant('LISTING.STATUS_BADGES.ACTIVE')}</span>`;
          }
        },
      },
    ],
    language: {
      url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json',
    },
    createdRow: function (row, data, dataIndex) {
      $('td:eq(0)', row).addClass('d-flex align-items-center');
    },
  };

  constructor(
    private merchantService: MerchantService,
    private alertService: AlertService,
    private dateUtils: DateUtilsService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.initializeDatatableConfig();
    this.datatableConfig = {
          ...this.datatableConfig,
          data: [...this.merchants],
        };
    this.loadMerchants();
  }

  ngAfterViewInit(): void {}

  // 🔹 Initialize DataTable Configuration with Translations
  initializeDatatableConfig(): void {
    // Subscribe to language changes and reinitialize datatable config with new translations
    const langSub = this.translateService.onLangChange.subscribe(() => {
      this.updateDatatableColumnTitles();
      this.cdr.detectChanges();
    });
    this.unsubscribe.push(langSub);

    this.updateDatatableColumnTitles();
  }

  // 🔹 Update DataTable Column Titles with Current Language
  private updateDatatableColumnTitles(): void {
    if (this.datatableConfig.columns) {
      this.datatableConfig.columns[0].title = this.translateService.instant(
        'LISTING.TABLE_COLUMNS.FULL_NAME'
      );
      this.datatableConfig.columns[1].title = this.translateService.instant(
        'LISTING.TABLE_COLUMNS.IDENTIFICATION'
      );
      this.datatableConfig.columns[2].title = this.translateService.instant(
        'LISTING.TABLE_COLUMNS.MOBILE_PHONE'
      );
      this.datatableConfig.columns[3].title = this.translateService.instant(
        'LISTING.TABLE_COLUMNS.STATUS'
      );
    }
  }

  loadMerchants(): void {
    const merchantObservable = this.merchantService.getAllMerchants(true);

    const merchantSub = merchantObservable.subscribe({
      next: (data) => {
        this.merchants = data;
        this.datatableConfig = {
          ...this.datatableConfig,
          data: [...this.merchants],
        };

        this.cdr.detectChanges();
        this.reloadEvent.emit(true);
      },
      error: () => {
        this.alertService.showTranslatedAlert({ alertType: 'error' });
      },
    });

    this.unsubscribe.push(merchantSub);
  }

  delete(id: string): void {
    const deleteSub = this.merchantService.deleteMerchant(id).subscribe({
      next: () => {
        this.loadMerchants();
      },
      error: () => {
        this.alertService.showTranslatedAlert({ alertType: 'error' });
      },
    });
    this.unsubscribe.push(deleteSub);
  }

  edit(id: string) {
    const currentUrl = this.router.url;
    this.router.navigate([`${currentUrl}/${id}`]);
  }

  create() {
    this.merchantModel = { person: {} as IPersonModel };
  }

  onSubmit(event: Event, myForm: NgForm) {
    if (myForm.invalid) {
      return;
    }

    this.isLoading = true;

    const merchantPayload: ICreateMerchantModel = {
      person: this.merchantModel.person!,
      recommendedBy: this.merchantModel.recommendedBy,
      recommendedByPhone: this.merchantModel.recommendedByPhone,
      description: this.merchantModel.description,
    };

    this.merchantService.createMerchant(merchantPayload as any).subscribe({
      next: () => {
        this.alertService.showTranslatedAlert({ alertType: 'success' });
        this.loadMerchants();
      },
      error: (error) => {
        this.alertService.showTranslatedAlert({ alertType: 'error' });
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
    this.reloadEvent.unsubscribe();
  }
}
