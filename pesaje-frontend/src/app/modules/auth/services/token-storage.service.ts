import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AuthModel } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  private authLocalStorageToken = `${environment.appVersion}-${environment.USERDATA_KEY}`;
  setAuthFromLocalStorage(auth: AuthModel): boolean {
    // store auth authToken/refreshToken/epiresIn in local storage to keep user logged in between page refreshes
    if (auth && auth.authToken) {
      localStorage.setItem(this.authLocalStorageToken, JSON.stringify(auth));
      return true;
    }
    return false;
  }

  getAuthFromLocalStorage(): AuthModel | undefined {
    try {
      const lsValue = localStorage.getItem(this.authLocalStorageToken);
      if (!lsValue) {
        return undefined;
      }

      const authData = JSON.parse(lsValue);
      return authData;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }
  removeToken(): void {
    localStorage.removeItem(this.authLocalStorageToken);
  }
}
