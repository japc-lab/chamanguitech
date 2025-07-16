import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ICompanySaleItemModel } from '../interfaces/company-sale-item.interface';
import {
  ICreateUpdateLocalSaleModel,
  ILocalSaleModel,
} from '../interfaces/sale.interface';

const API_LOCAL_SALE_URL = `${environment.apiUrl}/local-sale`;

@Injectable({
  providedIn: 'root',
})
export class LocalSaleService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  createLocalSale(
    payload: ICreateUpdateLocalSaleModel
  ): Observable<ILocalSaleModel> {
    this.isLoadingSubject.next(true);

    return this.http
      .post<{ data: ILocalSaleModel }>(API_LOCAL_SALE_URL, payload)
      .pipe(
        map((res) => res.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getLocalSaleBySaleId(id: string): Observable<ILocalSaleModel> {
    this.isLoadingSubject.next(true);
    return this.http
      .get<{ ok: boolean; data: ILocalSaleModel }>(
        `${API_LOCAL_SALE_URL}/by-sale/${id}`
      )
      .pipe(
        map((response) => response.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  updateLocalSale(
    id: string,
    payload: ICreateUpdateLocalSaleModel
  ): Observable<ILocalSaleModel> {
    this.isLoadingSubject.next(true);
    return this.http
      .put<{ data: ILocalSaleModel }>(`${API_LOCAL_SALE_URL}/${id}`, payload)
      .pipe(
        map((response) => response.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }
}
