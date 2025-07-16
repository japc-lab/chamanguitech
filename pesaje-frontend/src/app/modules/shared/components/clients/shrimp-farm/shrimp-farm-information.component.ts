import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { SwalComponent } from '@sweetalert2/ngx-sweetalert2';
import { Subscription } from 'rxjs';
import { SweetAlertOptions } from 'sweetalert2';
import { Config } from 'datatables.net';
import { PERMISSION_ROUTES } from 'src/app/constants/routes.constants';
import { ActivatedRoute } from '@angular/router';
import {
  IUpdateShrimpFarmModel,
  IReadShrimpFarmModel,
  ICreateShrimpFarmModel,
  TransportationMethodEnum,
} from '../../../interfaces/shrimp-farm.interface';
import { ShrimpFarmService } from '../../../services/shrimp-farm.service';
import { AuthService } from 'src/app/modules/auth';
import { IReadUserModel } from 'src/app/modules/settings/interfaces/user.interface';
import { AlertService } from 'src/app/utils/alert.service';

@Component({
  selector: 'app-shrimp-farm-information',
  templateUrl: './shrimp-farm-information.component.html',
})
export class ShrimpFarmInformationComponent
  implements OnInit, AfterViewInit, OnChanges, OnDestroy
{
  PERMISSION_ROUTE = PERMISSION_ROUTES.CLIENTS;

  isLoading = false;
  private unsubscribe: Subscription[] = [];

  shrimpFarmData: IReadShrimpFarmModel[] = [];
  shrimpFarmInfo: IReadShrimpFarmModel = {} as IReadShrimpFarmModel;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  transportationMethods = Object.values(TransportationMethodEnum);

  buyers: IReadUserModel[];
  selectedBuyer: IReadUserModel[];
  isOnlyBuyer = false;

  @Input() clientId: string;
  @Input() buyersClientBelongs: IReadUserModel[];

  datatableConfig: Config = {
    serverSide: false,
    paging: true,
    pageLength: 10,
    data: [], // ✅ Ensure default is an empty array
    columns: [
      {
        title: 'ID',
        data: 'id',
        visible: false,
      },
      {
        title: 'Nombre de la Piscina',
        data: 'identifier',
        render: (data) => `${data}`,
      },
      {
        title: 'Hectareas',
        data: 'numberHectares',
        render: (data) => `${data}`,
      },
      {
        title: 'Lugar',
        data: 'place',
        render: (data) => `${data}`,
      },
      {
        title: 'Metodo de Transporte',
        data: 'transportationMethod',
        render: (data, type, row) =>
          this.getTranslatedTransportationMethod(data).toUpperCase(),
      },
    ],
    language: {
      url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json',
    },
  };

  constructor(
    private authService: AuthService,
    private shrimpFarmService: ShrimpFarmService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isOnlyBuyer = this.authService.isOnlyBuyer;

    // If personId is not provided as an input, get it from route resolver
    if (!this.clientId) {
      this.route.data.subscribe((data) => {
        this.clientId = data['personId'];
        if (this.clientId) {
          this.loadShrimpFarmInfos();
        }
      });
    } else {
      this.loadShrimpFarmInfos(); // ✅ Load if personId is provided as input
    }

    if (!this.isOnlyBuyer) {
      this.PERMISSION_ROUTE = PERMISSION_ROUTES.SETTINGS.CLIENTS;
    }
  }

  ngAfterViewInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['personId'] && changes['personId'].currentValue) {
      this.loadShrimpFarmInfos(); // Reload when personId changes
    }
  }

  // 🔹 Load Shrimp Farm Info List for Person
  loadShrimpFarmInfos(): void {
    if (!this.clientId) return;

    let userId: string | undefined = undefined;
    if (this.isOnlyBuyer) {
      userId = this.authService.currentUserValue!.id;
    }

    const paymentSub = this.shrimpFarmService
      .getFarmsByClientAndBuyer(this.clientId, userId)
      .subscribe({
        next: (data) => {
          this.shrimpFarmData = data;
          this.datatableConfig = {
            ...this.datatableConfig,
            data: [...this.shrimpFarmData],
          };

          this.cdr.detectChanges();
          this.reloadEvent.emit(true);
        },
        error: () => {
          this.alertService.showTranslatedAlert({ alertType: 'error' });
        },
      });
    this.unsubscribe.push(paymentSub);
  }

  // 🔹 Delete a Shrimp Farm Info
  delete(id: string): void {
    const deleteSub = this.shrimpFarmService.deleteShrimpFarm(id).subscribe({
      next: () => {
        this.shrimpFarmData = this.shrimpFarmData.filter(
          (item) => item.id !== id
        );
        this.reloadEvent.emit(true);
      },
      error: () => {
        this.alertService.showTranslatedAlert({ alertType: 'error' });
      },
    });
    this.unsubscribe.push(deleteSub);
  }

  // 🔹 Edit Shrimp Farm Info
  edit(shrimpFarmId: string): void {
    const foundItem = this.shrimpFarmData.find(
      (item) => item.id === shrimpFarmId
    );
    this.shrimpFarmInfo = foundItem
      ? { ...foundItem }
      : ({} as IReadShrimpFarmModel);

    this.selectedBuyer = this.buyersClientBelongs.filter(
      (buyer) => buyer.id === foundItem?.buyerItBelongs
    );
  }

  // 🔹 Create a new Shrimp Farm Info
  create(): void {
    this.shrimpFarmInfo = {} as IReadShrimpFarmModel;
  }

  // 🔹 Handle Form Submission
  onSubmit(event: Event, myForm: NgForm): void {
    if (myForm && myForm.invalid) {
      return;
    }

    if (!this.clientId) return;

    this.shrimpFarmInfo.client = this.clientId;

    this.isLoading = true;

    if (this.isOnlyBuyer) {
      this.shrimpFarmInfo.buyerItBelongs =
        this.authService.currentUserValue!.id;
    } else {
      this.shrimpFarmInfo.buyerItBelongs = this.selectedBuyer[0].id;
    }

    const successAlert: SweetAlertOptions = {
      icon: 'success',
      title: '¡Éxito!',
      text: this.shrimpFarmInfo.id
        ? 'Información de camaronera actualizada correctamente.'
        : 'Información de camaronera creada correctamente.',
    };

    const errorAlert: SweetAlertOptions = {
      icon: 'error',
      title: 'Error',
      text: '',
    };

    const completeFn = () => {
      this.isLoading = false;
    };

    const updateFn = () => {
      const updatePayload: IUpdateShrimpFarmModel = { ...this.shrimpFarmInfo };

      this.shrimpFarmService
        .updateShrimpFarm(this.shrimpFarmInfo.id, updatePayload)
        .subscribe({
          next: (updatedInfo) => {
            const index = this.shrimpFarmData.findIndex(
              (item) => item.id === updatedInfo.id
            );

            if (index > -1) this.shrimpFarmData[index] = { ...updatedInfo };

            this.alertService.showTranslatedAlert({ alertType: 'success' });

            this.datatableConfig = {
              ...this.datatableConfig,
              data: [...this.shrimpFarmData],
            };

            this.cdr.detectChanges();
            this.reloadEvent.emit(true);
          },
          error: (error) => {
            errorAlert.text = 'No se pudo actualizar la camaronera.';
            this.alertService.showTranslatedAlert({ alertType: 'error' });
            this.isLoading = false;
          },
          complete: completeFn,
        });
    };

    const createFn = () => {
      const createPayload: ICreateShrimpFarmModel = { ...this.shrimpFarmInfo };
      this.shrimpFarmService.createShrimpFarm(createPayload).subscribe({
        next: () => {
          this.alertService.showTranslatedAlert({ alertType: 'success' });
          this.loadShrimpFarmInfos();
        },
        error: (error) => {
          errorAlert.text = 'No se pudo crear la camaronera.';
          this.alertService.showTranslatedAlert({ alertType: 'error' });
          this.isLoading = false;
        },
        complete: completeFn,
      });
    };

    if (this.shrimpFarmInfo.id) {
      updateFn();
    } else {
      createFn();
    }
  }

  getTranslatedTransportationMethod(method: TransportationMethodEnum): string {
    const translations: { [key in TransportationMethodEnum]: string } = {
      [TransportationMethodEnum.CAR]: 'Carro',
      [TransportationMethodEnum.CARBOAT]: 'Carro y Bote',
    };
    return translations[method] || method;
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
  }
}
