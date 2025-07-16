import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DateUtilsService {
  /**
   * Converts a local date string (`YYYY-MM-DD`) to a UTC ISO 8601 string (`YYYY-MM-DDTHH:mm:ss.sssZ`).
   * Ensures correct UTC conversion by accounting for the local time zone.
   *
   * @param localDateString - The date string in `YYYY-MM-DD` format (without time).
   * @returns The corresponding ISO 8601 UTC string.
   *
   * @example
   * ```typescript
   * convertLocalDateToUTC('2025-03-05'); // Returns "2025-03-05T05:00:00.000Z" (for Ecuador Time)
   * ```
   */
  convertLocalDateToUTC(localDateString: string): string {
    if (!localDateString) return '';

    // Convert local date (YYYY-MM-DD) to a Date object with time set to 00:00:00
    const localDate = new Date(localDateString + 'T00:00:00');

    // Convert to UTC and return ISO 8601 format
    return localDate.toISOString();
  }

  /**
   * Converts an ISO 8601 UTC date string (`YYYY-MM-DDTHH:mm:ss.sssZ`) to a local `YYYY-MM-DD` format.
   * This ensures correct date representation based on the user's time zone.
   *
   * @param isoDate - The ISO 8601 UTC date string.
   * @returns The extracted local date in `YYYY-MM-DD` format, or an empty string if input is invalid.
   *
   * @example
   * ```typescript
   * formatISOToDateInput('2025-03-05T22:30:00.000Z'); // Returns "2025-03-05" (in local time zone)
   * ```
   */
  formatISOToDateInput(isoDate: string | null): string {
    if (!isoDate) return '';

    // Convert the ISO date to a Date object (automatically adjusts to local time)
    const localDate = new Date(isoDate);

    // Extract local year, month, and day
    const year = localDate.getFullYear();
    const month = (localDate.getMonth() + 1).toString().padStart(2, '0'); // Ensure 2 digits
    const day = localDate.getDate().toString().padStart(2, '0'); // Ensure 2 digits

    return `${year}-${month}-${day}`; // Return as `YYYY-MM-DD`
  }

  /**
   * 👉 Converts an UTC ISO 8601 string into separate date & time values
   * @param isoString - The ISO string to be parsed (e.g., `2025-03-05T22:30:00.000Z`)
   * @returns `{ date: string, time: string }`
   */
  parseISODateTime(isoString: string): { date: string; time: string } {
    if (!isoString) return { date: '', time: '' };

    const localDate = new Date(isoString); // Convert ISO string to Date object

    // ✅ Extract LOCAL date in `YYYY-MM-DD` format for <input type="date">
    const year = localDate.getFullYear();
    const month = (localDate.getMonth() + 1).toString().padStart(2, '0'); // Ensure 2 digits
    const day = localDate.getDate().toString().padStart(2, '0'); // Ensure 2 digits
    const date = `${year}-${month}-${day}`;

    // ✅ Convert to LOCAL time
    const hours = localDate.getHours().toString().padStart(2, '0'); // Local hours
    const minutes = localDate.getMinutes().toString().padStart(2, '0'); // Local minutes
    const time = `${hours}:${minutes}`;

    return { date, time };
  }

  /**
   * 👉 Combines a selected date & time into an ISO 8601 string (UTC time)
   * @param date - Date in `YYYY-MM-DD` format
   * @param time - Time in `HH:mm` format
   * @returns `ISO 8601 string` in UTC format
   */
  toISODateTime(date: string, time: string): string {
    if (!date || !time) return '';

    // Convert date string (YYYY-MM-DD) to separate values
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    // ✅ Create a local date (interpreted as local time)
    const localDate = new Date(year, month - 1, day, hours, minutes, 0);

    return localDate.toISOString(); // ✅ Returns proper UTC format
  }
}
