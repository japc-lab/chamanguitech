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
import { IRoleModel } from 'src/app/modules/auth/interfaces/role.interface';
import { Router } from '@angular/router';
import { IPersonModel } from 'src/app/modules/shared/interfaces/person.interface';
import { UserService } from '../../services/user.service';
import {
  ICreateUserModel,
  IReadUserModel,
} from '../../interfaces/user.interface';
import { RoleService } from '../../../shared/services/role.service';
import { AlertService } from 'src/app/utils/alert.service';
import { DateUtilsService } from 'src/app/utils/date-utils.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-broker-listing',
  templateUrl: './users-listing.component.html',
})
export class UsersListingComponent implements OnInit, AfterViewInit, OnDestroy {
  PERMISSION_ROUTE = PERMISSION_ROUTES.SETTINGS.PEOPLE;

  isLoading = false;

  roles: IRoleModel[];

  private unsubscribe: Subscription[] = [];

  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  availableRoles: IRoleModel[] = [];
  selectedRoles: string[] = [];

  userModel: ICreateUserModel = {
    person: {} as IPersonModel,
    roles: [],
  } as ICreateUserModel;

  users: IReadUserModel[] = [];

  datatableConfig: Config = {
    serverSide: false,
    paging: true,
    pageLength: 10,
    data: [], // ✅ Ensure default is an empty array
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
        data: 'username',
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
      {
        title: '',
        data: 'roles',
        render: function (data: IRoleModel[]) {
          return data && data.length
            ? data.map((role) => role.name).join(', ')
            : '-';
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
    private userService: UserService,
    private alertService: AlertService,
    private dateUtils: DateUtilsService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private roleService: RoleService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.initializeDatatableConfig();
    this.loadUsers();
    this.loadRoles();
  }

  ngAfterViewInit(): void {}

  loadUsers(): void {
    const userObservable = this.userService.getAllUsers(true);

    const userSub = userObservable.subscribe({
      next: (data) => {
        this.users = data;
        this.datatableConfig = {
          ...this.datatableConfig,
          data: [...this.users],
        };

        this.cdr.detectChanges();
        this.reloadEvent.emit(true);
      },
      error: () => {
        this.alertService.showTranslatedAlert({ alertType: 'error' });
      },
    });

    this.unsubscribe.push(userSub);
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (roles) => {
        this.availableRoles = roles;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar roles', err);
      },
    });
  }

  onRoleChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const roleId = checkbox.value;
    if (checkbox.checked) {
      if (!this.selectedRoles.includes(roleId)) {
        this.selectedRoles.push(roleId);
      }
    } else {
      this.selectedRoles = this.selectedRoles.filter((r) => r !== roleId);
    }
  }

  delete(id: string): void {
    const deleteSub = this.userService.deleteUser(id).subscribe({
      next: () => {
        this.loadUsers();
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
    this.userModel = { person: {} as IPersonModel, roles: [] };
    this.selectedRoles = [];
  }

  onSubmit(event: Event, myForm: NgForm) {
    if (myForm.invalid) {
      return;
    }

    this.isLoading = true;

    const convertedDate = this.dateUtils.convertLocalDateToUTC(
      this.userModel.person?.birthDate!
    );
    this.userModel.person!.birthDate =
      convertedDate === '' ? null : convertedDate;

    const userPayload: ICreateUserModel = {
      username: this.userModel.username!,
      password: this.userModel.password!,
      roles: this.selectedRoles,
      person: this.userModel.person!,
    };

    const successAlert: SweetAlertOptions = {
      icon: 'success',
      title: '¡Éxito!',
      text: '¡Usuario creado exitosamente!',
    };

    const errorAlert: SweetAlertOptions = {
      icon: 'error',
      title: '¡Error!',
      text: 'No se pudo crear el usuario.',
    };

    this.userService.createUser(userPayload as any).subscribe({
      next: () => {
        this.alertService.showTranslatedAlert({ alertType: 'success' });
        this.loadUsers();
      },
      error: (error) => {
        errorAlert.text = 'No se pudo crear el usuario.';
        this.alertService.showTranslatedAlert({ alertType: 'error' });
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
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
        'LISTING.TABLE_COLUMNS.USERNAME'
      );
      this.datatableConfig.columns[2].title = this.translateService.instant(
        'LISTING.TABLE_COLUMNS.STATUS'
      );
      this.datatableConfig.columns[3].title = this.translateService.instant(
        'LISTING.TABLE_COLUMNS.ROLES'
      );
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
    this.reloadEvent.unsubscribe();
  }
}
