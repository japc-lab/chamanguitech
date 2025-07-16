import { environment } from '../../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import {
  IPaymentMethodModel,
  IReadPaymentMethodModel,
} from '../interfaces/payment-method.interface';

const API_PAYMENT_METHOD_URL = `${environment.apiUrl}/payment-method`;

@Injectable({
  providedIn: 'root',
})
export class PaymentMethodService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  getAllPaymentsMethods(): Observable<IPaymentMethodModel[]> {
    this.isLoadingSubject.next(true);
    return this.http
      .get<IReadPaymentMethodModel>(`${API_PAYMENT_METHOD_URL}`)
      .pipe(
        map((response) => response.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }
}
