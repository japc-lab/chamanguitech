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
}
