import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
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
import { ICompanySaleWholeDetailModel } from '../../interfaces/company-sale-whole-detail.interface';

@Component({
  selector: 'app-company-sale-whole-detail',
  templateUrl: './company-sale-whole-detail.component.html',
  styleUrls: ['./company-sale-whole-detail.component.scss'],
})
export class CompanySaleWholeDetailComponent implements OnInit {
  @Input() wholeDetail: ICompanySaleWholeDetailModel | null = null;
  @Input() periodId: string;
  @Output() wholeDetailChange =
    new EventEmitter<ICompanySaleWholeDetailModel | null>();

  @ViewChild('wholeDetailsForm') wholeDetailsForm!: NgForm;

  isFormValid(): boolean {
    if (!this.wholeDetail) return true; // If no detail, it's valid (not required)
    if (!this.wholeDetailsForm) return true; // Form not yet initialized
    return !!this.wholeDetailsForm.valid && this.wholeDetail.items.length > 0;
  }

  wholeSizes: IReadSizeModel[] = [];
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

  loadSizes(): void {
    this.sizeService.getSizes(SizeTypeEnum.WHOLE).subscribe({
      next: (sizes) => {
        this.wholeSizes = sizes;
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
      },
      error: (err) => {
        console.error('Error loading period', err);
      },
    });
  }

  addDetail(): void {
    if (!this.wholeDetail) {
      this.wholeDetail = {
        batch: '',
        settleDate: '',
        predominantSize: '',
        totalWholePoundsProcessed: 0,
        totalTrashPounds: 0,
        averagePrice: 0,
        poundsGrandTotal: 0,
        grandTotal: 0,
        items: [],
      };
      this.emitChanges();
    }
  }

  cancelAndCollapse(): void {
    this.wholeDetail = null;
    this.emitChanges();
  }

  addItem(): void {
    if (this.wholeDetail) {
      this.wholeDetail.items.push({
        style: SaleStyleEnum.WHOLE,
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
    if (this.wholeDetail) {
      this.wholeDetail.items.splice(itemIndex, 1);
      this.recalculateTotals();
    }
  }

  recalculateTotals(): void {
    if (!this.wholeDetail) return;

    let totalAmount = 0;
    let totalDollars = 0;

    this.wholeDetail.items.forEach((item) => {
      item.total = Number((item.amount || 0) * (item.price || 0));
      totalAmount += Number(item.amount || 0);
      totalDollars += item.total || 0;
    });

    // Calculate percentages
    this.wholeDetail.items.forEach((item) => {
      item.percentage = totalDollars > 0 ? (item.total / totalDollars) * 100 : 0;
    });

    this.wholeDetail.poundsGrandTotal = Number(totalAmount.toFixed(2));
    this.wholeDetail.grandTotal = Number(totalDollars.toFixed(2));

    // Calculate average price
    if (totalAmount > 0) {
      this.wholeDetail.averagePrice = Number(
        (totalDollars / totalAmount).toFixed(2)
      );
    } else {
      this.wholeDetail.averagePrice = 0;
    }

    this.emitChanges();
  }

  onSizeChange(item: ICompanySaleItemModel, size: string): void {
    if (this.periodModel && this.periodModel.sizePrices) {
      const sizePrice = this.periodModel.sizePrices.find(
        (x) => x.size.size === size && x.size.type === SizeTypeEnum.WHOLE
      );
      if (sizePrice) {
        item.referencePrice = sizePrice.price;
      }
    }
    this.recalculateTotals();
  }

  validateNumber(event: KeyboardEvent) {
    this.inputUtils.validateNumber(event);
  }

  formatDecimal(controlName: string) {
    const control = this.wholeDetailsForm?.form?.get(controlName);
    if (control) {
      this.formUtils.formatControlToDecimal(control);
    }
  }

  onUnitChange(): void {
    this.emitChanges();
  }

  emitChanges(): void {
    if (this.wholeDetail) {
      const clonedDetail: ICompanySaleWholeDetailModel = {
        ...this.wholeDetail,
        items: [...this.wholeDetail.items],
      };
      this.wholeDetailChange.emit(clonedDetail);
    } else {
      this.wholeDetailChange.emit(null);
    }
  }

  // Get unique classes from items
  getUniqueClasses(): string[] {
    if (!this.wholeDetail || !this.wholeDetail.items) return [];
    const classes = this.wholeDetail.items
      .map(item => item.class)
      .filter(cls => cls && cls.trim() !== '');
    return [...new Set(classes)];
  }

  // Get items by class
  getItemsByClass(className: string): ICompanySaleItemModel[] {
    if (!this.wholeDetail || !this.wholeDetail.items) return [];
    return this.wholeDetail.items.filter(item => item.class === className);
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

    const percentage = this.wholeDetail && this.wholeDetail.grandTotal > 0
      ? (totalDollars / this.wholeDetail.grandTotal) * 100
      : 0;

    return {
      amount: Number(totalAmount.toFixed(2)),
      total: Number(totalDollars.toFixed(2)),
      percentage: Number(percentage.toFixed(2))
    };
  }

}
