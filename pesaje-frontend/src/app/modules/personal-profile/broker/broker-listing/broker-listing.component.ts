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
        title: 'Nombre Completo',
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
        title: 'Identificación',
        data: 'person.identification',
        render: function (data) {
          return data ? data : '-';
        },
      },
      {
        title: 'Teléfono Celular',
        data: 'person.mobilePhone',
        render: function (data) {
          return data ? data : '-';
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
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {}

  ngOnInit(): void {
    this.isOnlyBuyer = this.authService.isOnlyBuyer;

    // Agregar la columna "Comprador" solo si el usuario no es solo Comprador
    if (!this.isOnlyBuyer) {
      this.PERMISSION_ROUTE = PERMISSION_ROUTES.SETTINGS.BROKERS;
      this.datatableConfig.columns!.push({
        title: 'Comprador',
        data: 'buyerItBelongs.fullName',
        render: function (data) {
          return data ? data : '-';
        },
      });

      this.loadBuyers();
    }

    this.loadBrokers();
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
        this.brokers = this.brokers.filter((item) => item.id !== id);
        this.reloadEvent.emit(true);
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
