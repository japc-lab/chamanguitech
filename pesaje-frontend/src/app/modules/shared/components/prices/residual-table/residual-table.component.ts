import { Component, Input, SimpleChanges } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { FormUtilsService } from 'src/app/utils/form-utils.service';
import { InputUtilsService } from 'src/app/utils/input-utils.service';
import { IReadSizePriceModel } from '../../../interfaces/size-price.interface';
import { IReadSizeModel, SizeTypeEnum } from '../../../interfaces/size.interface';
import { SizeService } from '../../../services/size.service';

@Component({
  selector: 'app-residual-table',
  templateUrl: './residual-table.component.html'
})
export class ResidualTableComponent {
 @Input() sizePrices: IReadSizePriceModel[] = [];

  isLoading$: Observable<boolean>;

  form: FormGroup;

  sizes: IReadSizeModel[] = [];

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
    const sizesSub = this.sizeService.getSizes(SizeTypeEnum.RESIDUAL).subscribe({
      next: (sizes) => {
        this.sizes = sizes;

        this.sizes.forEach((size) => {
          // Add form controls with validation
          this.form.addControl(
            size.id,
            new FormControl('', [
              Validators.pattern(/^\d+(\.\d{1,2})?$/), // Allow only numbers with max 2 decimals
            ])
          );
        });
      },
      error: (err) => {
        console.error('Error al cargar tallas', err);
      },
    });

    this.unsubscribe.push(sizesSub);
  }

  /**
   * 👉 Updates form controls based on `sizePrices` changes.
   */
  updateFormControls(): void {
    if (!this.sizePrices?.length) return;

    this.sizePrices.forEach(({ size, price }) => {
      const control = this.form.get(size.id);

      if (control) {
        control.setValue(price || '');
      } else {
        this.form.addControl(
          size.id,
          new FormControl(price || '', [
            Validators.required,
            Validators.pattern(/^\d+(\.\d{1,2})?$/),
          ])
        );
      }
    });

    // ✅ Remove obsolete controls (cleanup)
    Object.keys(this.form.controls).forEach((key) => {
      if (!this.sizePrices.some(({ size }) => size.id === key)) {
        this.form.removeControl(key);
      }
    });
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