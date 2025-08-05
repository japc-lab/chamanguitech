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
import { PERMISSION_ROUTES } from '../../../../constants/routes.constants';
import { MerchantService } from '../../services/merchant.service';
import {
  IReadMerchantModel,
  IUpdateMerchantModel,
} from '../../interfaces/merchant.interface';
import { AlertService } from 'src/app/utils/alert.service';
import { DateUtilsService } from 'src/app/utils/date-utils.service';
import { NgForm } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';

type Tabs = 'Details' | 'Payment Info';

@Component({
  selector: 'app-merchant-details',
  templateUrl: './merchant-details.component.html',
  styleUrls: ['./merchant-details.component.scss'],
})
export class MerchantDetailsComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  PERMISSION_ROUTE = PERMISSION_ROUTES.SETTINGS.PEOPLE;

  @ViewChild('merchantForm') merchantForm!: NgForm;

  isLoading$: Observable<boolean>;
  activeTab: Tabs = 'Details';

  merchantData: IReadMerchantModel = {} as IReadMerchantModel;
  personId: string = '';
  isActive: boolean = true;

  /** Stores all active subscriptions */
  private unsubscribe: Subscription[] = [];

  constructor(
    private merchantService: MerchantService,
    private dateUtils: DateUtilsService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private location: Location,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.isLoading$ = this.merchantService.isLoading$;
  }

  ngOnInit(): void {
    const routeSub = this.route.paramMap.subscribe((params) => {
      const merchantId = params.get('merchantId');
      if (merchantId) {
        this.fetchMerchantDetails(merchantId);
      }
    });

    this.unsubscribe.push(routeSub);
  }

  ngAfterViewInit(): void {}

  fetchMerchantDetails(merchantId: string): void {
    const merchantSub = this.merchantService
      .getMerchantById(merchantId)
      .subscribe({
        next: (merchant) => {
          this.merchantData = merchant;
          this.personId = merchant.person?.id ?? '';
          this.isActive = !merchant.deletedAt;

          this.changeDetectorRef.detectChanges();
        },
        error: (err) => {
          console.error('Error fetching merchant details:', err);
        },
      });

    this.unsubscribe.push(merchantSub);
  }

  setActiveTab(tab: Tabs) {
    this.activeTab = tab;
  }

  saveMerchant() {
    if (this.merchantForm.invalid || !this.merchantData) {
      return;
    }

    const payload: IUpdateMerchantModel = {
      id: this.merchantData.id,
      person: this.merchantData.person,
      recommendedBy: this.merchantData.recommendedBy,
      recommendedByPhone: this.merchantData.recommendedByPhone,
      description: this.merchantData.description,
      companyName: this.merchantData.companyName,
      deletedAt: this.isActive ? null : new Date(),
    };

    const updateSub = this.merchantService
      .updateMerchant(this.merchantData.id, payload)
      .subscribe({
        next: () => {
          this.alertService.showTranslatedAlert({ alertType: 'success' });
        },
        error: (error) => {
          console.error('Error updating merchant', error);
          this.alertService.showTranslatedAlert({ alertType: 'error' });
        },
      });

    this.unsubscribe.push(updateSub);
  }

  onChangeEmail(value: string): void {
    this.merchantData.person.email = value.trim() === '' ? null : value;
  }

  goBack(): void {
    this.location.back();
  }

  /** 🔴 Unsubscribe from all subscriptions to avoid memory leaks */
  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
  }
}
