import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { ICompanySaleItemModel } from '../../interfaces/company-sale-item.interface';
import { InputUtilsService } from 'src/app/utils/input-utils.service';
import { FormUtilsService } from 'src/app/utils/form-utils.service';
import { SaleStyleEnum } from '../../interfaces/sale.interface';
import { SizeService } from 'src/app/modules/shared/services/size.service';
import { PeriodService } from 'src/app/modules/shared/services/period.service';
import {
  IReadSizeModel,
  SizeTypeEnum,
} from 'src/app/modules/shared/interfaces/size.interface';
import { IReadPeriodModel } from 'src/app/modules/shared/interfaces/period.interface';
import { ICompanySaleTailDetailModel } from '../../interfaces/company-sale-tail-detail.interface';

@Component({
    selector: 'app-company-sale-tail-detail',
    templateUrl: './company-sale-tail-detail.component.html',
    styleUrls: ['./company-sale-tail-detail.component.scss'],
    standalone: false
})
export class CompanySaleTailDetailComponent implements OnInit, OnChanges {
  @Input() tailDetail: ICompanySaleTailDetailModel | null = null;
  @Input() periodId: string;
  @Output() tailDetailChange =
    new EventEmitter<ICompanySaleTailDetailModel | null>();

  @ViewChild('tailDetailsForm') tailDetailsForm!: NgForm;

  isFormValid(): boolean {
    if (!this.tailDetail) return true; // If no detail, it's valid (not required)
    if (!this.tailDetailsForm) return true; // Form not yet initialized
    return !!this.tailDetailsForm.valid && this.tailDetail.items.length > 0;
  }

  tailSizes: IReadSizeModel[] = [];
  shrimpClassList: { type: string; label: string }[] = [];
  periodModel: IReadPeriodModel;

  constructor(
    private inputUtils: InputUtilsService,
    private formUtils: FormUtilsService,
    private sizeService: SizeService,
    private periodService: PeriodService
  ) {}

  ngOnInit(): void {
    this.loadSizes();
    if (this.periodId) {
      this.loadPeriod();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['periodId'] && !changes['periodId'].firstChange && this.periodId) {
      this.loadPeriod();
    }
  }

  loadSizes(): void {
    this.sizeService
      .getSizes(
        [
          SizeTypeEnum['TAIL-A'],
          SizeTypeEnum['TAIL-A-'],
          SizeTypeEnum['TAIL-B'],
        ].join(',')
      )
      .subscribe({
        next: (sizes) => {
          this.tailSizes = sizes;
          const uniqueTypes = new Set(this.tailSizes.map((s) => s.type));
          this.shrimpClassList = Array.from(uniqueTypes).map((type) => ({
            type,
            label: type.replace('TAIL-', ''),
          }));
        },
        error: (err) => {
          console.error('Error loading sizes', err);
        },
      });
  }

  loadPeriod(): void {
    this.periodService.getPeriodById(this.periodId).subscribe({
      next: (period) => {
        this.periodModel = period;
        // Populate referencePrice for existing items when period loads
        this.populateReferencePricesForExistingItems();
      },
      error: (err) => {
        console.error('Error loading period', err);
      },
    });
  }

  addDetail(): void {
    if (!this.tailDetail) {
      this.tailDetail = {
        batch: '',
        settleDate: '',
        predominantSize: '',
        receivedPoundsReported: 0,
        totalTailPoundsProcessed: 0,
        performancePercentageTailPounts: 0,
        poundsGrandTotal: 0,
        grandTotal: 0,
        items: [],
      };
      this.emitChanges();
    }
  }

  cancelAndCollapse(): void {
    this.tailDetail = null;
    this.emitChanges();
  }

  addItem(): void {
    if (this.tailDetail) {
      this.tailDetail.items.push({
        style: SaleStyleEnum.TAIL,
        class: '',
        size: '',
        unit: 'lb',
        amount: 0,
        price: 0,
        referencePrice: 0,
        total: 0,
        percentage: 0,
      });
      this.recalculateTotals();
    }
  }

