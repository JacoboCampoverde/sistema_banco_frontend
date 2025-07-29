import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProrrogasFormComponent } from './prorrogas-form.component';

describe('ProrrogasFormComponent', () => {
  let component: ProrrogasFormComponent;
  let fixture: ComponentFixture<ProrrogasFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProrrogasFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProrrogasFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
