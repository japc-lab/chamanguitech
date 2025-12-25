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
import { FishermanService } from '../../services/fisherman.service';
import { IReadFishermanModel, IUpdateFishermanModel } from '../../interfaces/fisherman.interface';
import { AlertService } from 'src/app/utils/alert.service';
import { DateUtilsService } from 'src/app/utils/date-utils.service';
import { NgForm } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';

type Tabs = 'Details' | 'Payment Info';

@Component({
    selector: 'app-fisherman-details',
    templateUrl: './fisherman-details.component.html',
    styleUrls: ['./fisherman-details.component.scss'],
    standalone: false
})
export class FishermanDetailsComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  PERMISSION_ROUTE = PERMISSION_ROUTES.SETTINGS.PEOPLE;

  @ViewChild('fishermanForm') fishermanForm!: NgForm;

  isLoading$: Observable<boolean>;
  activeTab: Tabs = 'Details';

  fishermanData: IReadFishermanModel = {} as IReadFishermanModel;
  personId: string = '';
  isActive: boolean = true;

  /** Stores all active subscriptions */
  private unsubscribe: Subscription[] = [];

  constructor(
    private fishermanService: FishermanService,
    private dateUtils: DateUtilsService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private location: Location,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.isLoading$ = this.fishermanService.isLoading$;
  }

  ngOnInit(): void {
    const routeSub = this.route.paramMap.subscribe((params) => {
      const fishermanId = params.get('fishermanId');
      if (fishermanId) {
        this.fetchFishermanDetails(fishermanId);
      }
    });

    this.unsubscribe.push(routeSub);
  }

  ngAfterViewInit(): void {}

  fetchFishermanDetails(fishermanId: string): void {
    const fishermanSub = this.fishermanService.getById(fishermanId).subscribe({
      next: (fisherman) => {
        this.fishermanData = fisherman;
        this.personId = fisherman.person?.id ?? '';
        this.isActive = !fisherman.deletedAt;

        this.changeDetectorRef.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching fisherman details:', err);
      },
    });

    this.unsubscribe.push(fishermanSub);
  }

  setActiveTab(tab: Tabs) {
    this.activeTab = tab;
  }

  saveFisherman() {
    if (this.fishermanForm.invalid || !this.fishermanData) {
      return;
    }

    const payload: IUpdateFishermanModel = {
      id: this.fishermanData.id,
      person: this.fishermanData.person,
      deletedAt: this.isActive ? null : new Date(),
    };

    const updateSub = this.fishermanService
      .update(this.fishermanData.id, payload)
      .subscribe({
        next: () => {
          this.alertService.showTranslatedAlert({ alertType: 'success' });
        },
        error: (error) => {
          console.error('Error updating fisherman', error);
          this.alertService.showTranslatedAlert({ alertType: 'error' });
        },
      });

    this.unsubscribe.push(updateSub);
  }

  onChangeEmail(value: string): void {
    this.fishermanData.person.email = value.trim() === '' ? null : value;
  }

  goBack(): void {
    this.location.back();
  }

  /** 🔴 Unsubscribe from all subscriptions to avoid memory leaks */
  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
  }
}
