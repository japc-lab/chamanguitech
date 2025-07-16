import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, finalize, map, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserModel } from '../../auth/models/user.model';
import {
  ICreateUserModel,
  IReadUserModel,
  IUpdateUserModel,
} from '../interfaces/user.interface';
import { AuthService } from '../../auth';

const API_USERS_URL = `${environment.apiUrl}/user`;

@Injectable({
  providedIn: 'root',
})
export class UserService {
  isLoading$: Observable<boolean>;
  private isLoadingSubject: BehaviorSubject<boolean>;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  getUserById(id: string): Observable<UserModel> {
    this.isLoadingSubject.next(true);
    return this.http.get<{ user: UserModel }>(`${API_USERS_URL}/${id}`).pipe(
      map((response) => response.user),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  createUser(userData: ICreateUserModel): Observable<UserModel> {
    this.isLoadingSubject.next(true);
    return this.http
      .post<UserModel>(`${API_USERS_URL}`, userData)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }

  updateUser(id: string, userData: IUpdateUserModel): Observable<UserModel> {
    this.isLoadingSubject.next(true);
    return this.http
      .put<{ updatedUser: UserModel }>(`${API_USERS_URL}/${id}`, userData)
      .pipe(
        map((response) => response.updatedUser),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  updatePassword(id: string, newPassword: string): Observable<UserModel> {
    this.isLoadingSubject.next(true);
    return this.http
      .put<{ updatedUser: UserModel }>(`${API_USERS_URL}/${id}/password`, {
        password: newPassword,
      })
      .pipe(
        map((response) => response.updatedUser),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getAllUsers(
    includeDeleted: boolean,
    role?: string
  ): Observable<IReadUserModel[]> {
    this.isLoadingSubject.next(true);
    let params = new HttpParams().set(
      'includeDeleted',
      includeDeleted.toString()
    );
    if (role) {
      params = params.set('role', role);
    }
    return this.http
      .get<{ ok: boolean; users: IReadUserModel[] }>(`${API_USERS_URL}/`, {
        params,
      })
      .pipe(
        map((response) => response.users || []),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  deleteUser(id: string): Observable<{ message: string }> {
    this.isLoadingSubject.next(true);
    return this.http
      .delete<{ message: string }>(`${API_USERS_URL}/${id}`)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }

  uploadMyProfilePhoto(userId: string, formData: FormData): Observable<string> {
    this.isLoadingSubject.next(true);
    return this.http
      .put<{ photo: string }>(`${API_USERS_URL}/${userId}/photo`, formData)
      .pipe(
        map((res) => res.photo),
        tap((updatedPhotoPath: string) => {
          // Update the current user object with the new photo path and emit it
          const currentUser = this.authService.currentUserValue;
          if (currentUser) {
            currentUser.person.photo = updatedPhotoPath;
            this.authService.currentUserValue = currentUser;
          }
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }
}
