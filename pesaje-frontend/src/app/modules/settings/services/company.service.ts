import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ICompany } from '../interfaces/company.interfaces';

const API_COMPANY_URL = `${environment.apiUrl}/company`;

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  constructor(private http: HttpClient) {}

  getCompanies(): Observable<ICompany[]> {
    this.isLoadingSubject.next(true);

    return this.http.get<{ data: ICompany[] }>(`${API_COMPANY_URL}`).pipe(
      map((response) => response.data || []),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  createCompany(company: ICompany): Observable<ICompany> {
    this.isLoadingSubject.next(true);
    return this.http
      .post<{ data: ICompany }>(`${API_COMPANY_URL}`, company)
      .pipe(
        map((response) => response.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  updateCompany(company: ICompany): Observable<ICompany> {
    this.isLoadingSubject.next(true);
    return this.http
      .put<{ data: ICompany }>(`${API_COMPANY_URL}/${company.id}`, company)
      .pipe(
        map((response) => response.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  deleteCompany(id: string): Observable<{ message: string }> {
    this.isLoadingSubject.next(true);
    return this.http
      .delete<{ message: string }>(`${API_COMPANY_URL}/${id}`)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }
}
