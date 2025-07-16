import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  ICreateUpdateLogisticsModel,
  IDetailedReadLogisticsModel,
  IReadLogisticsModel,
} from '../interfaces/logistics.interface';

const API_LOGISTICS_URL = `${environment.apiUrl}/logistics`;

@Injectable({
  providedIn: 'root',
})
export class LogisticsService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  createLogistics(
    payload: ICreateUpdateLogisticsModel
  ): Observable<IReadLogisticsModel> {
    this.isLoadingSubject.next(true);

    return this.http
      .post<{ data: IReadLogisticsModel }>(API_LOGISTICS_URL, payload)
      .pipe(
        map((res) => res.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getLogisticsByParams(
    includeDeleted: boolean,
    userId: string | null,
    controlNumber: string | null
  ): Observable<IReadLogisticsModel[]> {
    this.isLoadingSubject.next(true);

    const params = new URLSearchParams();
    params.append('includeDeleted', includeDeleted.toString());
    if (userId) params.append('userId', userId);
    if (controlNumber !== null)
      params.append('controlNumber', controlNumber.toString());

    return this.http
      .get<{ ok: boolean; data: IReadLogisticsModel[] }>(
        `${API_LOGISTICS_URL}/by-params?${params.toString()}`
      )
      .pipe(
        map((response) => response.data || []),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getLogisticsById(id: string): Observable<IDetailedReadLogisticsModel> {
    this.isLoadingSubject.next(true);
    return this.http
      .get<{ ok: boolean; data: IDetailedReadLogisticsModel }>(
        `${API_LOGISTICS_URL}/${id}`
      )
      .pipe(
        map((response) => response.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  updateLogistics(
    id: string,
    payload: ICreateUpdateLogisticsModel
  ): Observable<IReadLogisticsModel> {
    this.isLoadingSubject.next(true);
    return this.http
      .put<{ data: IReadLogisticsModel }>(`${API_LOGISTICS_URL}/${id}`, payload)
      .pipe(
        map((response) => response.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  deleteLogistics(id: string): Observable<{ message: string }> {
    this.isLoadingSubject.next(true);
    return this.http
      .delete<{ message: string }>(`${API_LOGISTICS_URL}/${id}`)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }
}
