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
import { BrokerService } from '../../services/broker.service';
import {
  IReadBrokerModel,
  IUpdateBrokerModel,
} from '../../interfaces/broker.interface';
import { NgForm } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { PERMISSION_ROUTES } from '../../../../constants/routes.constants';
import { DateUtilsService } from 'src/app/utils/date-utils.service';
import { AlertService } from 'src/app/utils/alert.service';
import { AuthService } from 'src/app/modules/auth';
import { IReadUserModel } from 'src/app/modules/settings/interfaces/user.interface';
import { UserService } from 'src/app/modules/settings/services/user.service';

type Tabs = 'Details' | 'Payment Info';

@Component({
  selector: 'app-broker-details',
  templateUrl: './broker-details.component.html',
  styleUrls: ['./broker-details.component.scss'],
})
export class BrokerDetailsComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  PERMISSION_ROUTE = PERMISSION_ROUTES.PERSONAL_PROFILE.BROKERS;

  @ViewChild('brokerForm') brokerForm!: NgForm;

  isLoading$: Observable<boolean>;
  activeTab: Tabs = 'Details';

  isOnlyBuyer = false;

  buyers: IReadUserModel[];
  selectedBuyer: IReadUserModel[];

  brokerData: IReadBrokerModel = {} as IReadBrokerModel;
  personId: string = '';
  formattedBirthDate: string = '';

  /** Stores all active subscriptions */
  private unsubscribe: Subscription[] = [];

  constructor(
    private brokerService: BrokerService,
    private authService: AuthService,
    private userService: UserService,
    private dateUtils: DateUtilsService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private location: Location,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.isLoading$ = this.brokerService.isLoading$;
  }

  ngOnInit(): void {
    this.isOnlyBuyer = this.authService.isOnlyBuyer;

    if (!this.isOnlyBuyer) {
      this.PERMISSION_ROUTE = PERMISSION_ROUTES.SETTINGS.BROKERS;
    }

    const routeSub = this.route.paramMap.subscribe((params) => {
      const brokerId = params.get('brokerId');
      if (brokerId) {
        this.fetchBrokerDetails(brokerId);
      }
    });

    this.unsubscribe.push(routeSub);
  }

  ngAfterViewInit(): void {}

  fetchBrokerDetails(brokerId: string): void {
    const brokerSub = this.brokerService.getBrokerById(brokerId).subscribe({
      next: (broker) => {
        this.brokerData = broker;
        this.personId = broker.person?.id ?? '';

        if (this.brokerData.person?.birthDate) {
          this.formattedBirthDate = this.dateUtils.formatISOToDateInput(
            this.brokerData.person.birthDate
          );
        }

        if (!this.isOnlyBuyer) {
          this.loadBuyersAndSetSelectedBuyer(broker.buyerItBelongs as string);
        }

        this.changeDetectorRef.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching broker details:', err);
      },
    });

    this.unsubscribe.push(brokerSub);
  }

  loadBuyersAndSetSelectedBuyer(buyerId: string) {
    const userSub = this.userService.getAllUsers(true, 'Comprador').subscribe({
      next: (users: IReadUserModel[]) => {
        this.buyers = users;
        this.selectedBuyer =
          this.buyers.filter((buyer) => buyer.id === buyerId) || [];
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

  saveBroker() {
    if (this.brokerForm.invalid || !this.brokerData) {
      return;
    }

    if (this.isOnlyBuyer) {
      this.brokerData.buyerItBelongs = this.authService.currentUserValue!.id;
    } else {
      this.brokerData.buyerItBelongs = this.selectedBuyer.map(
        (buyer) => buyer.id
      )[0];
    }

    const payload: IUpdateBrokerModel = {
      id: this.brokerData.id,
      buyerItBelongs: this.brokerData.buyerItBelongs as string,
      person: this.brokerData.person,
    };

    const updateSub = this.brokerService
      .updateBroker(this.brokerData.id, payload)
      .subscribe({
        next: () => {
          this.alertService.showTranslatedAlert({ alertType: 'success' });
        },
        error: (error) => {
          console.error('Error updating broker', error);
          this.alertService.showTranslatedAlert({ alertType: 'error' });
        },
      });

    this.unsubscribe.push(updateSub);
  }

  onChangeBirthDate(value: string) {
    const convertedDate = this.dateUtils.convertLocalDateToUTC(value);
    this.brokerData.person.birthDate =
      convertedDate === '' ? null : convertedDate;
  }

  onChangeEmail(value: string): void {
    this.brokerData.person.email = value.trim() === '' ? null : value;
  }

  goBack(): void {
    this.location.back();
  }

  /** 🔴 Unsubscribe from all subscriptions to avoid memory leaks */
  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
  }
}
