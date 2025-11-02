import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { PERMISSION_ROUTES } from 'src/app/constants/routes.constants';
import { WholeTableComponent } from 'src/app/modules/shared/components/prices/whole-table/whole-table.component';
import { HeadlessTableComponent } from 'src/app/modules/shared/components/prices/headless-table/headless-table.component';
import { ResidualTableComponent } from 'src/app/modules/shared/components/prices/residual-table/residual-table.component';
import {
  IReadPeriodModel,
  IUpdatePeriodModel,
  TimeOfDayEnum,
} from 'src/app/modules/shared/interfaces/period.interface';
import { PeriodService } from 'src/app/modules/shared/services/period.service';
import {
  IReadSizeModel,
  SizeTypeEnum,
} from 'src/app/modules/shared/interfaces/size.interface';
import { distinctUntilChanged } from 'rxjs/operators';
import {
  IReadSizePriceModel,
  IUpdateSizePriceModel,
} from 'src/app/modules/shared/interfaces/size-price.interface';
import { AlertService } from 'src/app/utils/alert.service';
import { InputUtilsService } from 'src/app/utils/input-utils.service';
import { DateUtilsService } from 'src/app/utils/date-utils.service';
import { ICompany } from 'src/app/modules/settings/interfaces/company.interfaces';
import { CompanyService } from 'src/app/modules/settings/services/company.service';

@Component({
  selector: 'app-size-price',
  templateUrl: './size-price.component.html',
})
export class SizePriceComponent implements OnInit, OnDestroy {
  PERMISSION_ROUTE = PERMISSION_ROUTES.PRICES.BY_COMPANY;

  @ViewChild(WholeTableComponent) wholeTableComponent!: WholeTableComponent;
  @ViewChild(HeadlessTableComponent)
  headlessTableComponent!: HeadlessTableComponent;
  @ViewChild(ResidualTableComponent)
  residualTableComponent!: ResidualTableComponent;

  @Input() selectedCompany: string = '';
  years: number[] = [];
  companies: ICompany[] = [];
  existingPeriods: IReadPeriodModel[] = [];

  selectedPeriod = '';
  //selectedCompany = '';
  selectedYear = '';
  periodNumber = '';

  fromDate: string = '';
  toDate: string = '';
  // timeOfDay: TimeOfDayEnum | '';
  receivedDate: string = '';
  // receivedTime: string = '';

  isAdding = false;
  isEditing = false;
  isSearching = false;
  showEditButton = false;
  showErrors = false;
  showCompany = true;

  wholeSizePrices: IReadSizePriceModel[] = [];
  headlessSizePrices: IReadSizePriceModel[] = [];
  residualSizePrices: IReadSizePriceModel[] = [];

  private unsubscribe: Subscription[] = [];

