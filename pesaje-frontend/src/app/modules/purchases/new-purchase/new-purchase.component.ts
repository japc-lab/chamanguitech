import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { NgForm } from '@angular/forms';
import { distinctUntilChanged, Observable, Subscription } from 'rxjs';
import { PERMISSION_ROUTES } from 'src/app/constants/routes.constants';
import { PurchaseService } from '../services/purchase.service';
import { IRoleModel } from '../../auth/interfaces/role.interface';
import { AuthService } from '../../auth';
import { BrokerService } from '../../personal-profile/services/broker.service';
import { IReadBrokerModel } from '../../personal-profile/interfaces/broker.interface';
import { ClientService } from '../../shared/services/client.service';
import { IReadClientModel } from '../../shared/interfaces/client.interface';
import { IReadShrimpFarmModel } from '../../shared/interfaces/shrimp-farm.interface';
import { ShrimpFarmService } from '../../shared/services/shrimp-farm.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { FormUtilsService } from 'src/app/utils/form-utils.service';
import {
  ICreatePurchaseModel,
  IListPurchaseModel,
  PurchaseStatusEnum,
} from '../interfaces/purchase.interface';
import { InputUtilsService } from 'src/app/utils/input-utils.service';
import { AlertService } from 'src/app/utils/alert.service';
import { PurchasePaymentListingComponent } from '../purchase-payment-listing/purchase-payment-listing.component';
import { DateUtilsService } from 'src/app/utils/date-utils.service';
import { IReadUserModel } from '../../settings/interfaces/user.interface';
import { UserService } from '../../settings/services/user.service';
import { IReadPeriodModel } from '../../shared/interfaces/period.interface';
import { PeriodService } from '../../shared/services/period.service';
import { ICompany } from '../../settings/interfaces/company.interfaces';
import { CompanyService } from '../../settings/services/company.service';

type Tabs = 'Details' | 'Payment Info';

@Component({
  selector: 'app-new-purchase',
  templateUrl: './new-purchase.component.html',
  styleUrls: ['./new-purchase.component.scss'],
})
export class NewPurchaseComponent implements OnInit, OnDestroy {
  PERMISSION_ROUTE = PERMISSION_ROUTES.PURCHASES.PURCHASE_FORM;

  @ViewChild('purchaseForm') purchaseForm!: NgForm;

  // Inicializa modalRef como null explícitamente
  private modalRef: NgbModalRef | null = null;

  isLoading$: Observable<boolean>;

  buyersList: IReadUserModel[];
  brokersList: IReadBrokerModel[];
  clientsList: IReadClientModel[];
  shrimpFarmsList: IReadShrimpFarmModel[];
  companiesList: ICompany[];
  existingPeriods: IReadPeriodModel[] = [];

  roles: IRoleModel[];
  isOnlyBuyer = false;
  isLocal = false;
  hasRouteId = false;

  farmPlace: string = '';
  shrimpFarmSize: string = '';
  shrimpFarmSize2: string = '';
  purchaseId?: string;

  createPurchaseModel: ICreatePurchaseModel = {} as ICreatePurchaseModel;

  /** Stores all active subscriptions */
  private unsubscribe: Subscription[] = [];

  constructor(
    private purchaseService: PurchaseService,
    private userService: UserService,
    private authService: AuthService,
    private companyService: CompanyService,
    private periodService: PeriodService,
    private brokerService: BrokerService,
    private clientService: ClientService,
    private shrimpFarmService: ShrimpFarmService,
    private modalService: NgbModal,
    private formUtils: FormUtilsService,
    private inputUtils: InputUtilsService,
    private alertService: AlertService,
    private dateUtils: DateUtilsService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.isLoading$ = this.purchaseService.isLoading$;
  }

  get purchaseDateFormatted(): string | null {
    return this.dateUtils.formatISOToDateInput(
      this.createPurchaseModel.purchaseDate
    );
  }

