import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IPaymentInfoModel } from '../interfaces/payment-info.interface';

const API_PAYMENT_INFO_URL = `${environment.apiUrl}/payment-info`;

@Injectable({
  providedIn: 'root',
})
export class PaymentInfoService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  createPaymentInfo(
    paymentInfoData: Partial<IPaymentInfoModel>
  ): Observable<{ message: string }> {
    this.isLoadingSubject.next(true);
    return this.http
      .post<{ message: string }>(`${API_PAYMENT_INFO_URL}`, paymentInfoData)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }

  getPaymentInfosByPerson(personId: string): Observable<IPaymentInfoModel[]> {
    this.isLoadingSubject.next(true);
    return this.http
      .get<{ paymentInfos: IPaymentInfoModel[] }>(
        `${API_PAYMENT_INFO_URL}?personId=${personId}`
      )
      .pipe(
        map((response) => response.paymentInfos), // ✅ Extract array from response
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getPaymentInfoById(id: string): Observable<IPaymentInfoModel> {
    this.isLoadingSubject.next(true);
    return this.http
      .get<{ paymentInfo: IPaymentInfoModel }>(`${API_PAYMENT_INFO_URL}/${id}`)
      .pipe(
        map((response) => response.paymentInfo), // ✅ Extract object from response
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  updatePaymentInfo(
    id: string,
    updateData: Partial<IPaymentInfoModel>
  ): Observable<IPaymentInfoModel> {
    this.isLoadingSubject.next(true);
    return this.http
      .put<{ updatedPaymentInfo: IPaymentInfoModel }>(
        `${API_PAYMENT_INFO_URL}/${id}`,
        updateData
      )
      .pipe(
        map((response) => response.updatedPaymentInfo), // ✅ Extract object from response
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  deletePaymentInfo(id: string): Observable<{ message: string }> {
    this.isLoadingSubject.next(true);
    return this.http
      .delete<{ message: string }>(`${API_PAYMENT_INFO_URL}/${id}`)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }
}
