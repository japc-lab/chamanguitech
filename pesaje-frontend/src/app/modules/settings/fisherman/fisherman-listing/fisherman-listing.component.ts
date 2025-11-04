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
import { FishermanService } from '../../services/fisherman.service';
import {
  ICreateFishermanModel,
  IReadFishermanModel,
} from '../../interfaces/fisherman.interface';
import { AlertService } from 'src/app/utils/alert.service';
import { DateUtilsService } from 'src/app/utils/date-utils.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-fisherman-listing',
  templateUrl: './fisherman-listing.component.html',
})
export class FishermanListingComponent implements OnInit, AfterViewInit, OnDestroy {
  PERMISSION_ROUTE = PERMISSION_ROUTES.SETTINGS.PEOPLE;

  isLoading = false;

  private unsubscribe: Subscription[] = [];

  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  fishermanModel: ICreateFishermanModel = {
    person: {} as IPersonModel,
  } as ICreateFishermanModel;

  fishermen: IReadFishermanModel[] = [];

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
    private fishermanService: FishermanService,
    private alertService: AlertService,
    private dateUtils: DateUtilsService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.initializeDatatableConfig();
    this.loadFishermen();
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
        'LISTING.TABLE_COLUMNS.PHONE'
      );
      this.datatableConfig.columns[3].title = this.translateService.instant(
        'LISTING.TABLE_COLUMNS.STATUS'
      );
    }
  }


  loadFishermen(): void {
    const fishermanObservable = this.fishermanService.getAll(true);

    const fishermanSub = fishermanObservable.subscribe({
      next: (data) => {
        this.fishermen = data;
        this.datatableConfig = {
          ...this.datatableConfig,
          data: [...this.fishermen],
        };

        this.cdr.detectChanges();
        this.reloadEvent.emit(true);
      },
      error: () => {
        this.alertService.showTranslatedAlert({ alertType: 'error' });
      },
    });

    this.unsubscribe.push(fishermanSub);
  }

  delete(id: string): void {
    const deleteSub = this.fishermanService.delete(id).subscribe({
      next: () => {
        this.loadFishermen();
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
    this.fishermanModel = { person: {} as IPersonModel };
  }

  onSubmit(event: Event, myForm: NgForm) {
    if (myForm.invalid) {
      return;
    }

    this.isLoading = true;

    const fishermanPayload: ICreateFishermanModel = {
      person: this.fishermanModel.person!,
    };

    this.fishermanService.create(fishermanPayload as any).subscribe({
      next: () => {
        this.alertService.showTranslatedAlert({ alertType: 'success' });
        this.loadFishermen();
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
