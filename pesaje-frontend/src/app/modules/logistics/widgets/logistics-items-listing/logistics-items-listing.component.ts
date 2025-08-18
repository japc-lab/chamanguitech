import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { ILogisticsItemModel } from '../../interfaces/logistics-item.interface';
import {
  LogisticsFinanceCategoryEnum,
  LogisticsResourceCategoryEnum,
} from '../../interfaces/logistics.interface';
import { InputUtilsService } from 'src/app/utils/input-utils.service';
import { NgModel } from '@angular/forms';

@Component({
  selector: 'app-logistics-items-listing',
  templateUrl: './logistics-items-listing.component.html',
  styleUrl: './logistics-items-listing.component.scss',
})
export class LogisticsItemsListingComponent implements OnInit, OnChanges {
  @Input() title: string = 'Detalles de Logística';
  @Input() logisticsItems: ILogisticsItemModel[] = [];
  @Output() logisticsItemsChange = new EventEmitter<ILogisticsItemModel[]>();

  // Finance and Resource category options
  financeCategories = Object.values(LogisticsFinanceCategoryEnum);
  resourceCategories = Object.values(LogisticsResourceCategoryEnum);

  // Table rows data
  tableRows: ILogisticsItemModel[] = [];
  total = 0;

  constructor(private inputUtils: InputUtilsService) {}

  ngOnInit(): void {
    this.initializeTableRows();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['logisticsItems'] && this.logisticsItems) {
      // Only reinitialize if we have items and our table is empty
      // This prevents re-rendering when user is actively editing
      if (this.logisticsItems.length > 0 && this.tableRows.length === 0) {
        this.initializeTableRows();
      }
    }
  }

  private initializeTableRows(): void {
    this.tableRows =
      this.logisticsItems.length > 0
        ? this.logisticsItems.map((item) => ({
            financeCategory:
              item.financeCategory || LogisticsFinanceCategoryEnum.INVOICE,
            resourceCategory:
              item.resourceCategory || LogisticsResourceCategoryEnum.PERSONNEL,
            unit: item.unit || 0,
            cost: item.cost || 0,
            total: item.total || 0,
            description: item.description || '',
          }))
        : [];
    this.calculateTotal();
  }

  addRow(): void {
    const newRow: ILogisticsItemModel = {
      financeCategory: LogisticsFinanceCategoryEnum.INVOICE,
      resourceCategory: LogisticsResourceCategoryEnum.PERSONNEL,
      unit: 0,
      cost: 0,
      total: 0,
      description: '',
    };
    this.tableRows.push(newRow);
    this.emitChanges();
  }

  removeRow(row: ILogisticsItemModel): void {
    const index = this.tableRows.indexOf(row);
    if (index > -1) {
      this.tableRows.splice(index, 1);
      this.calculateTotal();
      this.emitChanges();
    }
  }

  // Event handlers for template
  onFinanceCategoryChange(row: ILogisticsItemModel, value: string): void {
    row.financeCategory = value as LogisticsFinanceCategoryEnum;
    this.calculateTotal();
    this.emitChanges();
  }

  onResourceCategoryChange(row: ILogisticsItemModel, value: string): void {
    row.resourceCategory = value as LogisticsResourceCategoryEnum;
    this.emitChanges();
  }

  onDescriptionChange(row: ILogisticsItemModel, value: string): void {
    row.description = value;
    this.emitChanges();
  }

  onUnitChange(row: ILogisticsItemModel, value: any): void {
    row.unit = Number(value);
    this.calculateRowTotal(row);
    this.calculateTotal();
    this.emitChanges();
  }

  onCostChange(row: ILogisticsItemModel, value: any): void {
    row.cost = value;
    this.calculateRowTotal(row);
    this.calculateTotal();
    this.emitChanges();
  }

  calculateRowTotal(row: ILogisticsItemModel): void {
    row.total = (row.unit || 0) * (row.cost || 0);
  }

  calculateTotal(): void {
    this.total = this.tableRows.reduce((sum, row) => sum + (row.total || 0), 0);
  }

  getValidLogisticsItems(): ILogisticsItemModel[] {
    const validItems = this.tableRows.filter((item) => {
      const hasCategories = item.financeCategory && item.resourceCategory;
      return hasCategories;
    });
    return validItems;
  }

  getCompleteLogisticsItems(): ILogisticsItemModel[] {
    const completeItems = this.tableRows.filter((item) => {
      const isComplete =
        Number(item.unit) > 0 &&
        Number(item.cost) > 0 &&
        Number(item.total) > 0 &&
        item.financeCategory &&
        item.resourceCategory;
      return isComplete;
    });
    return completeItems;
  }

  validateNumber(event: KeyboardEvent) {
    this.inputUtils.validateNumber(event);
  }

  validateWholeNumber(event: KeyboardEvent) {
    this.inputUtils.validateWholeNumber(event);
  }

  formatDecimal(control: NgModel) {
    if (!control || control.value == null) return;

    const value = parseFloat(control.value).toFixed(2);
    control.control.setValue(Number(value), { emitEvent: false });
  }

  emitChanges(): void {
    const validItems = this.getValidLogisticsItems();
    this.logisticsItemsChange.emit(validItems);
  }

  // Helper methods for template
  getFinanceCategoryLabel(category: LogisticsFinanceCategoryEnum): string {
    const labels = {
      [LogisticsFinanceCategoryEnum.INVOICE]: 'Factura',
      [LogisticsFinanceCategoryEnum.PETTY_CASH]: 'Caja Menor',
      [LogisticsFinanceCategoryEnum.ADDITIONAL]: 'Adicional',
    };
    return labels[category] || category;
  }

  getResourceCategoryLabel(category: LogisticsResourceCategoryEnum): string {
    const labels = {
      [LogisticsResourceCategoryEnum.PERSONNEL]: 'Personal',
      [LogisticsResourceCategoryEnum.RESOURCES]: 'Recursos',
      [LogisticsResourceCategoryEnum.MATERIALS]: 'Materiales',
    };
    return labels[category] || category;
  }

  // Methods for grouping by finance category
  getFinanceCategoriesWithItems(): LogisticsFinanceCategoryEnum[] {
    const categories = new Set(
      this.tableRows.map((item) => item.financeCategory)
    );
    return Array.from(categories).sort();
  }

  getItemsByFinanceCategory(
    financeCategory: LogisticsFinanceCategoryEnum
  ): ILogisticsItemModel[] {
    return this.tableRows.filter(
      (item) => item.financeCategory === financeCategory
    );
  }

  getFinanceCategorySubtotal(
    financeCategory: LogisticsFinanceCategoryEnum
  ): number {
    return this.getItemsByFinanceCategory(financeCategory).reduce(
      (sum, item) => sum + (item.total || 0),
      0
    );
  }
}
