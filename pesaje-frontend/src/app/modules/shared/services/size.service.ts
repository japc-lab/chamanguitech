import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IReadSizeModel, SizeTypeEnum } from '../interfaces/size.interface';

const API_PAYMENT_INFO_URL = `${environment.apiUrl}/size`;

@Injectable({
  providedIn: 'root',
})
export class SizeService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  constructor(private http: HttpClient) {}

  getSizes(type: string): Observable<IReadSizeModel[]> {
    this.isLoadingSubject.next(true);

    const params = new HttpParams().set('type', type); // ✅ Add query param

    return this.http
      .get<{ data: IReadSizeModel[] }>(`${API_PAYMENT_INFO_URL}`, { params })
      .pipe(
        map((response) => response.data || []),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }
}
