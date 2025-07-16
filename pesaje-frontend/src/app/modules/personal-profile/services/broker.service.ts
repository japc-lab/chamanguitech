import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  ICreateBrokerModel,
  IReadBrokerModel,
  IUpdateBrokerModel,
} from '../interfaces/broker.interface';

const API_BROKER_URL = `${environment.apiUrl}/broker`;

@Injectable({ providedIn: 'root' })
export class BrokerService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  constructor(private http: HttpClient) {}

  createBroker(
    brokerData: Partial<ICreateBrokerModel>
  ): Observable<{ message: string }> {
    this.isLoadingSubject.next(true);
    return this.http
      .post<{ message: string }>(`${API_BROKER_URL}`, brokerData)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }

  getBrokersByUser(userId: string): Observable<IReadBrokerModel[]> {
    this.isLoadingSubject.next(true);
    return this.http
      .get<{ ok: boolean; data: IReadBrokerModel[] }>(
        `${API_BROKER_URL}?userId=${userId}`
      )
      .pipe(
        map((response) => response.data || []),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getBrokerById(id: string): Observable<IReadBrokerModel> {
    this.isLoadingSubject.next(true);
    return this.http
      .get<{ ok: boolean; data: IReadBrokerModel }>(`${API_BROKER_URL}/${id}`)
      .pipe(
        map((response) => response.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getAllBrokers(includeDeleted: boolean):Observable<IReadBrokerModel[]>{
    this.isLoadingSubject.next(true);
    return this.http
      .get<{ ok: boolean; data: IReadBrokerModel[] }>(
        `${API_BROKER_URL}/all?includeDeleted=${includeDeleted}`
      )
      .pipe(
        map((response) => response.data || []),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  updateBroker(
    id: string,
    updateData: Partial<IUpdateBrokerModel>
  ): Observable<IUpdateBrokerModel> {
    this.isLoadingSubject.next(true);
    return this.http
      .put<{ updatedBroker: IUpdateBrokerModel }>(
        `${API_BROKER_URL}/${id}`,
        updateData
      )
      .pipe(
        map((response) => response.updatedBroker),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  deleteBroker(id: string): Observable<{ message: string }> {
    this.isLoadingSubject.next(true);
    return this.http
      .delete<{ message: string }>(`${API_BROKER_URL}/${id}`)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }
}
