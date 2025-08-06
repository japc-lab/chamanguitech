import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  ICreateFishermanModel,
  IReadFishermanModel,
  IUpdateFishermanModel,
} from '../interfaces/fisherman.interface';

@Injectable({
  providedIn: 'root',
})
export class FishermanService {
  private apiUrl = `${environment.apiUrl}/fisherman`;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAll(includeDeleted = false): Observable<IReadFishermanModel[]> {
    this.isLoadingSubject.next(true);
    return new Observable((observer) => {
      this.http
        .get<{ ok: boolean; data: IReadFishermanModel[] }>(
          `${this.apiUrl}/all?includeDeleted=${includeDeleted}`
        )
        .subscribe({
          next: (response) => {
            observer.next(response.data);
            this.isLoadingSubject.next(false);
            observer.complete();
          },
          error: (error) => {
            observer.error(error);
            this.isLoadingSubject.next(false);
          },
        });
    });
  }

  getById(id: string): Observable<IReadFishermanModel> {
    this.isLoadingSubject.next(true);
    return new Observable((observer) => {
      this.http
        .get<{ ok: boolean; data: IReadFishermanModel }>(
          `${this.apiUrl}/${id}`
        )
        .subscribe({
          next: (response) => {
            observer.next(response.data);
            this.isLoadingSubject.next(false);
            observer.complete();
          },
          error: (error) => {
            observer.error(error);
            this.isLoadingSubject.next(false);
          },
        });
    });
  }

  create(data: ICreateFishermanModel): Observable<IReadFishermanModel> {
    this.isLoadingSubject.next(true);
    return new Observable((observer) => {
      this.http
        .post<{ ok: boolean; data: IReadFishermanModel }>(
          this.apiUrl,
          data
        )
        .subscribe({
          next: (response) => {
            observer.next(response.data);
            this.isLoadingSubject.next(false);
            observer.complete();
          },
          error: (error) => {
            observer.error(error);
            this.isLoadingSubject.next(false);
          },
        });
    });
  }

  update(id: string, data: IUpdateFishermanModel): Observable<IReadFishermanModel> {
    this.isLoadingSubject.next(true);
    return new Observable((observer) => {
      this.http
        .put<{ ok: boolean; data: IReadFishermanModel }>(
          `${this.apiUrl}/${id}`,
          data
        )
        .subscribe({
          next: (response) => {
            observer.next(response.data);
            this.isLoadingSubject.next(false);
            observer.complete();
          },
          error: (error) => {
            observer.error(error);
            this.isLoadingSubject.next(false);
          },
        });
    });
  }

  delete(id: string): Observable<void> {
    this.isLoadingSubject.next(true);
    return new Observable((observer) => {
      this.http.delete<{ ok: boolean }>(`${this.apiUrl}/${id}`).subscribe({
        next: () => {
          observer.next();
          this.isLoadingSubject.next(false);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
          this.isLoadingSubject.next(false);
        },
      });
    });
  }
}