  ngOnInit(): void {
    this.purchaseId = this.route.snapshot.paramMap.get('id') || undefined;
    this.hasRouteId = !!this.purchaseId;
    this.isOnlyBuyer = this.authService.isOnlyBuyer;

    if (this.isOnlyBuyer) {
      this.createPurchaseModel.buyer = this.authService.currentUserValue?.id!;
      this.loadBrokers(this.createPurchaseModel.buyer);
      this.loadClients(this.createPurchaseModel.buyer);
    } else {
      this.loadBuyers();
    }

    const companiesSub = this.loadCompanies().subscribe({
      next: (companies) => {
        this.companiesList = companies;

        if (this.purchaseId) {
          const purchaseSub = this.purchaseService
            .getPurchaseById(this.purchaseId)
            .subscribe({
              next: (purchase: IListPurchaseModel) => {
                this.createPurchaseModel = { ...purchase };

                this.loadBrokers(this.createPurchaseModel.buyer);
                this.loadClients(this.createPurchaseModel.buyer);
                this.loadShrimpFarms(this.createPurchaseModel.client);

                if (this.createPurchaseModel.company) {
                  const selectedCompany = this.companiesList.find(
                    (com) => com.id === this.createPurchaseModel.company
                  );
                  this.isLocal = selectedCompany?.name === 'Local';
                  if (!this.isLocal) {
                    this.loadPeriods(this.createPurchaseModel.company);
                  }
                } else {
                  this.isLocal = false;
                }

                this.shrimpFarmSize = this.inputUtils.formatToDecimal(
                  this.createPurchaseModel.averageGrams > 0
                    ? 1000 / this.createPurchaseModel.averageGrams
                    : 0
                );
                this.shrimpFarmSize2 = this.inputUtils.formatToDecimal(
                  this.createPurchaseModel.averageGrams2 &&
                    this.createPurchaseModel.averageGrams2! > 0
                    ? 1000 / this.createPurchaseModel.averageGrams2!
                    : 0
                );

                this.changeDetectorRef.detectChanges();
              },
              error: (error) => {
                console.error('Error fetching purchases:', error);
              },
            });

          this.unsubscribe.push(purchaseSub);
        }
      },
      error: (error) => {
        console.error('Error loading companies:', error);
      },
    });

    this.unsubscribe.push(companiesSub);
  }

  loadCompanies(): Observable<ICompany[]> {
    return this.companyService.getCompanies().pipe(distinctUntilChanged());
  }

  loadPeriods(companyId: string): void {
    const periodSub = this.periodService
      .getPeriodsByCompany(companyId)
      .subscribe({
        next: (periods) => {
          this.existingPeriods = periods;
        },
        error: (err) => {
          console.error('Error al cargar periodos:', err);
        },
      });

    this.unsubscribe.push(periodSub);
  }

  loadBuyers(): void {
    const userSub = this.userService.getAllUsers(false, 'Comprador').subscribe({
      next: (users: IReadUserModel[]) => {
        this.buyersList = users;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching users:', error);
      },
    });

    this.unsubscribe.push(userSub);
  }

  loadBrokers(buyerId: string): void {
    const brokerSub = this.brokerService.getBrokersByUser(buyerId).subscribe({
      next: (brokers: IReadBrokerModel[]) => {
        this.brokersList = brokers;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching brokers:', error);
      },
    });

    this.unsubscribe.push(brokerSub);
  }

  loadClients(buyerId: string): void {
    const clientSub = this.clientService.getClientsByUser(buyerId).subscribe({
      next: (clients: IReadClientModel[]) => {
        this.clientsList = clients;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching clients:', error);
      },
    });

    this.unsubscribe.push(clientSub);
  }

  loadShrimpFarms(clientId: string): void {
    let userId: string | undefined = undefined;
    if (this.isOnlyBuyer) {
      userId = this.authService.currentUserValue!.id;
    } else {
      userId = this.createPurchaseModel.buyer;
    }

    const shrimpFarmSub = this.shrimpFarmService
      .getFarmsByClientAndBuyer(clientId, userId)
      .subscribe({
        next: (farms: IReadShrimpFarmModel[]) => {
          this.shrimpFarmsList = farms;

          if (this.purchaseId) {
            const farm = this.shrimpFarmsList.filter(
              (sf) => sf.id === this.createPurchaseModel.shrimpFarm
            )[0];
            if (farm) {
              this.farmPlace = (farm as IReadShrimpFarmModel).place;
            }
          }
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching shrimp farms:', error);
        },
      });

    this.unsubscribe.push(shrimpFarmSub);
  }

