import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SizeService } from '../../../services/size.service';
import { Observable, Subscription } from 'rxjs';
import {
  IReadSizeModel,
  SizeTypeEnum,
} from '../../../interfaces/size.interface';
import { IReadSizePriceModel } from '../../../interfaces/size-price.interface';
import { FormUtilsService } from 'src/app/utils/form-utils.service';
import { InputUtilsService } from 'src/app/utils/input-utils.service';

@Component({
  selector: 'app-headless-table',
  templateUrl: './headless-table.component.html',
})
export class HeadlessTableComponent implements OnInit, OnChanges, OnDestroy {
  SizeTypeEnum = SizeTypeEnum;

  @Input() sizePrices: IReadSizePriceModel[] = [];

  isLoading$: Observable<boolean>;

  form: FormGroup;

  sizes: IReadSizeModel[] = [];
  headlessSizes: {
    size: string;
    idColaA: string;
    idColaA_: string;
    idColaB: string;
  }[] = [];

  private unsubscribe: Subscription[] = [];

  constructor(
    private sizeService: SizeService,
    private formUtils: FormUtilsService,
    private inputUtils: InputUtilsService
  ) {
    this.form = new FormGroup({});
    this.isLoading$ = this.sizeService.isLoading$;
  }

  ngOnInit(): void {
    this.loadSizes();
  }

  /**
   * 👉 Detects when `sizePrices` input changes and updates the form.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sizePrices'] && !changes['sizePrices'].firstChange) {
      this.updateFormControls();
    }
  }

  loadSizes(): void {
    const sizesSub = this.sizeService
      .getSizes(
        [
          SizeTypeEnum['TAIL-A'],
          SizeTypeEnum['TAIL-A-'],
          SizeTypeEnum['TAIL-B'],
        ].join(',')
      )
      .subscribe({
        next: (sizes) => {
          if (!sizes.length) return;

          // ✅ Extract unique sizes and map them efficiently
          const sizeMap = new Map<string, any>();

          sizes.forEach((size) => {
            const key = size.size;

            if (!sizeMap.has(key)) {
              sizeMap.set(key, {
                size: key,
                idColaA: '',
                idColaA_: '',
                idColaB: '',
              });
            }

            const entry = sizeMap.get(key);

            switch (size.type) {
              case SizeTypeEnum['TAIL-A']:
                entry.idColaA = size.id;
                break;
              case SizeTypeEnum['TAIL-A-']:
                entry.idColaA_ = size.id;
                break;
              case SizeTypeEnum['TAIL-B']:
                entry.idColaB = size.id;
                break;
            }
          });

          this.headlessSizes = Array.from(sizeMap.values());

          // ✅ Store unique sizes
          this.sizes = sizes;

          // ✅ Initialize form controls in one pass
          this.sizes.forEach(({ id, type }) => {
            let controlName: string | null = null;

            switch (type) {
              case SizeTypeEnum['TAIL-A']:
                controlName = `cola-a-${id}`;
                break;
              case SizeTypeEnum['TAIL-A-']:
                controlName = `cola-a--${id}`;
                break;
              case SizeTypeEnum['TAIL-B']:
                controlName = `cola-b-${id}`;
                break;
            }

            if (controlName) {
              this.form.addControl(
                controlName,
                new FormControl('', [
                  Validators.pattern(/^\d+(\.\d{1,2})?$/), // Allow only numbers with max 2 decimals
                ])
              );
            }
          });
        },
        error: (err) => {
          console.error('Error al cargar tallas', err);
        },
      });

    this.unsubscribe.push(sizesSub);
  }

  /**
   * 👉 Updates form controls dynamically when `sizePrices` changes.
   */
  updateFormControls(): void {
    if (!this.sizePrices?.length) return;

    // ✅ Preserve existing form and only update missing controls
    this.sizePrices.forEach(({ size, price }) => {
      switch (size.type) {
        case SizeTypeEnum['TAIL-A']:
          this.ensureFormControlExists(`cola-a-${size.id}`, price);
          break;
        case SizeTypeEnum['TAIL-A-']:
          this.ensureFormControlExists(`cola-a--${size.id}`, price);
          break;
        case SizeTypeEnum['TAIL-B']:
          this.ensureFormControlExists(`cola-b-${size.id}`, price);
          break;
      }
    });

    // ✅ Mark controls as touched and force validation recheck
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();
  }

  /**
   * 👉 Formats price input value
   */
  formatPrice(id: string) {
    const control = this.form.get(id);
    if (control) {
      this.formUtils.formatControlToDecimal(control); // ✅ Use utility function
    }
  }

  /**
   * 👉 Validates numeric input (prevents invalid characters)
   */
  validateNumber(event: KeyboardEvent) {
    this.inputUtils.validateNumber(event); // ✅ Use utility function
  }

  /**
   * 👉 Triggers validation messages for all inputs
   */
  triggerValidation() {
    this.formUtils.triggerValidation(this.form); // ✅ Use utility function
  }

  /**
   * 👉 Clears validation errors and resets form state
   */
  clearValidationErrors() {
    this.formUtils.clearValidationErrors(this.form); // ✅ Use utility function
  }

  /**
   * 👉 Ensures a form control exists and updates its value.
   */
  private ensureFormControlExists(controlName: string, value: number): void {
    if (!this.form.controls[controlName]) {
      this.form.addControl(
        controlName,
        new FormControl(value || '', [
          Validators.required,
          Validators.pattern(/^\d+(\.\d{1,2})?$/), // Allow only numbers with max 2 decimals
        ])
      );
    } else {
      this.form.controls[controlName].setValue(value || '');
    }
  }

  /**
   * 👉 Disables all form controls (used when loading period data)
   */
  disableForm() {
    this.formUtils.disableAllControls(this.form);
  }

  /**
   * 👉 Enables all form controls (used when adding a new period)
   */
  enableForm() {
    this.formUtils.enableAllControls(this.form);
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
  }
}
