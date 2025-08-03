import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ICreateMerchantModel,
  IReadMerchantModel,
  IUpdateMerchantModel,
} from '../interfaces/merchant.interface';

@Injectable({
  providedIn: 'root',
})
export class MerchantService {
  private apiUrl = `${environment.apiUrl}/merchant`;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAllMerchants(includeDeleted: boolean = false): Observable<IReadMerchantModel[]> {
    this.isLoadingSubject.next(true);
    return new Observable((observer) => {
      this.http
        .get<IReadMerchantModel[]>(`${this.apiUrl}/all?includeDeleted=${includeDeleted}`)
        .subscribe({
          next: (response: any) => {
            observer.next(response.data);
            this.isLoadingSubject.next(false);
          },
          error: (error) => {
            observer.error(error);
            this.isLoadingSubject.next(false);
          },
        });
    });
  }

  getMerchantById(id: string): Observable<IReadMerchantModel> {
    this.isLoadingSubject.next(true);
    return new Observable((observer) => {
      this.http
        .get<IReadMerchantModel>(`${this.apiUrl}/${id}`)
        .subscribe({
          next: (response: any) => {
            observer.next(response.data);
            this.isLoadingSubject.next(false);
          },
          error: (error) => {
            observer.error(error);
            this.isLoadingSubject.next(false);
          },
        });
    });
  }

  createMerchant(merchant: ICreateMerchantModel): Observable<IReadMerchantModel> {
    this.isLoadingSubject.next(true);
    return new Observable((observer) => {
      this.http
        .post<IReadMerchantModel>(`${this.apiUrl}`, merchant)
        .subscribe({
          next: (response: any) => {
            observer.next(response.data);
            this.isLoadingSubject.next(false);
          },
          error: (error) => {
            observer.error(error);
            this.isLoadingSubject.next(false);
          },
        });
    });
  }

  updateMerchant(id: string, merchant: IUpdateMerchantModel): Observable<IReadMerchantModel> {
    this.isLoadingSubject.next(true);
    return new Observable((observer) => {
      this.http
        .put<IReadMerchantModel>(`${this.apiUrl}/${id}`, merchant)
        .subscribe({
          next: (response: any) => {
            observer.next(response.data);
            this.isLoadingSubject.next(false);
          },
          error: (error) => {
            observer.error(error);
            this.isLoadingSubject.next(false);
          },
        });
    });
  }

  deleteMerchant(id: string): Observable<any> {
    this.isLoadingSubject.next(true);
    return new Observable((observer) => {
      this.http
        .delete(`${this.apiUrl}/${id}`)
        .subscribe({
          next: (response: any) => {
            observer.next(response);
            this.isLoadingSubject.next(false);
          },
          error: (error) => {
            observer.error(error);
            this.isLoadingSubject.next(false);
          },
        });
    });
  }
}
