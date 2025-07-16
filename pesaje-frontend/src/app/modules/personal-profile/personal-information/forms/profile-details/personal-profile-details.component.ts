import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { UserModel } from 'src/app/modules/auth';
import { ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { UserService } from 'src/app/modules/settings/services/user.service';
import { IUpdateUserModel } from 'src/app/modules/settings/interfaces/user.interface';
import { AlertService } from 'src/app/utils/alert.service';

@Component({
  selector: 'app-personal-profile-details',
  templateUrl: './personal-profile-details.component.html',
})
export class PersonalProfileDetailsComponent implements OnInit, OnDestroy {
  @ViewChild('profileForm') profileForm!: NgForm;
  @Input() user: UserModel | undefined = undefined;
  @Output() saveCompleted = new EventEmitter<void>();

  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  isLoading: boolean;
  private unsubscribe: Subscription[] = [];

  constructor(
    private userService: UserService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {
    const loadingSubscr = this.isLoading$
      .asObservable()
      .subscribe((res) => (this.isLoading = res));
    this.unsubscribe.push(loadingSubscr);
  }

  ngOnInit(): void {}

  saveSettings() {
    if (this.profileForm.invalid || !this.user) {
      return;
    }
    this.isLoading$.next(true);

    const payload: IUpdateUserModel = {
      id: this.user.id,
      username: this.user.username,
      password: this.user.password,
      roles: this.user.roles?.map((role) => role.id),
      person: {
        id: this.user.person.id,
        names: this.user.person.names,
        lastNames: this.user.person.lastNames,
        identification: this.user.person.identification,
        birthDate: this.user.person.birthDate,
        address: this.user.person.address,
        phone: this.user.person.phone?.toString() ?? '',
        mobilePhone: this.user.person.mobilePhone,
        mobilePhone2: this.user.person.mobilePhone2,
        email: this.user.person.email,
        emergencyContactName: this.user.person.emergencyContactName,
        emergencyContactPhone: this.user.person.emergencyContactPhone,
      },
    };

    this.userService.updateUser(this.user.id, payload).subscribe({
      next: (response) => {
        this.isLoading$.next(false);
        this.cdr.detectChanges();
        this.alertService.showTranslatedAlert({ alertType: 'success' });
        this.saveCompleted.emit();
      },
      error: (error) => {
        this.isLoading$.next(false);
        console.error('Error actualizando usuario:', error);
        this.cdr.detectChanges();
        this.alertService.showTranslatedAlert({ alertType: 'error' });
      },
    });
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
