import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ICompanySalePaymentModel,
  ICreateUpdateCompanySalePaymentModel,
  IReadCompanySalePaymentModel,
} from '../interfaces/company-sale-payment.interface';

const API_PAYMENT_URL = `${environment.apiUrl}/company-sale-payment-method`;

@Injectable({
  providedIn: 'root',
})
export class CompanySalePaymentService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  createCompanySalePayment(
    paymentData: Partial<ICreateUpdateCompanySalePaymentModel>
  ): Observable<{ message: string }> {
    this.isLoadingSubject.next(true);
    return this.http
      .post<{ message: string }>(`${API_PAYMENT_URL}`, paymentData)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }

  updateCompanySalePayment(
    id: string,
    paymentData: Partial<ICreateUpdateCompanySalePaymentModel>
  ): Observable<ICreateUpdateCompanySalePaymentModel> {
    this.isLoadingSubject.next(true);
    return this.http
      .put<{ data: ICreateUpdateCompanySalePaymentModel }>(
        `${API_PAYMENT_URL}/${id}`,
        paymentData
      )
      .pipe(
        map((response) => response.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getCompanySalePaymentsById(
    companySaleId: string
  ): Observable<ICompanySalePaymentModel[]> {
    this.isLoadingSubject.next(true);
    return this.http
      .get<IReadCompanySalePaymentModel>(
        `${API_PAYMENT_URL}?companySaleId=${companySaleId}`
      )
      .pipe(
        map((response) => response.data || []),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  deleteCompanySalePayment(id: string): Observable<{ message: string }> {
    this.isLoadingSubject.next(true);
    return this.http
      .delete<{ message: string }>(`${API_PAYMENT_URL}/${id}`)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }
}
