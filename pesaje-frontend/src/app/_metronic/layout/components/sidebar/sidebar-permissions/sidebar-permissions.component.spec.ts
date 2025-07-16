import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarPermissionsComponent } from '../sidebar-dynamic-menu/sidebar-permissions.component';


describe('SidebarMenuComponent', () => {
  let component: SidebarPermissionsComponent;
  let fixture: ComponentFixture<SidebarPermissionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SidebarPermissionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebarPermissionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
