import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ILocalSaleDetailModel } from '../../interfaces/local-sale-detail.interface';
import { SaleStyleEnum } from '../../interfaces/sale.interface';
import { InputUtilsService } from 'src/app/utils/input-utils.service';
import { NgModel } from '@angular/forms';

@Component({
  selector: 'app-local-sale-details',
  templateUrl: './local-sale-details.component.html',
  styleUrls: ['./local-sale-details.component.scss'],
})
export class LocalSaleDetailsComponent implements OnInit {
  @Input() style: SaleStyleEnum;
  @Input() localSaleDetails: ILocalSaleDetailModel[] = [];
  @Output() localSaleDetailsChange = new EventEmitter<
    ILocalSaleDetailModel[]
  >();

  title = '';
  sizePlaceholder = '';

  constructor(private inputUtils: InputUtilsService) {}

  ngOnInit(): void {
    if (this.style === SaleStyleEnum.WHOLE) {
      this.title = 'Con Cabeza';
      this.sizePlaceholder = '20/30';
    } else {
      this.title = 'Sin Cabeza';
      this.sizePlaceholder = '36/41';
    }

    this.recalculateAll();
  }

  addDetail(): void {
    this.localSaleDetails.push({
      style: this.style,
      merchat: `Comerciante ${this.localSaleDetails.length + 1}`,
      grandTotal: 0,
      poundsGrandTotal: 0,
      items: [],
    });
    this.emitChanges();
  }

  removeDetail(index: number): void {
    this.localSaleDetails.splice(index, 1);
    this.emitChanges();
  }

  addItem(detailIndex: number): void {
    this.localSaleDetails[detailIndex].items.push({
      size: '',
      pounds: 0,
      price: 0,
      total: 0,
    });
    this.recalculateTotals(this.localSaleDetails[detailIndex]);
  }

  removeItem(detailIndex: number, itemIndex: number): void {
    this.localSaleDetails[detailIndex].items.splice(itemIndex, 1);
    this.recalculateTotals(this.localSaleDetails[detailIndex]);
  }

  recalculateTotals(detail: ILocalSaleDetailModel): void {
    let total = 0;
    let pounds = 0;

    detail.items.forEach((item) => {
      item.total = Number((item.pounds || 0) * (item.price || 0));
      pounds += item.pounds || 0;
      total += item.total || 0;
    });

    // Ensure two decimals
    detail.grandTotal = Number(total.toFixed(2));
    detail.poundsGrandTotal = Number(pounds.toFixed(2));

    this.emitChanges();
  }

  recalculateAll(): void {
    this.localSaleDetails.forEach((detail) => this.recalculateTotals(detail));
  }

  validateNumber(event: KeyboardEvent) {
    this.inputUtils.validateNumber(event);
  }

  formatDecimal(control: NgModel) {
    if (!control || control.value == null) return;

    const value = parseFloat(control.value).toFixed(2);
    control.control.setValue(Number(value), { emitEvent: false });
  }

  validateSizeFormat(event: KeyboardEvent): void {
    const allowedPattern = /^[0-9\/]*$/;
    const inputChar = event.key;

    if (!allowedPattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  emitChanges(): void {
    this.localSaleDetailsChange.emit(this.localSaleDetails);
  }
}
