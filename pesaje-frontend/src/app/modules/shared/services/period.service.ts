import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  ICreatePeriodModel,
  IReadPeriodModel,
  IUpdatePeriodModel,
} from '../interfaces/period.interface';
import { IUpdateSizePriceModel } from '../interfaces/size-price.interface';

const API_PERIOD_URL = `${environment.apiUrl}/period`;

@Injectable({
  providedIn: 'root',
})
export class PeriodService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  createPeriod(
    periodPayload: ICreatePeriodModel
  ): Observable<{ message: string }> {
    this.isLoadingSubject.next(true);
    return this.http
      .post<{ message: string }>(`${API_PERIOD_URL}`, periodPayload)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }

  getPeriodsByCompany(companyId: string): Observable<IReadPeriodModel[]> {
    this.isLoadingSubject.next(true);
    return this.http
      .get<{ data: IReadPeriodModel[] }>(
        `${API_PERIOD_URL}/all/by-company?companyId=${companyId}`
      )
      .pipe(
        map((response) => response.data), // ✅ Extract array from response
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getPeriodById(id: string): Observable<IReadPeriodModel> {
    this.isLoadingSubject.next(true);
    return this.http
      .get<{ data: IReadPeriodModel }>(`${API_PERIOD_URL}/${id}`)
      .pipe(
        map((response) => response.data), // ✅ Extract array from response
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getDistinctPeriodNames(): Observable<string[]> {
    this.isLoadingSubject.next(true);
    return this.http
      .get<{ data: string[] }>(`${API_PERIOD_URL}/distinct-names`)
      .pipe(
        map((response) => response.data), // ✅ Extract array from response
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getPeriodByName(periodName: string): Observable<string[]> {
    this.isLoadingSubject.next(true);
    return this.http
      .get<{ data: string[] }>(
        `${API_PERIOD_URL}/prices/by-period-name?periodName=${periodName}`
      )
      .pipe(
        map((response) => response.data), // ✅ Extract array from response
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  updatePaymentInfo(
    id: string,
    updateData: IUpdatePeriodModel
  ): Observable<IReadPeriodModel> {
    this.isLoadingSubject.next(true);
    return this.http
      .put<{ data: IReadPeriodModel }>(`${API_PERIOD_URL}/${id}`, updateData)
      .pipe(
        map((response) => response.data), // ✅ Extract object from response
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  // deletePaymentInfo(id: string): Observable<{ message: string }> {
  //   this.isLoadingSubject.next(true);
  //   return this.http
  //     .delete<{ message: string }>(`${API_PAYMENT_INFO_URL}/${id}`)
  //     .pipe(finalize(() => this.isLoadingSubject.next(false)));
  // }
}