  onCompanyChange(event: Event) {
    this.createPurchaseModel.period = undefined;

    const companyId = (event.target as HTMLSelectElement).value;

    if (companyId) {
      const selectedCompany = this.companiesList.find(
        (com) => com.id === companyId
      );
      this.isLocal = selectedCompany?.name === 'Local';
      if (!this.isLocal) this.loadPeriods(companyId); // Fetch periods for the selected company
    } else {
      this.isLocal = false;
    }
  }

  onBuyerChange(event: Event): void {
    this.createPurchaseModel.broker = '';
    this.createPurchaseModel.client = '';
    this.createPurchaseModel.shrimpFarm = '';

    const buyerId = (event.target as HTMLSelectElement).value;
    if (buyerId) {
      this.loadBrokers(buyerId); // Load brokers when buyer changes
      this.loadClients(buyerId); // Load clients when buyer changes
    }
  }

  onClientChange(event: Event): void {
    this.createPurchaseModel.shrimpFarm = '';

    const clientId = (event.target as HTMLSelectElement).value;
    if (clientId) {
      this.loadShrimpFarms(clientId);
    }
  }

  onShrimpFarmChange(event: Event): void {
    const farmId = (event.target as HTMLSelectElement).value;
    const farm = this.shrimpFarmsList.filter((sf) => sf.id === farmId)[0];
    if (farm) {
      this.farmPlace = (farm as IReadShrimpFarmModel).place; // ✅ Update input field
    }
  }

  onDateChange(event: any): void {
    if (!event) return;

    this.createPurchaseModel.purchaseDate =
      this.dateUtils.convertLocalDateToUTC(event);
  }

  onHasInvoiceChange(hasInvoice: boolean) {
    if (!hasInvoice) this.createPurchaseModel.invoice = undefined;
  }

  submitForm(): void {
    // if (this.isLocal) {
    //   this.createPurchaseModel.period = null;
    // }

    if (this.purchaseId) {
      // ✅ Update Purchase if ID exists
      this.purchaseService
        .updatePurchase(this.purchaseId, this.createPurchaseModel)
        .subscribe({
          next: (response) => {
            console.log('Purchase updated successfully:', response);
            this.alertService.showTranslatedAlert({ alertType: 'success' });
          },
          error: (error) => {
            console.error('Error updating purchase:', error);
            this.alertService.showTranslatedAlert({ alertType: 'error' });
          },
        });
    } else {
      // ✅ Create New Purchase if ID does NOT exist
      this.purchaseService.createPurchase(this.createPurchaseModel).subscribe({
        next: (response) => {
          this.purchaseId = response.id; // ✅ Store the new ID for future updates
          this.createPurchaseModel.controlNumber = response.controlNumber;
          this.createPurchaseModel.status = response.status;
          this.alertService.showTranslatedAlert({ alertType: 'success' });
          // form.resetForm(); // Reset form after successful creation
        },
        error: (error) => {
          console.error('Error creating purchase:', error);
          this.alertService.showTranslatedAlert({ alertType: 'error' });
        },
      });
    }
  }

  confirmSave(event: Event, form: NgForm): void {
    if (form && form.invalid) {
      return;
    }

    // Ensure calculated fields are updated before submission
    this.onInputChange();

    this.alertService.confirm().then((result) => {
      if (result.isConfirmed) {
        this.submitForm();
      }
    });
  }

  canSavePurchase(): boolean {
    if (this.purchaseId) {
      if (this.isOnlyBuyer) {
        return (
          this.createPurchaseModel.status !== PurchaseStatusEnum.COMPLETED &&
          this.createPurchaseModel.status !== PurchaseStatusEnum.CLOSED
        );
      } else {
        return this.createPurchaseModel.status !== PurchaseStatusEnum.CLOSED;
      }
    }
    return true;
  }

