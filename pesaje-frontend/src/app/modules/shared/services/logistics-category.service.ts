import { environment } from '../../../../environments/environment';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {
  ILogisticsCategoryModel,
  IReadLogisticsCategoryModel,
} from '../interfaces/logistic-type.interface';
import { finalize } from 'rxjs/operators';

const API_LOGISTICS_CATEGORY_URL = `${environment.apiUrl}/logistics-category`;

@Injectable({
  providedIn: 'root',
})
export class LogisticsCategoryService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  getAllLogisticsCategories(): Observable<ILogisticsCategoryModel[]> {
    this.isLoadingSubject.next(true);
    return this.http
      .get<IReadLogisticsCategoryModel>(`${API_LOGISTICS_CATEGORY_URL}`)
      .pipe(
        map((response) => response.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }
}
