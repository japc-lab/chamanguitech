import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  ICreatePurchaseModel,
  IDetailedPurchaseModel,
  IListPurchaseModel,
  IReducedDetailedPurchaseModel,
  IUpdatePurchaseModel,
} from '../interfaces/purchase.interface';

const API_PURCHASE_URL = `${environment.apiUrl}/purchase`;

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  createPurchase(
    payload: ICreatePurchaseModel
  ): Observable<IDetailedPurchaseModel> {
    this.isLoadingSubject.next(true);

    return this.http
      .post<{ data: IDetailedPurchaseModel }>(`${API_PURCHASE_URL}`, payload)
      .pipe(
        map((response) => response.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  searchPurchase(
    userId: string | null,
    periodId: string | null,
    clientId: string | null
  ): Observable<IDetailedPurchaseModel[]> {
    this.isLoadingSubject.next(true);

    // Build query parameters dynamically
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (periodId) params.append('periodId', periodId);
    if (clientId) params.append('clientId', clientId);

    return this.http
      .get<{ ok: boolean; data: IDetailedPurchaseModel[] }>(
        `${API_PURCHASE_URL}?${params.toString()}`
      )
      .pipe(
        map((response) => response.data || []),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getPurchaseById(id: string): Observable<IListPurchaseModel> {
    this.isLoadingSubject.next(true);
    return this.http
      .get<{ ok: boolean; data: IListPurchaseModel }>(
        `${API_PURCHASE_URL}/${id}`
      )
      .pipe(
        map((response) => response.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getPurchaseByParams(
    includeDeleted: boolean,
    userId: string | null,
    companyId: string | null,
    periodId: string | null,
    clientId: string | null,
    controlNumber: string | null
  ): Observable<IReducedDetailedPurchaseModel[]> {
    this.isLoadingSubject.next(true);

    const params = new URLSearchParams();
    params.append('includeDeleted', includeDeleted.toString());
    if (userId) params.append('userId', userId);
    if (companyId) params.append('companyId', companyId);
    if (periodId) params.append('periodId', periodId);
    if (clientId) params.append('clientId', clientId);
    if (controlNumber !== null)
      params.append('controlNumber', controlNumber.toString());

    return this.http
      .get<{ ok: boolean; data: IReducedDetailedPurchaseModel[] }>(
        `${API_PURCHASE_URL}/by-params?${params.toString()}`
      )
      .pipe(
        map((response) => response.data || []),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  updatePurchase(
    id: string,
    payload: IUpdatePurchaseModel
  ): Observable<IDetailedPurchaseModel> {
    this.isLoadingSubject.next(true);
    return this.http
      .put<{ updatedPurchase: IDetailedPurchaseModel }>(
        `${API_PURCHASE_URL}/${id}`,
        payload
      )
      .pipe(
        map((response) => response.updatedPurchase),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  deletePurchase(id: string): Observable<{ message: string }> {
    this.isLoadingSubject.next(true);
    return this.http
      .delete<{ message: string }>(`${API_PURCHASE_URL}/${id}`)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }
}
