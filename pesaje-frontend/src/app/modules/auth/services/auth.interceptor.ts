import { Injectable, NgZone } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, finalize } from 'rxjs/operators';
import { TokenStorageService } from '../services/token-storage.service';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { AuthHTTPService } from './auth-http';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private excludedUrls = [
    `${environment.apiUrl}/auth/login`,
    `${environment.apiUrl}/auth/renew`,
  ]; // List of endpoints that should NOT include the token

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> =
    new BehaviorSubject<string | null>(null);

  constructor(
    private tokenStorageService: TokenStorageService,
    private authHttpService: AuthHTTPService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (this.excludedUrls.some((url) => req.url.includes(url))) {
      return next.handle(req);
    }

    const auth = this.tokenStorageService.getAuthFromLocalStorage();
    if (auth?.authToken) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${auth.authToken}`,
        },
      });
    }

    return next.handle(req).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(req, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handle401Error(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        switchMap((newToken) => {
          if (!newToken) {
            this.logoutAndRedirect();
            return throwError(() => new Error('Session expired'));
          }
          return next.handle(
            req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })
          );
        })
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    return this.refreshToken().pipe(
      switchMap((newAuth) => {
        if (!newAuth?.authToken) {
          this.logoutAndRedirect();
          return throwError(() => new Error('Session expired'));
        }

        this.tokenStorageService.setAuthFromLocalStorage(newAuth);
        this.refreshTokenSubject.next(newAuth.authToken);

        return next.handle(
          req.clone({
            setHeaders: { Authorization: `Bearer ${newAuth.authToken}` },
          })
        );
      }),
      catchError(() => {
        this.logoutAndRedirect();
        return throwError(
          () => new Error('Session expired, please log in again.')
        );
      }),
      finalize(() => {
        this.isRefreshing = false;
      })
    );
  }

  private refreshToken(): Observable<any> {
    const auth = this.tokenStorageService.getAuthFromLocalStorage();
    if (!auth || !auth.refreshToken) {
      this.logoutAndRedirect();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.authHttpService.refreshToken(auth.refreshToken).pipe(
      catchError(() => {
        this.logoutAndRedirect();
        return throwError(() => new Error('Failed to refresh token'));
      })
    );
  }

  private logoutAndRedirect() {
    this.tokenStorageService.removeToken();

    // ✅ Ensure navigation occurs outside of Angular's HTTP execution context
    this.ngZone.run(() => {
      this.router.navigate(['/auth/login']).then(() => {
        window.location.reload(); // ✅ Optional: Ensure a full reload to clear state
      });
    });
  }
}