  removeItem(itemIndex: number): void {
    if (this.tailDetail) {
      this.tailDetail.items.splice(itemIndex, 1);
      this.recalculateTotals();
    }
  }

  recalculateTotals(): void {
    if (!this.tailDetail) return;

    let totalAmount = 0;
    let totalDollars = 0;

    this.tailDetail.items.forEach((item) => {
      item.total = Number((item.amount || 0) * (item.price || 0));
      totalAmount += Number(item.amount || 0);
      totalDollars += item.total || 0;
    });

    // Calculate percentages
    this.tailDetail.items.forEach((item) => {
      item.percentage = totalDollars > 0 ? (item.total / totalDollars) * 100 : 0;
    });

    this.tailDetail.poundsGrandTotal = Number(totalAmount.toFixed(2));
    this.tailDetail.grandTotal = Number(totalDollars.toFixed(2));

    this.emitChanges();
  }

  onClassChange(item: ICompanySaleItemModel): void {
    const previousSize = item.size;
    item.size = '';
    item.referencePrice = 0;
    
    // If size was already selected, try to populate referencePrice after class is set
    // Note: size is cleared above, so we need to check if we should restore it
    // For now, we'll just clear it and let user select size again
    this.recalculateTotals();
  }

  onSizeChange(item: ICompanySaleItemModel, size: string): void {
    this.populateReferencePrice(item, size);
    this.recalculateTotals();
  }

  populateReferencePrice(item: ICompanySaleItemModel, size: string): void {
    if (this.periodModel && this.periodModel.sizePrices && item.class && size) {
      const sizePrice = this.periodModel.sizePrices.find(
        (x) => x.size.size === size && x.size.type === item.class
      );
      if (sizePrice) {
        item.referencePrice = sizePrice.price;
      } else {
        item.referencePrice = 0;
      }
    } else {
      item.referencePrice = 0;
    }
  }

  populateReferencePricesForExistingItems(): void {
    if (!this.tailDetail || !this.tailDetail.items || !this.periodModel || !this.periodModel.sizePrices) {
      return;
    }

    this.tailDetail.items.forEach((item) => {
      if (item.size && item.class) {
        this.populateReferencePrice(item, item.size);
      }
    });
    this.emitChanges();
  }

  getSizesForClass(classType: string): IReadSizeModel[] {
    return this.tailSizes.filter((size) => size.type === classType);
  }

  validateNumber(event: KeyboardEvent) {
    this.inputUtils.validateNumber(event);
  }

  formatDecimal(controlName: string) {
    const control = this.tailDetailsForm?.form?.get(controlName);
    if (control) {
      this.formUtils.formatControlToDecimal(control);
    }
  }

  emitChanges(): void {
    this.tailDetailChange.emit(this.tailDetail);
  }

  // Get unique classes from items
  getUniqueClasses(): string[] {
    if (!this.tailDetail || !this.tailDetail.items) return [];
    const classes = this.tailDetail.items
      .map(item => item.class)
      .filter(cls => cls && cls.trim() !== '');
    return [...new Set(classes)];
  }

  // Get items by class
  getItemsByClass(className: string): ICompanySaleItemModel[] {
    if (!this.tailDetail || !this.tailDetail.items) return [];
    return this.tailDetail.items.filter(item => item.class === className);
  }

  // Calculate subtotal for a specific class
  getClassSubtotal(className: string): { amount: number, total: number, percentage: number } {
    const classItems = this.getItemsByClass(className);
    let totalAmount = 0;
    let totalDollars = 0;

    classItems.forEach(item => {
      totalAmount += Number(item.amount || 0);
      totalDollars += Number(item.total || 0);
    });

    const percentage = this.tailDetail && this.tailDetail.grandTotal > 0
      ? (totalDollars / this.tailDetail.grandTotal) * 100
      : 0;

    return {
      amount: Number(totalAmount.toFixed(2)),
      total: Number(totalDollars.toFixed(2)),
      percentage: Number(percentage.toFixed(2))
    };
  }

  // Get the display label for a class type
  getClassLabel(className: string): string {
    const classItem = this.shrimpClassList.find(item => item.type === className);
    return classItem ? classItem.label : className;
  }
}

