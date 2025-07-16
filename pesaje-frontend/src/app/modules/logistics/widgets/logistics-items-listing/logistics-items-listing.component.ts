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
import { debounceTime, Subscription } from 'rxjs';

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
  @Input() hasDescription: boolean = false;
  @Input() logisticsCategories: ILogisticsCategoryModel[];

  @Input()
  set logisticsItems(value: ILogisticsItemModel[]) {
    this._logisticsItems = value ?? [];

    if (
      this.form &&
      this.formArray.length === this.logisticsCategories.length
    ) {
      this._logisticsItems.forEach((item) => {
        const index = this.logisticsCategories.findIndex(
          (cat) => cat.id === item.logisticsCategory.id
        );

        if (index > -1) {
          const group = this.formArray.at(index);
          group.patchValue(
            {
              unit: item.unit,
              cost: item.cost,
              total: item.unit && item.cost ? item.unit * item.cost : 0,
              description: item.description,
            },
            { emitEvent: false }
          );
        }
      });

      this.updateTotalPersonal();
    }
  }

  @Output() logisticsItemsChange = new EventEmitter<ILogisticsItemModel[]>();

  form: FormGroup;
  total = 0;

  get formArray(): FormArray {
    return this.form?.get('items') as FormArray;
  }

  constructor(
    private fb: FormBuilder,
    private inputUtils: InputUtilsService,
    private formUtils: FormUtilsService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

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

    const currentTotal = Number(group.get('total')?.value || 0);
    if (currentTotal !== total) {
      group.get('total')?.setValue(total, { emitEvent: false });
    }

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

  private initializeForm(): void {
    const formGroups = this.logisticsCategories.map((category) =>
      this.fb.group({
        categoryId: [category.id],
        unit: [null],
        cost: [null],
        total: [0],
        description: [''],
      })
    );

    this.form = this.fb.group({
      items: this.fb.array(formGroups),
    });

    this.subscribeToFormChanges();
  }

  private subscribeToFormChanges(): void {
    this.formChangesSub?.unsubscribe(); // unsubscribe if exists

    this.formChangesSub = this.form?.valueChanges
      .pipe(debounceTime(100))
      .subscribe(() => {
        const validItems = this.getValidLogisticsItems();
        this.logisticsItemsChange.emit(validItems);
      });
  }
}
