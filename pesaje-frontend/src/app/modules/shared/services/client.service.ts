import { environment } from '../../../../environments/environment';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { finalize, map } from 'rxjs/operators';
import { ICreateUpdateClientModel, IReadClientModel } from '../interfaces/client.interface';

const API_CLIENT_URL = `${environment.apiUrl}/client`;

@Injectable({ providedIn: 'root' })
export class ClientService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  createClient(
    clientData: Partial<ICreateUpdateClientModel>
  ): Observable<{ message: string }> {
    this.isLoadingSubject.next(true);
    return this.http
      .post<{ message: string }>(`${API_CLIENT_URL}`, clientData)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }

  updateClient(
    id: string,
    updateData: Partial<ICreateUpdateClientModel>
  ): Observable<ICreateUpdateClientModel> {
    this.isLoadingSubject.next(true);
    return this.http
      .put<{ updatedClient: ICreateUpdateClientModel }>(`${API_CLIENT_URL}/${id}`, updateData)
      .pipe(
        map(response => response.updatedClient),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  deleteClient(id: string): Observable<{ message: string }> {
    this.isLoadingSubject.next(true);
    return this.http
      .delete<{ message: string }>(`${API_CLIENT_URL}/${id}`)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }

  getClientsByUser(userId: string): Observable<IReadClientModel[]> {
    this.isLoadingSubject.next(true);
    return this.http
      .get<{ ok: boolean; data: IReadClientModel[] }>(`${API_CLIENT_URL}?userId=${userId}`)
      .pipe(
        map(response => response.data || []),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getClientById(id: string): Observable<IReadClientModel> {
    this.isLoadingSubject.next(true);
    return this.http
      .get<{ ok: boolean; data: IReadClientModel }>(`${API_CLIENT_URL}/${id}`)
      .pipe(
        map(response => response.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getAllClients(includeDeleted: boolean): Observable<IReadClientModel[]> {
    this.isLoadingSubject.next(true);
    return this.http
      .get<{ ok: boolean; data: IReadClientModel[] }>(`${API_CLIENT_URL}/all?includeDeleted=${includeDeleted}`)
      .pipe(
        map(response => response.data || []),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }
}
