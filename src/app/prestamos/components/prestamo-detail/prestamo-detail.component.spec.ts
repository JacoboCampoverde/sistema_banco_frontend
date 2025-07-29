import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrestamoDetailComponent } from './prestamo-detail.component';

describe('PrestamoDetailComponent', () => {
  let component: PrestamoDetailComponent;
  let fixture: ComponentFixture<PrestamoDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrestamoDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrestamoDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