  constructor(
    private companyService: CompanyService,
    private periodService: PeriodService,
    private alertService: AlertService,
    private inputUtils: InputUtilsService,
    private dateUtils: DateUtilsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadYears();

    if (this.selectedCompany === '') this.loadCompanies();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedCompany']) {
      this.onCompanyChange();
      // this.loadYears();
      this.showCompany = !this.selectedCompany;
    }
  }

  loadYears() {
    const currentYear = new Date().getFullYear();
    this.years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);
  }

  loadCompanies(): void {
    const companieSub = this.companyService
      .getCompanies()
      .pipe(distinctUntilChanged())
      .subscribe({
        next: (companies) =>
          (this.companies = companies.filter((c) => c.name !== 'Local')),
        error: (err) => console.error('Error al cargar compañías', err),
      });

    this.unsubscribe.push(companieSub);
  }

  onCompanyChange() {
    if (!this.selectedCompany) {
      this.existingPeriods = [];
      return;
    }
    // Fetch periods for the selected company
    this.periodService.getPeriodsByCompany(this.selectedCompany).subscribe({
      next: (periods) => {
        this.existingPeriods = periods;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar periodos:', err);
      },
    });

    this.selectedPeriod = '';
    this.resetFields();
  }

  onPeriodChange() {
    this.resetFields();
  }

  search() {
    this.isSearching = true;

    if (!this.selectedCompany || !this.selectedPeriod) {
      this.showErrors = true;
      return;
    }

    this.showEditButton = true;
    this.isEditing = false;

    // Call API to fetch period details by ID
    this.periodService.getPeriodById(this.selectedPeriod).subscribe({
      next: (periodDetails) => {
        this.wholeSizePrices = [
          ...(periodDetails.sizePrices?.filter(
            (item) => item.size.type === SizeTypeEnum.WHOLE
          ) || []),
        ];

        this.headlessSizePrices = [
          ...(periodDetails.sizePrices?.filter(
            (item) =>
              item.size.type !== SizeTypeEnum.WHOLE &&
              item.size.type !== SizeTypeEnum.RESIDUAL
          ) || []),
        ];

        this.residualSizePrices = [
          ...(periodDetails.sizePrices?.filter(
            (item) => item.size.type === SizeTypeEnum.RESIDUAL
          ) || []),
        ];

        const { date, time } = this.dateUtils.parseISODateTime(
          periodDetails.receivedDateTime
        );
        this.receivedDate = date;
        // this.receivedTime = time;

        this.fromDate = this.dateUtils.formatISOToDateInput(
          periodDetails.fromDate
        );
        this.toDate = this.dateUtils.formatISOToDateInput(periodDetails.toDate);
        // this.timeOfDay = periodDetails.timeOfDay;

        if (this.wholeTableComponent) {
          this.wholeTableComponent.disableForm();
        }

        if (this.headlessTableComponent) {
          this.headlessTableComponent.disableForm();
        }

        if (this.residualTableComponent) {
          this.residualTableComponent.disableForm();
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar periodo y precios:', err);
      },
    });
  }

  toggleAddPeriod() {
    this.isAdding = !this.isAdding;

    if (this.showCompany) this.selectedCompany = '';
    this.selectedYear = '';
    this.selectedPeriod = '';
    this.receivedDate = '';
    // this.receivedTime = '';
    this.fromDate = '';
    this.toDate = '';
    // this.timeOfDay = '';
    this.showErrors = false;
    this.showEditButton = false;

    this.resetFields();

    this.cdr.detectChanges();
  }

  toggleEditPeriod() {
    this.isEditing = false;

    this.showErrors = false;
    this.showEditButton = true;

    if (this.wholeTableComponent) {
      this.wholeTableComponent.disableForm();
    }

    if (this.headlessTableComponent) {
      this.headlessTableComponent.disableForm();
    }

    if (this.residualTableComponent) {
      this.residualTableComponent.disableForm();
    }

    this.cdr.detectChanges();
  }

  resetFields() {
    if (this.wholeTableComponent) {
      this.wholeTableComponent.clearValidationErrors();
      this.wholeTableComponent.form.reset();
      this.wholeTableComponent.enableForm();
    }

    if (this.headlessTableComponent) {
      this.headlessTableComponent.clearValidationErrors();
      this.headlessTableComponent.form.reset();
      this.headlessTableComponent.enableForm();
    }

    if (this.residualTableComponent) {
      this.residualTableComponent.clearValidationErrors();
      this.residualTableComponent.form.reset();
      this.residualTableComponent.enableForm();
    }

    this.fromDate = '';
    this.toDate = '';
    // this.timeOfDay = '';
    this.receivedDate = '';
    // this.receivedTime = '';

    this.isEditing = false;
    this.showEditButton = false;
  }

  editPeriod() {
    this.isEditing = true;

    if (this.wholeTableComponent) {
      this.wholeTableComponent.enableForm();
    }

    if (this.headlessTableComponent) {
      this.headlessTableComponent.enableForm();
    }
    if (this.residualTableComponent) {
      this.residualTableComponent.enableForm();
    }

    this.cdr.detectChanges();
  }

  cancelEditing() {
    this.isEditing = false;

    if (this.wholeTableComponent) {
      this.wholeTableComponent.disableForm();
    }

    if (this.headlessTableComponent) {
      this.headlessTableComponent.disableForm();
    }
    if (this.residualTableComponent) {
      this.residualTableComponent.disableForm();
    }

    this.search();
  }

  savePeriod() {
    const periodPayload: IUpdatePeriodModel = {
      receivedDateTime: this.dateUtils.toISODateTime(
        this.receivedDate,
        '0:00'
        // this.receivedTime
      ),
      fromDate: this.dateUtils.convertLocalDateToUTC(this.fromDate),
      toDate: this.dateUtils.convertLocalDateToUTC(this.toDate),
      // timeOfDay: this.timeOfDay as TimeOfDayEnum,
      sizePrices: [
        ...this.extractSizePrices(this.wholeTableComponent),
        ...this.extractSizePrices(this.headlessTableComponent),
        ...this.extractSizePrices(this.residualTableComponent),
      ],
    };

    if (this.selectedPeriod) {
      // ✅ Update existing period
      const updatePeriodSub = this.periodService
        .updatePaymentInfo(this.selectedPeriod, periodPayload)
        .subscribe({
          next: () => {
            this.alertService.showTranslatedAlert({ alertType: 'success' });
            this.toggleEditPeriod();
            this.onCompanyChange(); // <-- reload periods after update
          },
          error: () => {
            this.alertService.showTranslatedAlert({ alertType: 'error' });
          },
        });

      this.unsubscribe.push(updatePeriodSub);
    } else {
      // ✅ Create new period
      const createPeriodSub = this.periodService
        .createPeriod({
          name: `${this.periodNumber}/${this.selectedYear}`,
          company: this.selectedCompany,
          ...periodPayload,
        })
        .subscribe({
          next: () => {
            this.alertService.showTranslatedAlert({ alertType: 'success' });
            this.toggleAddPeriod();
            this.onCompanyChange(); // <-- reload periods after create
          },
          error: () => {
            this.alertService.showTranslatedAlert({ alertType: 'error' });
          },
        });

      this.unsubscribe.push(createPeriodSub);
    }
  }

  confirmSave() {
    this.isSearching = false;

    if (this.isEditing) {
      this.showErrors =
        !this.selectedCompany ||
        !this.selectedPeriod ||
        !this.receivedDate ||
        // !this.receivedTime ||
        // !this.timeOfDay ||
        !this.fromDate ||
        !this.toDate;
    } else {
      this.showErrors =
        !this.selectedCompany ||
        !this.selectedYear ||
        !this.periodNumber ||
        !this.receivedDate ||
        // !this.receivedTime ||
        // !this.timeOfDay ||
        !this.fromDate ||
        !this.toDate;
    }

    // ✅ Trigger form validation checks
    const hasErrors =
      this.wholeTableComponent?.form.invalid ||
      this.headlessTableComponent?.form.invalid ||
      this.residualTableComponent?.form.invalid;

    if (this.wholeTableComponent?.form.invalid) {
      this.wholeTableComponent.triggerValidation();
    }

    if (this.headlessTableComponent?.form.invalid) {
      this.headlessTableComponent.triggerValidation();
    }
    if (this.residualTableComponent?.form.invalid) {
      this.residualTableComponent.triggerValidation();
    }

    // ✅ Stop execution if any validation errors exist
    if (this.showErrors || hasErrors) return;

    this.alertService.confirm().then((result) => {
      if (result.isConfirmed) {
        this.savePeriod();
      }
    });
  }

  extractSizePrices(
    component:
      | WholeTableComponent
      | HeadlessTableComponent
      | ResidualTableComponent
  ): IUpdateSizePriceModel[] {
    if (!component?.sizes || !component.form) return [];

    return component.sizes.map((size) => {
      const controlKey = this.getSizeControlKey(size);
      return {
        sizeId: size.id,
        price: +component.form.value[controlKey] || 0, // Ensure conversion to number
      };
    });
  }

  /**
   * 👉 Validates numeric input (prevents invalid characters)
   */
  validateNumber(event: KeyboardEvent) {
    this.inputUtils.validateNumber(event); // ✅ Use utility function
  }

  private getSizeControlKey(size: IReadSizeModel): string {
    switch (size.type) {
      case SizeTypeEnum['TAIL-A']:
        return `cola-a-${size.id}`;
      case SizeTypeEnum['TAIL-A-']:
        return `cola-a--${size.id}`;
      case SizeTypeEnum['TAIL-B']:
        return `cola-b-${size.id}`;
      default:
        return size.id;
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
  }
}
