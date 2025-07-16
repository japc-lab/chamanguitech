import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
} from '@angular/forms';
import { PERMISSION_ROUTES } from '../../../../constants/routes.constants';
import { ILogisticsCategoryModel } from '../../../shared/interfaces/logistic-type.interface';
import { ILogisticsItemModel } from '../../interfaces/logistics-item.interface';
import { InputUtilsService } from 'src/app/utils/input-utils.service';
import { FormUtilsService } from 'src/app/utils/form-utils.service';

@Component({
  selector: 'app-logistics-items-listing',
  templateUrl: './logistics-items-listing.component.html',
  styleUrl: './logistics-items-listing.component.scss',
})
export class LogisticsItemsListingComponent implements OnInit {
  PERMISSION_ROUTE = PERMISSION_ROUTES.LOGISTICS.LOGISTICS_FORM;

  private _logisticsCategories: ILogisticsCategoryModel[] = [];
  private _logisticsItems: ILogisticsItemModel[] = [];

  @Input() title: string = '';
  @Input() hasDescription = false;

  @Input()
  set logisticsCategories(value: ILogisticsCategoryModel[]) {
    this._logisticsCategories = (value ?? []).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  @Input()
  set logisticsItems(value: ILogisticsItemModel[]) {
    this._logisticsItems = value ?? [];
    this.buildFormFromItemsAndCategories();
  }

  @Output() logisticsItemsChange = new EventEmitter<ILogisticsItemModel[]>();

  form: FormGroup;
  total = 0;

  get logisticsCategories(): ILogisticsCategoryModel[] {
    return this._logisticsCategories;
  }

  get formArray(): FormArray {
    return this.form?.get('items') as FormArray;
  }

  constructor(
    private fb: FormBuilder,
    private inputUtils: InputUtilsService,
    private formUtils: FormUtilsService
  ) {}

  ngOnInit(): void {}

  createItemFormGroup(categoryId: string): FormGroup {
    return this.fb.group({
      categoryId: [categoryId],
      unit: [null],
      cost: [null],
      total: [0], // Keep total as 0 for calculation purposes
      description: [''],
    });
  }

  calculateTotal(index: number): void {
    const group = this.formArray.at(index);
    const unit = Number(group.get('unit')?.value || 0);
    const cost = Number(group.get('cost')?.value || 0);
    const total = unit * cost;

    group.get('total')?.setValue(total, { emitEvent: false });
    this.updateTotalPersonal();
  }

  updateTotalPersonal(): void {
    this.total = this.formArray.controls.reduce((sum, group) => {
      return sum + (Number(group.get('total')?.value) || 0);
    }, 0);
  }

  getValidLogisticsItems(): ILogisticsItemModel[] {
    return this.formArray.controls
      .map((group, index) => ({
        logisticsCategory: this.logisticsCategories[index],
        unit: group.get('unit')?.value,
        cost: group.get('cost')?.value,
        total: group.get('total')?.value,
        description: group.get('description')?.value,
      }))
      .filter(
        (item) =>
          Number(item.unit) > 0 &&
          Number(item.cost) > 0 &&
          Number(item.total) > 0
      );
  }

  validateNumber(event: KeyboardEvent) {
    this.inputUtils.validateNumber(event);
  }

  validateWholeNumber(event: KeyboardEvent) {
    this.inputUtils.validateWholeNumber(event);
  }

  onCostBlur(index: number, control: AbstractControl | null) {
    if (control) {
      this.formUtils.formatControlToDecimal(control);
      this.calculateTotal(index);
    }
  }

  emitCurrentValidItems(): void {
    if (!this.form || !this.form.valid) return;

    const validItems = this.getValidLogisticsItems();
    this.logisticsItemsChange.emit(validItems);
  }

  private buildFormFromItemsAndCategories(): void {
    const formGroups = this._logisticsCategories.map((category) => {
      const matchedItem = this._logisticsItems.find(
        (item) => item.logisticsCategory.id === category.id
      );

      const unit = matchedItem?.unit ?? null;
      const cost = matchedItem?.cost ?? null;
      const total = unit && cost ? unit * cost : 0;

      return this.fb.group({
        categoryId: [category.id],
        unit: [unit],
        cost: [cost],
        total: [total],
        description: [matchedItem?.description ?? ''],
      });
    });

    this.form = this.fb.group({
      items: this.fb.array(formGroups),
    });

    this.formArray.controls.forEach((_, i) => this.calculateTotal(i));

    this.updateTotalPersonal();
  }
}
