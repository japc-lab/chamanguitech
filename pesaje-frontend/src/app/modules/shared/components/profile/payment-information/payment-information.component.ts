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
import { IPaymentInfoModel } from '../../../interfaces/payment-info.interface';
import { PaymentInfoService } from '../../../services/payment-info.service';
import { ActivatedRoute, ROUTES } from '@angular/router';

@Component({
  selector: 'app-payment-information',
  templateUrl: './payment-information.component.html',
})
export class PaymentInformationComponent
  implements OnInit, AfterViewInit, OnChanges, OnDestroy
{
  isLoading = false;
  private unsubscribe: Subscription[] = [];

  paymentData: IPaymentInfoModel[] = [];
  paymentInfo: IPaymentInfoModel = {} as IPaymentInfoModel;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  @Input() permissionRoute: string;
  @Input() personId?: string;
  @ViewChild('noticeSwal') noticeSwal!: SwalComponent;
  swalOptions: SweetAlertOptions = {};

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
        title: '# Cuenta',
        data: 'accountNumber',
        render: (data, type, full) =>
          `${full?.bankName} - ${data?.toUpperCase()}`,
      },
      {
        title: 'Nombre',
        data: 'accountName',
        render: (data) => `${data?.toUpperCase()}`,
      },
      {
        title: 'Identificación',
        data: 'identification',
        render: (data) => `${data?.toUpperCase()}`,
      },
    ],
    language: {
      url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json',
    },
  };

  constructor(
    private paymentInfoService: PaymentInfoService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.permissionRoute) {
      this.permissionRoute = PERMISSION_ROUTES.PERSONAL_PROFILE.MY_PROFILE;
    }

    // If personId is not provided as an input, get it from route resolver
    if (!this.personId) {
      this.route.data.subscribe((data) => {
        this.personId = data['personId'];
        if (this.personId) {
          this.loadPaymentInfos();
        }
      });
    } else {
      this.loadPaymentInfos(); // ✅ Load if personId is provided as input
    }
  }

  ngAfterViewInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['personId'] && changes['personId'].currentValue) {
      this.loadPaymentInfos(); // Reload when personId changes
    }
  }

  // 🔹 Load Payment Info List for Person
  loadPaymentInfos(): void {
    if (!this.personId) return;

    const paymentSub = this.paymentInfoService
      .getPaymentInfosByPerson(this.personId)
      .subscribe({
        next: (data) => {
          this.paymentData = data;
          this.datatableConfig = {
            ...this.datatableConfig,
            data: [...this.paymentData],
          };

          this.cdr.detectChanges();
          this.reloadEvent.emit(true);
        },
        error: () => {
          this.showAlert({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información de pago.',
          });
        },
      });
    this.unsubscribe.push(paymentSub);
  }

  // 🔹 Delete a Payment Info
  delete(id: string): void {
    const deleteSub = this.paymentInfoService.deletePaymentInfo(id).subscribe({
      next: () => {
        this.paymentData = this.paymentData.filter((item) => item.id !== id);
        this.datatableConfig = {
          ...this.datatableConfig,
          data: [...this.paymentData],
        };

        this.cdr.detectChanges();
        this.reloadEvent.emit(true);
      },
      error: () => {
        this.showAlert({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar la información de pago.',
        });
      },
    });
    this.unsubscribe.push(deleteSub);
  }

  // 🔹 Edit Payment Info
  edit(id: string): void {
    const foundItem = this.paymentData.find((item) => item.id === id);
    this.paymentInfo = foundItem ? { ...foundItem } : ({} as IPaymentInfoModel);
  }

  // 🔹 Create a new Payment Info
  create(): void {
    this.paymentInfo = {} as IPaymentInfoModel;
  }

  // 🔹 Handle Form Submission
  onSubmit(event: Event, myForm: NgForm): void {
    if (myForm && myForm.invalid) {
      return;
    }

    if (!this.personId) return;

    this.paymentInfo.personId = this.personId;

    this.isLoading = true;

    const successAlert: SweetAlertOptions = {
      icon: 'success',
      title: '¡Éxito!',
      text: this.paymentInfo.id
        ? 'Información de pago actualizada correctamente.'
        : 'Información de pago creada correctamente.',
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
      this.paymentInfoService
        .updatePaymentInfo(this.paymentInfo.id, this.paymentInfo)
        .subscribe({
          next: (updatedInfo) => {
            const index = this.paymentData.findIndex(
              (item) => item.id === updatedInfo.id
            );
            if (index > -1) this.paymentData[index] = { ...updatedInfo };

            this.showAlert(successAlert);

            this.datatableConfig = {
              ...this.datatableConfig,
              data: [...this.paymentData],
            };

            this.cdr.detectChanges();
            this.reloadEvent.emit(true);
          },
          error: (error) => {
            errorAlert.text = 'No se pudo actualizar la información de pago.';
            this.showAlert(errorAlert);
            this.isLoading = false;
          },
          complete: completeFn,
        });
    };

    const createFn = () => {
      this.paymentInfoService.createPaymentInfo(this.paymentInfo).subscribe({
        next: () => {
          this.showAlert(successAlert);
          this.loadPaymentInfos(); // ✅ Reload the list after creation
        },
        error: (error) => {
          errorAlert.text = 'No se pudo crear la información de pago.';
          this.showAlert(errorAlert);
          this.isLoading = false;
        },
        complete: completeFn,
      });
    };

    if (this.paymentInfo.id) {
      updateFn();
    } else {
      createFn();
    }
  }

  // 🔹 Show SweetAlert Message
  showAlert(swalOptions: SweetAlertOptions): void {
    this.swalOptions = {
      buttonsStyling: false,
      confirmButtonText: 'Ok, entendido!',
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
  }
}
