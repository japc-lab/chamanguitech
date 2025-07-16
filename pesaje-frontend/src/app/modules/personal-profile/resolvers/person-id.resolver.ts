import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserService } from '../../settings/services/user.service';
import { AuthService } from '../../auth';

@Injectable({
  providedIn: 'root',
})
export class PersonIdResolver implements Resolve<string | null> {
  constructor(private authService: AuthService) {}

  resolve(): Observable<string | null> {
    return this.authService.currentUser$.pipe(
      map((user) => user?.person?.id || null)
    );
  }
}
