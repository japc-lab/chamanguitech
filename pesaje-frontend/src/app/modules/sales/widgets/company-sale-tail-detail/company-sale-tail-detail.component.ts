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
import { ICompanySaleTailDetailModel } from '../../interfaces/company-sale-tail-detail.interface';

@Component({
  selector: 'app-company-sale-tail-detail',
  templateUrl: './company-sale-tail-detail.component.html',
  styleUrls: ['./company-sale-tail-detail.component.scss'],
})
export class CompanySaleTailDetailComponent implements OnInit {
  @Input() tailDetail: ICompanySaleTailDetailModel | null = null;
  @Input() periodId: string;
  @Output() tailDetailChange =
    new EventEmitter<ICompanySaleTailDetailModel | null>();

  @ViewChild('tailDetailsForm') tailDetailsForm!: NgForm;

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
        pounds: 0,
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

    let totalPounds = 0;
    let totalAmount = 0;

    this.tailDetail.items.forEach((item) => {
      item.total = Number((item.pounds || 0) * (item.price || 0));
      totalPounds += Number(item.pounds || 0);
      totalAmount += item.total || 0;
    });

    // Calculate percentages
    this.tailDetail.items.forEach((item) => {
      item.percentage = totalAmount > 0 ? (item.total / totalAmount) * 100 : 0;
    });

    this.tailDetail.poundsGrandTotal = Number(totalPounds.toFixed(2));
    this.tailDetail.grandTotal = Number(totalAmount.toFixed(2));

    // Calculate performance percentage
    if (this.tailDetail.receivedPoundsReported > 0) {
      this.tailDetail.performancePercentageTailPounts = Number(
        ((totalPounds / this.tailDetail.receivedPoundsReported) * 100).toFixed(2)
      );
    } else {
      this.tailDetail.performancePercentageTailPounts = 0;
    }

    this.emitChanges();
  }

  onClassChange(item: ICompanySaleItemModel): void {
    item.size = '';
    item.referencePrice = 0;
    this.recalculateTotals();
  }

  onSizeChange(item: ICompanySaleItemModel, size: string): void {
    if (this.periodModel && this.periodModel.sizePrices && item.class) {
      const sizePrice = this.periodModel.sizePrices.find(
        (x) => x.size.size === size && x.size.type === item.class
      );
      if (sizePrice) {
        item.referencePrice = sizePrice.price;
      }
    }
    this.recalculateTotals();
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
}

