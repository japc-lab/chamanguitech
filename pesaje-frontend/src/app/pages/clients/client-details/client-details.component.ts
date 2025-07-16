import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import {
  ICreateUpdateClientModel,
  IReadClientModel,
} from '../../../modules/shared/interfaces/client.interface';
import { ClientService } from '../../../modules/shared/services/client.service';
import { PERMISSION_ROUTES } from '../../../constants/routes.constants';
import { IReadUserModel } from 'src/app/modules/settings/interfaces/user.interface';
import { UserService } from 'src/app/modules/settings/services/user.service';
import { DateUtilsService } from 'src/app/utils/date-utils.service';
import { AlertService } from 'src/app/utils/alert.service';
import { AuthService } from 'src/app/modules/auth';

type Tabs = 'Details' | 'Shrimp Farms' | 'Payment Info';

@Component({
  selector: 'app-client-details',
  templateUrl: './client-details.component.html',
})
export class ClientDetailsComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  PERMISSION_ROUTE = PERMISSION_ROUTES.CLIENTS;

  @ViewChild('clientForm') clientForm!: NgForm;

  isLoading$: Observable<boolean>;
  activeTab: Tabs = 'Details';

  clientData: IReadClientModel = {} as IReadClientModel;
  personId: string = '';
  clientId: string = '';
  formattedBirthDate: string = '';

  isOnlyBuyer = false;

  /** Propiedades para el multi-select de compradores */
  buyers: IReadUserModel[] = [];
  selectedBuyers: IReadUserModel[] = [];

  /** Stores all active subscriptions */
  private unsubscribe: Subscription[] = [];

  constructor(
    private clientService: ClientService,
    private authService: AuthService,
    private userService: UserService,
    private dateUtils: DateUtilsService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private location: Location,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.isLoading$ = this.clientService.isLoading$;
  }

  ngOnInit(): void {
    const routeSub = this.route.paramMap.subscribe((params) => {
      const clientId = params.get('clientId');
      if (clientId) {
        this.fetchClientDetails(clientId);
      }
    });
    this.unsubscribe.push(routeSub);

    this.isOnlyBuyer = this.authService.isOnlyBuyer;

    if (!this.isOnlyBuyer) {
      this.PERMISSION_ROUTE = PERMISSION_ROUTES.SETTINGS.CLIENTS;
    }
  }

  ngAfterViewInit(): void {}

  fetchClientDetails(clientId: string): void {
    const clientSub = this.clientService.getClientById(clientId).subscribe({
      next: (client) => {
        this.clientData = client;
        this.personId = this.clientData.person?.id ?? '';
        this.clientId = this.clientData.id ?? '';

        if (this.clientData.person?.birthDate) {
          this.formattedBirthDate = new Date(this.clientData.person.birthDate)
            .toISOString()
            .split('T')[0];
        }

        // 🔹 Load buyers only if they haven't been fetched before
        if (!this.buyers.length) {
          this.loadBuyers();
        } else {
          this.processSelectedBuyers();
        }

        this.changeDetectorRef.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching client details:', err);
      },
    });

    this.unsubscribe.push(clientSub);
  }

  loadBuyers(): void {
    if (this.buyers.length) {
      // If buyers are already loaded, process selected ones without fetching again
      this.processSelectedBuyers();
      return;
    }

    const userSub = this.userService.getAllUsers(true, 'Comprador').subscribe({
      next: (users: IReadUserModel[]) => {
        this.buyers = users;
        this.processSelectedBuyers(); // Process selected buyers separately
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching users:', error);
      },
    });

    this.unsubscribe.push(userSub);
  }

  setActiveTab(tab: Tabs) {
    this.activeTab = tab;
  }

  saveClient() {
    if (this.clientForm.invalid || !this.clientData) {
      return;
    }

    if (this.isOnlyBuyer) {
      this.clientData.buyersItBelongs = [this.authService.currentUserValue!.id];
    } else {
      this.clientData.buyersItBelongs = this.selectedBuyers.map(
        (buyer) => buyer.id
      );
    }

    const payload: ICreateUpdateClientModel = {
      buyersItBelongs: this.clientData.buyersItBelongs,
      person: this.clientData.person,
    };

    const updateSub = this.clientService
      .updateClient(this.clientData.id, payload)
      .subscribe({
        next: () => {
          this.alertService.showTranslatedAlert({ alertType: 'success' });
        },
        error: (error) => {
          console.error('Error updating client', error);
          this.alertService.showTranslatedAlert({ alertType: 'error' });
        },
      });

    this.unsubscribe.push(updateSub);
  }

  onChangeBirthDate(value: string) {
    const convertedDate = this.dateUtils.convertLocalDateToUTC(value);
    this.clientData.person.birthDate =
      convertedDate === '' ? null : convertedDate;
  }

  onChangeEmail(value: string): void {
    this.clientData.person.email = value.trim() === '' ? null : value;
  }

  goBack(): void {
    this.location.back();
  }

  private processSelectedBuyers(): void {
    // 🔹 Extract selected buyer IDs from the client data
    const selectedBuyerIds = new Set(
      (this.clientData?.buyersItBelongs as string[]) ?? []
    );

    // 🔹 Separate selected buyers from the rest
    this.selectedBuyers = this.buyers.filter((buyer) =>
      selectedBuyerIds.has(buyer.id)
    );
  }

  /** 🔴 Unsubscribe from all subscriptions to avoid memory leaks */
  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
  }
}
