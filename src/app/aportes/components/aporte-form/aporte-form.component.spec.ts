import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AporteFormComponent } from './aporte-form.component';

describe('AporteFormComponent', () => {
  let component: AporteFormComponent;
  let fixture: ComponentFixture<AporteFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AporteFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AporteFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
