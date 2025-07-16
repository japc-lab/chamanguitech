import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrokerListingComponent } from './broker-listing.component';

describe('UserListingComponent', () => {
  let component: BrokerListingComponent;
  let fixture: ComponentFixture<BrokerListingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BrokerListingComponent]
    });
    fixture = TestBed.createComponent(v);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
