import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ILocalCompanySaleDetailPaymentModel, ICreateUpdateLocalCompanySaleDetailPaymentModel } from '../interfaces/local-company-sale-detail-payment.interface';

@Injectable({
  providedIn: 'root',
})
export class LocalCompanySaleDetailPaymentService {
  private baseUrl = `${environment.apiUrl}/local-company-sale-detail-payment`;

  constructor(private http: HttpClient) {}

  getPaymentsByLocalCompanySaleDetailId(
    localCompanySaleDetailId: string
  ): Observable<ILocalCompanySaleDetailPaymentModel[]> {
    return this.http
      .get<any>(`${this.baseUrl}?localCompanySaleDetailId=${localCompanySaleDetailId}`)
      .pipe(map((response) => response.data || []));
  }

  createPayment(
    payment: ICreateUpdateLocalCompanySaleDetailPaymentModel
  ): Observable<ILocalCompanySaleDetailPaymentModel> {
    return this.http
      .post<any>(this.baseUrl, payment)
      .pipe(map((response) => response.data));
  }

  updatePayment(
    id: string,
    payment: ICreateUpdateLocalCompanySaleDetailPaymentModel
  ): Observable<ILocalCompanySaleDetailPaymentModel> {
    return this.http
      .put<any>(`${this.baseUrl}/${id}`, payment)
      .pipe(map((response) => response.data));
  }

  deletePayment(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
}

