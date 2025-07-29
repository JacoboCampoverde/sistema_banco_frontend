import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProrrogasListComponent } from './prorrogas-list.component';

describe('ProrrogasListComponent', () => {
  let component: ProrrogasListComponent;
  let fixture: ComponentFixture<ProrrogasListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProrrogasListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProrrogasListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
