import { Injectable } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { InputUtilsService } from './input-utils.service';

@Injectable({
  providedIn: 'root', // ✅ Makes it available throughout the app
})
export class FormUtilsService {
  constructor(private inputUtilsService: InputUtilsService) {}

  /**
   * 👉 Ensures value is properly formatted to 2 decimal places.
   */
  formatControlToDecimal(control: AbstractControl): void {
    if (
      !control ||
      control.value === null ||
      control.value === undefined ||
      control.value === ''
    )
      return;

    // Convert and format the value to two decimal places
    const formattedValue = this.inputUtilsService.formatToDecimal(
      control.value
    );

    control.setValue(formattedValue, { emitEvent: false });
  }

  /**
   * 👉 Marks all form controls as touched to trigger validation messages.
   */
  triggerValidation(form: FormGroup): void {
    Object.keys(form.controls).forEach((key) => {
      form.controls[key].markAsTouched();
    });
  }

  /**
   * 👉 Clears all validation errors and resets form state.
   */
  clearValidationErrors(form: FormGroup): void {
    Object.keys(form.controls).forEach((key) => {
      form.controls[key].setErrors(null); // Clear validation errors
      form.controls[key].markAsPristine(); // Mark as pristine
      form.controls[key].markAsUntouched(); // Mark as untouched
    });
  }

  enableAllControls(form: FormGroup) {
    Object.values(form.controls).forEach((control) => control.enable());
  }

  disableAllControls(form: FormGroup) {
    Object.values(form.controls).forEach((control) => control.disable());
  }

}
