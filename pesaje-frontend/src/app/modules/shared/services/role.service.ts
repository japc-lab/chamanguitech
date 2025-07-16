import { environment } from '../../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { IRoleModel } from '../../auth/interfaces/role.interface';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const API_PAYMENT_INFO_URL = `${environment.apiUrl}/role`;

@Injectable({ providedIn: 'root' })
export class RoleService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  constructor(private http: HttpClient) {}

  getRoles(): Observable<IRoleModel[]> {
    this.isLoadingSubject.next(true);
    return this.http
      .get<{ ok: boolean; roles: IRoleModel[] }>(`${API_PAYMENT_INFO_URL}`)
      .pipe(
        map((response) => response.roles || []),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }
}
