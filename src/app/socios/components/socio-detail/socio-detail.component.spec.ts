import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocioDetailComponent } from './socio-detail.component';

describe('SocioDetailComponent', () => {
  let component: SocioDetailComponent;
  let fixture: ComponentFixture<SocioDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocioDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SocioDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
