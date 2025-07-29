import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SociosListComponent } from './socios-list.component';

describe('SociosListComponent', () => {
  let component: SociosListComponent;
  let fixture: ComponentFixture<SociosListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SociosListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SociosListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
