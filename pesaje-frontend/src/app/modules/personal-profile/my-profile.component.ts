import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { UserModel } from '../auth';
import { UserService } from '../settings/services/user.service';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss'],
})
export class MyProfileComponent implements OnInit, OnDestroy {
  user: UserModel | undefined;

  photoUrl: string = '/assets/media/avatars/blank.png'; // Default photo URL

  private unsubscribe: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to the user observable
    const userSub = this.authService.currentUser$.subscribe((user) => {
      this.user = user; // Update the user data
      this.photoUrl =
        this.user?.person.photo || '/assets/media/avatars/blank.png';
      this.cdr.detectChanges(); // Trigger Angular's change detection
    });
    this.unsubscribe.push(userSub);
  }

  onPhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.user) return;

    const formData = new FormData();
    formData.append('photo', file);

    this.userService.uploadMyProfilePhoto(this.user.id, formData).subscribe({
      next: () => {
        // No need to update photoUrl here; subscription to user$ will handle it
      },
      error: (err) => {
        console.error('Upload failed', err);
      },
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
  }
}
