import { Component, OnInit } from '@angular/core';
import { UserModel } from '../../auth';
import { PERMISSION_ROUTES } from 'src/app/constants/routes.constants';
import { UserService } from '../../settings/services/user.service';
import { AuthService } from '../../auth/services/auth.service'; // import AuthService
import { Observable } from 'rxjs';

@Component({
  selector: 'app-personal-information',
  templateUrl: './personal-information.component.html',
})
export class PersonalInformationComponent implements OnInit {
  PERMISSION_ROUTE = PERMISSION_ROUTES.PERSONAL_PROFILE.MY_PROFILE;

  isEditing = false;
  user: UserModel | undefined;
  isLoading$: Observable<boolean>;

  toggleEditMode() {
    this.isEditing = !this.isEditing;
  }

  onSaveCompleted() {
    this.isEditing = false;
  }

  constructor(
    private userService: UserService,
    private authService: AuthService // inject AuthService
  ) {
    this.isLoading$ = this.userService.isLoading$;
  }

  ngOnInit() {
    const currentUser = this.authService.currentUserValue;
    if (currentUser?.id) {
      this.userService.getUserById(currentUser.id).subscribe((user) => {
        this.user = user;
      });
    }
  }
}
