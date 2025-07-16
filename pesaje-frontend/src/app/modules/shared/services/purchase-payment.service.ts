import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ICreateUpdatePurchasePaymentModel,
  IPurchasePaymentModel,
  IReadPurchasePaymentModel,
} from '../interfaces/purchase-payment.interface';

const API_PAYMENT_URL = `${environment.apiUrl}/purchase-payment-method`;

@Injectable({
  providedIn: 'root',
})
export class PurchasePaymentService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  createPurchasePayment(
    paymentData: Partial<ICreateUpdatePurchasePaymentModel>
  ): Observable<{ message: string }> {
    this.isLoadingSubject.next(true);
    return this.http
      .post<{ message: string }>(`${API_PAYMENT_URL}`, paymentData)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }

  updatePurchasePayment(
    id: string,
    paymentData: Partial<ICreateUpdatePurchasePaymentModel>
  ): Observable<ICreateUpdatePurchasePaymentModel> {
    this.isLoadingSubject.next(true);
    return this.http
      .put<{ data: ICreateUpdatePurchasePaymentModel }>(
        `${API_PAYMENT_URL}/${id}`,
        paymentData
      )
      .pipe(
        map((response) => response.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getPurchasePaymentsById(
    purchaseId: string
  ): Observable<IPurchasePaymentModel[]> {
    this.isLoadingSubject.next(true);
    return this.http
      .get<IReadPurchasePaymentModel>(
        `${API_PAYMENT_URL}?purchaseId=${purchaseId}`
      )
      .pipe(
        map((response) => response.data || []),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  deletePurchasePayment(id: string): Observable<{ message: string }> {
    this.isLoadingSubject.next(true);
    return this.http
      .delete<{ message: string }>(`${API_PAYMENT_URL}/${id}`)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }
}