  canAddPayments(): boolean {
    if (this.purchaseId) {
      if (this.isOnlyBuyer) {
        return (
          this.createPurchaseModel.status !== PurchaseStatusEnum.COMPLETED &&
          this.createPurchaseModel.status !== PurchaseStatusEnum.CLOSED
        );
      } else {
        return this.createPurchaseModel.status !== PurchaseStatusEnum.CLOSED;
      }
    }
    return false;
  }

  addNewClient() {
    if (this.isOnlyBuyer) this.router.navigate(['clients']);
    else this.router.navigate(['settings', 'clients']);
  }

  goBack(): void {
    this.location.back();
  }

  handleNewSale(): void {
    const currentUrl = this.router.url;

    if (currentUrl === '/purchases/form') {
      // If already on /purchases/form, reload the route (force component reset)
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate(['/purchases/form']);
      });
    } else {
      // Otherwise, navigate to /logistics/new
      this.router.navigate(['/purchases/form']);
    }
  }

  onInputChange(): void {
    const avgGrams = +this.purchaseForm.controls.averageGrams?.value || 0;
    const avgGrams2 = +this.purchaseForm.controls.averageGrams2?.value || 0;
    const pounds = +this.purchaseForm.controls.pounds?.value || 0;
    const pounds2 = +this.purchaseForm.controls.pounds2?.value || 0;
    const price = +this.purchaseForm.controls.price?.value || 0;
    const price2 = +this.purchaseForm.controls.price2?.value || 0;

    // Calculate values
    const totalPounds = pounds + pounds2;
    const subtotal = pounds * price;
    const subtotal2 = pounds2 * price2;
    const grandTotal = subtotal + subtotal2;

    // Set calculated values in the form
    this.purchaseForm.controls.totalPounds?.setValue(totalPounds);
    this.purchaseForm.controls.subtotal?.setValue(subtotal);
    this.purchaseForm.controls.subtotal2?.setValue(subtotal2);
    this.purchaseForm.controls.grandTotal?.setValue(grandTotal);

    // Format disabled fields
    this.formatDecimal('totalPounds');
    this.formatDecimal('subtotal');
    this.formatDecimal('subtotal2');
    this.formatDecimal('grandTotal');

    // Format shrimp size calculations
    this.shrimpFarmSize = this.inputUtils.formatToDecimal(
      avgGrams > 0 ? 1000 / avgGrams : 0
    );
    this.shrimpFarmSize2 = this.inputUtils.formatToDecimal(
      avgGrams2 > 0 ? 1000 / avgGrams2 : 0
    );
  }

  /**
   * 👉 Formats price input value
   */
  formatDecimal(controlName: string) {
    const control = this.purchaseForm.controls[controlName];
    if (control) {
      this.formUtils.formatControlToDecimal(control); // ✅ Use utility function
    }
  }

  /**
   * 👉 Validates numeric input (prevents invalid characters)
   */
  validateNumber(event: KeyboardEvent) {
    this.inputUtils.validateNumber(event); // ✅ Use utility function
  }

  async openPaymentsModal(): Promise<any> {
    if (this.modalRef) {
      // console.warn(
      //   '⚠️ Modal is already open. Ignoring duplicate open request.'
      // );
      return;
    }

    if (!this.purchaseId) {
      // console.error('❌ purchaseId is missing. Modal cannot be opened.');
      return;
    }

    try {
      this.modalRef = this.modalService.open(PurchasePaymentListingComponent, {
        size: 'lg',
        centered: true,
        backdrop: 'static',
        keyboard: false,
        windowClass: 'payment-listing-modal',
      });

      // ✅ Set input safely
      this.modalRef.componentInstance.purchaseId = this.purchaseId;

      const result = await this.modalRef.result;
      return result;
    } catch (error) {
      // console.warn('⚠️ Modal dismissed or error occurred:', error);
      return null;
    } finally {
      // ✅ Always clear the modal ref
      this.modalRef = null;
    }
  }

  /** 🔴 Unsubscribe from all subscriptions to avoid memory leaks */
  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());

    // Cerrar el modal si está abierto
    if (this.modalRef) {
      this.modalRef.close();
      this.modalRef = null;
    }
  }
}
