import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ILogisticsItemModel } from '../../interfaces/logistics-item.interface';
import {
  LogisticsFinanceCategoryEnum,
  LogisticsResourceCategoryEnum
} from '../../interfaces/logistics.interface';
import { InputUtilsService } from 'src/app/utils/input-utils.service';
import { FormUtilsService } from 'src/app/utils/form-utils.service';
import { debounceTime, Subject, Subscription } from 'rxjs';
import { PERMISSION_ROUTES } from '../../../../constants/routes.constants';

@Component({
  selector: 'app-logistics-items-listing',
  templateUrl: './logistics-items-listing.component.html',
  styleUrl: './logistics-items-listing.component.scss',
})
export class LogisticsItemsListingComponent implements OnInit {
  PERMISSION_ROUTE = PERMISSION_ROUTES.LOGISTICS.LOGISTICS_FORM;

  private _logisticsItems: ILogisticsItemModel[] = [];
  private formChangesSub: Subscription;

  @Input() title: string = '';
  @Input() logisticsItems: ILogisticsItemModel[] = [];

  @Output() logisticsItemsChange = new EventEmitter<ILogisticsItemModel[]>();

  // Finance and Resource category options
  financeCategories = Object.values(LogisticsFinanceCategoryEnum);
  resourceCategories = Object.values(LogisticsResourceCategoryEnum);

  // Table rows data
  tableRows: ILogisticsItemModel[] = [];
  total = 0;

  // Debounced emit changes
  private emitChangesSubject = new Subject<void>();
  private emitChangesSubscription: Subscription;

  get formArray(): any[] { // This getter is no longer needed but kept for compatibility
    return this.tableRows;
  }

  constructor(
    private inputUtils: InputUtilsService,
    private formUtils: FormUtilsService
  ) {}

  ngOnInit(): void {
    this.initializeTableRows();

    // Set up debounced emit changes
    this.emitChangesSubscription = this.emitChangesSubject
      .pipe(debounceTime(300))
      .subscribe(() => {
        const validItems = this.getValidLogisticsItems();
        this.logisticsItemsChange.emit(validItems);
      });
  }

  ngOnChanges(): void {
    if (this.logisticsItems) {
      this.initializeTableRows();
    }
  }

  private initializeTableRows(): void {
    this.tableRows = this.logisticsItems.length > 0
      ? [...this.logisticsItems]
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
      description: ''
    };
    this.tableRows.push(newRow);
    this.emitChanges();
  }

  removeRow(index: number): void {
    this.tableRows.splice(index, 1);
    this.calculateTotal();
    this.emitChanges();
  }

  updateRow(index: number, field: keyof ILogisticsItemModel, value: any): void {
    // Update the specific field
    (this.tableRows[index] as any)[field] = value;

    // Recalculate total for this row
    if (field === 'unit' || field === 'cost') {
      this.calculateRowTotal(index);
    }

    this.calculateTotal();
    this.emitChanges();
  }

  // Event handlers for template
  onFinanceCategoryChange(index: number, event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.updateRow(index, 'financeCategory', target.value);
    }
  }

  onResourceCategoryChange(index: number, event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.updateRow(index, 'resourceCategory', target.value);
    }
  }

  onDescriptionChange(index: number, value: string): void {
    this.updateRow(index, 'description', value);
  }

  onUnitChange(index: number, value: any): void {
    this.updateRow(index, 'unit', value);
  }

  onCostChange(index: number, value: string): void {
    this.updateRow(index, 'cost', value);
  }

  onCostBlurChange(index: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.onCostBlur(target.value, index);
    }
  }

  calculateRowTotal(index: number): void {
    const row = this.tableRows[index];
    row.total = (row.unit || 0) * (row.cost || 0);
  }

  calculateTotal(): void {
    this.total = this.tableRows.reduce((sum, row) => sum + (row.total || 0), 0);
  }

    getValidLogisticsItems(): ILogisticsItemModel[] {
    // Return all items that have categories selected, even if values are 0
    // This allows the parent component to see all rows and handle validation as needed
    const validItems = this.tableRows.filter(
      (item) => {
        const hasCategories = item.financeCategory && item.resourceCategory;
        return hasCategories;
      }
    );

    return validItems;
  }

  getCompleteLogisticsItems(): ILogisticsItemModel[] {
    // Return only items that are complete and ready for submission
    const completeItems = this.tableRows.filter(
      (item) => {
        const isComplete = Number(item.unit) > 0 &&
          Number(item.cost) > 0 &&
          Number(item.total) > 0 &&
          item.financeCategory &&
          item.resourceCategory;

        return isComplete;
      }
    );

    return completeItems;
  }

  validateNumber(event: KeyboardEvent) {
    this.inputUtils.validateNumber(event);
  }

  validateWholeNumber(event: KeyboardEvent) {
    this.inputUtils.validateWholeNumber(event);
  }

  onCostBlur(value: string, index: number): void {
    const numericValue = this.inputUtils.formatToDecimal(value);
    this.updateRow(index, 'cost', parseFloat(numericValue));
  }

  private emitChanges(): void {
    this.emitChangesSubject.next();
  }

  // Helper methods for template
  getFinanceCategoryLabel(category: LogisticsFinanceCategoryEnum): string {
    const labels = {
      [LogisticsFinanceCategoryEnum.INVOICE]: 'Factura',
      [LogisticsFinanceCategoryEnum.PETTY_CASH]: 'Caja Menor',
      [LogisticsFinanceCategoryEnum.OTHER]: 'Otro'
    };
    return labels[category] || category;
  }

  getResourceCategoryLabel(category: LogisticsResourceCategoryEnum): string {
    const labels = {
      [LogisticsResourceCategoryEnum.PERSONNEL]: 'Personal',
      [LogisticsResourceCategoryEnum.RESOURCES]: 'Recursos',
      [LogisticsResourceCategoryEnum.MATERIALS]: 'Materiales'
    };
    return labels[category] || category;
  }

  // Methods for grouping by finance category
  getFinanceCategoriesWithItems(): LogisticsFinanceCategoryEnum[] {
    const categories = new Set(this.tableRows.map(item => item.financeCategory));
    return Array.from(categories).sort();
  }

  getItemsByFinanceCategory(financeCategory: LogisticsFinanceCategoryEnum): ILogisticsItemModel[] {
    return this.tableRows.filter(item => item.financeCategory === financeCategory);
  }

  getFinanceCategorySubtotal(financeCategory: LogisticsFinanceCategoryEnum): number {
    return this.getItemsByFinanceCategory(financeCategory)
      .reduce((sum, item) => sum + (item.total || 0), 0);
  }

  getGlobalIndex(financeCategory: LogisticsFinanceCategoryEnum, localIndex: number): number {
    return this.tableRows.findIndex(item => {
      const categoryItems = this.getItemsByFinanceCategory(financeCategory);
      return item === categoryItems[localIndex];
    });
  }

  ngOnDestroy(): void {
    if (this.emitChangesSubscription) {
      this.emitChangesSubscription.unsubscribe();
    }
  }
}
