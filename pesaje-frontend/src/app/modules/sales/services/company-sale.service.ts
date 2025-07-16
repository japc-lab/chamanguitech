import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ICompanySaleItemModel } from '../interfaces/company-sale-item.interface';
import {
  ICompanySaleModel,
  ICreateUpdateCompanySaleModel,
} from '../interfaces/sale.interface';

const API_COMPANY_SALE_URL = `${environment.apiUrl}/company-sale`;

@Injectable({
  providedIn: 'root',
})
export class CompanySaleService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  createCompanySale(
    payload: ICreateUpdateCompanySaleModel
  ): Observable<ICompanySaleModel> {
    this.isLoadingSubject.next(true);

    return this.http
      .post<{ data: ICompanySaleModel }>(API_COMPANY_SALE_URL, payload)
      .pipe(
        map((res) => res.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getCompanySaleBySaleId(id: string): Observable<ICompanySaleModel> {
    this.isLoadingSubject.next(true);
    return this.http
      .get<{ ok: boolean; data: ICompanySaleModel }>(
        `${API_COMPANY_SALE_URL}/by-sale/${id}`
      )
      .pipe(
        map((response) => response.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  updateCompanySale(
    id: string,
    payload: ICreateUpdateCompanySaleModel
  ): Observable<ICompanySaleModel> {
    this.isLoadingSubject.next(true);
    return this.http
      .put<{ data: ICompanySaleModel }>(
        `${API_COMPANY_SALE_URL}/${id}`,
        payload
      )
      .pipe(
        map((response) => response.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }
}
