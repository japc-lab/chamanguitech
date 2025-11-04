import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserService } from '../../settings/services/user.service';
import { AuthService } from '../../auth';

@Injectable({
  providedIn: 'root',
})
export class PersonIdResolver implements Resolve<string | null> {
  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  resolve(): Observable<string | null> {
    const currentUser = this.authService.currentUserValue;

    if (!currentUser?.id) {
      return of(null);
    }

    // Fetch the full user data including person object
    return this.userService.getUserById(currentUser.id).pipe(
      map((user) => user?.person?.id || null)
    );
  }
}
