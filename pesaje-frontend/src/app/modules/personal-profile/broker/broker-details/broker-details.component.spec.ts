import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrokerDetailsComponent } from './broker-details.component';

describe('UserDetailsComponent', () => {
  let component: BrokerDetailsComponent;
  let fixture: ComponentFixture<BrokerDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BrokerDetailsComponent]
    });
    fixture = TestBed.createComponent(BrokerDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
