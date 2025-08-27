import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root', // ✅ Makes it available throughout the app
})
export class InputUtilsService {
  /**
   * 👉 Ensures value is properly formatted to 2 decimal places.
   */
  formatToDecimal(input: string | number): string {
    if (input === null || input === undefined || input === '') {
      return '0.00'; // Default value for empty inputs
    }

    const value = parseFloat(input.toString()); // Ensure conversion to number
    return !isNaN(value) ? value.toFixed(2) : '0.00';
  }

  /**
   * 👉 Validates numeric input (allows numbers & decimal points).
   */
  validateNumber(event: KeyboardEvent): void {
    const pattern = /^[0-9.]$/;
    const inputChar = event.key;

    // Prevent input if not a number or dot
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  /**
   * 👉 Validates numeric input (only whole numbers allowed).
   */
  validateWholeNumber(event: KeyboardEvent): void {
    const pattern = /^[0-9]$/;
    const inputChar = event.key;

    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  /**
   * 👉 Formats sheet number to 8 digits with leading zeros when input loses focus
   * @param event - The blur event from the input
   * @param modelProperty - The property in the model to update
   * @param model - The model object to update
   */
  formatSheetNumberOnBlur(
    event: Event,
    modelProperty: string,
    model: any
  ): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove non-digits

    if (value === '' || value === '0' || /^0+$/.test(value)) {
      // If empty, just zeros, or all zeros, keep the model undefined
      model[modelProperty] = undefined;
      input.value = '';
    } else {
      // Pad with leading zeros to make it 8 digits
      value = value.padStart(8, '0');
      // Update the model and input value
      model[modelProperty] = value;
      input.value = value;
    }
  }

  /**
   * 👉 Handles focus event to clear field if it's all zeros
   * @param event - The focus event from the input
   * @param modelProperty - The property in the model to update
   * @param model - The model object to update
   */
  onSheetNumberFocus(
    event: Event,
    modelProperty: string,
    model: any
  ): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // If the field contains only zeros, clear it for easy typing
    if (value === '00000000' || value === '') {
      model[modelProperty] = undefined;
      input.value = '';
    }
  }
}
