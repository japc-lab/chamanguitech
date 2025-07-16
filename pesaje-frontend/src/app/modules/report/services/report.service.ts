import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IEconomicReportModel } from '../interfaces/economic-report.interface';
import {
  ICreateUpdateTotalReport,
  ITotalReportModel,
} from '../interfaces/total-report.interface';

const API_REPORT_URL = `${environment.apiUrl}/report`;

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  getEconomicReportByParams(
    includeDeleted: boolean,
    userId: string | null,
    periodId: string | null,
    clientId: string | null,
    controlNumber: string | null
  ): Observable<IEconomicReportModel> {
    this.isLoadingSubject.next(true);

    const params = new URLSearchParams();
    params.append('includeDeleted', includeDeleted.toString());
    if (userId) params.append('userId', userId);
    if (periodId) params.append('periodId', periodId);
    if (clientId) params.append('clientId', clientId);
    if (controlNumber !== null)
      params.append('controlNumber', controlNumber.toString());

    return this.http
      .get<{ ok: boolean; data: IEconomicReportModel }>(
        `${API_REPORT_URL}/economic/by-params?${params.toString()}`
      )
      .pipe(
        map((response) => response.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getTotalReportByParams(
    includeDeleted: boolean,
    userId: string | null,
    periodId: string | null,
    clientId: string | null,
    controlNumber: string | null
  ): Observable<ITotalReportModel> {
    this.isLoadingSubject.next(true);

    const params = new URLSearchParams();
    params.append('includeDeleted', includeDeleted.toString());
    if (userId) params.append('userId', userId);
    if (periodId) params.append('periodId', periodId);
    if (clientId) params.append('clientId', clientId);
    if (controlNumber !== null)
      params.append('controlNumber', controlNumber.toString());

    return this.http
      .get<{ ok: boolean; data: ITotalReportModel }>(
        `${API_REPORT_URL}/total/by-params?${params.toString()}`
      )
      .pipe(
        map((response) => response.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  createTotalReport(
    payload: ICreateUpdateTotalReport
  ): Observable<ICreateUpdateTotalReport> {
    this.isLoadingSubject.next(true);

    return this.http
      .post<{ data: ICreateUpdateTotalReport }>(
        `${API_REPORT_URL}/total`,
        payload
      )
      .pipe(
        map((res) => res.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getRecordedTotalReportByControlNumber(
    controlNumber: string
  ): Observable<ICreateUpdateTotalReport | null> {
    this.isLoadingSubject.next(true);

    const params = new URLSearchParams();
    params.append('controlNumber', controlNumber);

    return this.http
      .get<{ ok: boolean; data: ICreateUpdateTotalReport | null }>(
        `${API_REPORT_URL}/total/recorded?${params.toString()}`
      )
      .pipe(
        map((response) => response.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }
}
