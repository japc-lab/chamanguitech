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
import { SweetAlertOptions } from 'sweetalert2';
import { Config } from 'datatables.net';
import { BrokerService } from '../../services/broker.service';
import { AuthService } from '../../../auth';
import { PERMISSION_ROUTES } from '../../../../constants/routes.constants';
import {
  ICreateBrokerModel,
  IReadBrokerModel,
} from '../../interfaces/broker.interface';
import { Router } from '@angular/router';
import { IPersonModel } from 'src/app/modules/shared/interfaces/person.interface';
import { IReadUserModel } from 'src/app/modules/settings/interfaces/user.interface';
import { UserService } from 'src/app/modules/settings/services/user.service';
import { AlertService } from 'src/app/utils/alert.service';
import { DateUtilsService } from 'src/app/utils/date-utils.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-broker-listing',
  templateUrl: './broker-listing.component.html',
  styleUrls: ['./broker-listing.component.scss'],
})
export class BrokerListingComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  PERMISSION_ROUTE = PERMISSION_ROUTES.PERSONAL_PROFILE.BROKERS;

  isLoading = false;
  isOnlyBuyer = false;

  buyers: IReadUserModel[];
  selectedBuyer: IReadUserModel[];

  private unsubscribe: Subscription[] = [];

  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  createBrokerModel: ICreateBrokerModel = {
    person: {} as IPersonModel,
  } as ICreateBrokerModel;

  brokers: IReadBrokerModel[] = [];

  datatableConfig: Config = {
    serverSide: false,
    paging: true,
    pageLength: 10,
    data: [], // ✅ Ensure default is an empty array
    columns: [
      {
        title: '',
        data: 'person.names',
        render: function (data, type, full) {
          const colorClasses = ['success', 'info', 'warning', 'danger'];
          const randomColorClass =
            colorClasses[Math.floor(Math.random() * colorClasses.length)];
          const initials =
            data && data.length > 0 ? data[0].toUpperCase() : '?';
          const symbolLabel = `
          <div class="symbol-label fs-3 bg-light-${randomColorClass} text-${randomColorClass}">
            ${initials}
          </div>
        `;

          const nameAndEmail = `
              <div class="d-flex flex-column" data-action="view" data-id="${
                full.id
              }">
                <a href="javascript:;" class="text-gray-800 text-hover-primary mb-1">${
                  data || 'Sin nombre'
                } ${full.person?.lastNames || ''}</a>
                <span>${full.person?.email || 'Sin correo'}</span>
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
        data: 'person.identification',
        render: function (data) {
          return data ? data : '-';
        },
      },
      {
        title: '',
        data: 'person.mobilePhone',
        render: function (data) {
          return data ? data : '-';
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
      // {
      //   title: 'Comprador',
      //   data: 'buyerItBelongs.fullName',
      //   render: function (data) {
      //     return data ? data : '-';
      //   },
      // },
    ],
    language: {
      url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json',
    },
    createdRow: function (row, data, dataIndex) {
      $('td:eq(0)', row).addClass('d-flex align-items-center');
    },
  };

  constructor(
    private brokerService: BrokerService,
    private authService: AuthService,
    private userService: UserService,
    private alertService: AlertService,
    private dateUtils: DateUtilsService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private translateService: TranslateService
  ) {}

  ngAfterViewInit(): void {}

  ngOnInit(): void {
    this.initializeDatatableConfig();
    this.isOnlyBuyer = this.authService.isOnlyBuyer;

    // Agregar la columna "Comprador" solo si el usuario no es solo Comprador
    if (!this.isOnlyBuyer) {
      this.PERMISSION_ROUTE = PERMISSION_ROUTES.SETTINGS.PEOPLE;
      this.datatableConfig.columns!.push({
        title: this.translateService.instant('LISTING.TABLE_COLUMNS.BUYER'),
        data: 'buyerItBelongs.fullName',
        render: function (data) {
          return data ? data : '-';
        },
      });

      this.loadBuyers();
    }

    this.loadBrokers();
  }

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
      // Update the buyer column if it exists (non-buyer only)
      if (this.datatableConfig.columns.length > 4) {
        this.datatableConfig.columns[4].title = this.translateService.instant(
          'LISTING.TABLE_COLUMNS.BUYER'
        );
      }
    }
  }

  loadBuyers() {
    const userSub = this.userService.getAllUsers(true, 'Comprador').subscribe({
      next: (users: IReadUserModel[]) => {
        this.buyers = users;
      },
      error: (error) => {
        console.error('Error fetching users:', error);
      },
    });
    this.unsubscribe.push(userSub);
  }

  loadBrokers(): void {
    const userId = this.authService.currentUserValue?.id;
    if (!userId) return;

    const brokerObservable = !this.isOnlyBuyer
      ? this.brokerService.getAllBrokers(true)
      : this.brokerService.getBrokersByUser(userId!);

    const brokerSub = brokerObservable.subscribe({
      next: (data) => {
        this.brokers = data;
        this.datatableConfig = {
          ...this.datatableConfig,
          data: [...this.brokers],
        };

        this.cdr.detectChanges();
        this.reloadEvent.emit(true);
      },
      error: () => {
        this.alertService.showTranslatedAlert({ alertType: 'error' });
      },
    });

    this.unsubscribe.push(brokerSub);
  }

  delete(id: string): void {
    const deleteSub = this.brokerService.deleteBroker(id).subscribe({
      next: () => {
        this.alertService.showTranslatedAlert({ alertType: 'success' });
        this.loadBrokers(); // Reload data from server
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
    this.createBrokerModel = {
      person: {} as IPersonModel, // Ensure person object is initialized
    } as ICreateBrokerModel;
  }

  onSubmit(event: Event, myForm: NgForm) {
    if (myForm && myForm.invalid) {
      return;
    }

    this.isLoading = true;

    if (this.isOnlyBuyer) {
      this.createBrokerModel.buyerItBelongs =
        this.authService.currentUserValue!.id;
    } else {
      this.createBrokerModel.buyerItBelongs = this.selectedBuyer[0].id;
    }

    const convertedDate = this.dateUtils.convertLocalDateToUTC(
      this.createBrokerModel.person.birthDate!
    );
    this.createBrokerModel.person.birthDate =
      convertedDate === '' ? null : convertedDate;

    const completeFn = () => {
      this.isLoading = false;
      this.selectedBuyer = [];
    };

    const createFn = () => {
      this.brokerService.createBroker(this.createBrokerModel).subscribe({
        next: () => {
          this.alertService.showTranslatedAlert({ alertType: 'success' });
          this.loadBrokers();
        },
        error: (error) => {
          this.alertService.showTranslatedAlert({ alertType: 'error' });
          this.isLoading = false;
        },
        complete: completeFn,
      });
    };

    createFn();
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
    this.reloadEvent.unsubscribe();
  }
}
