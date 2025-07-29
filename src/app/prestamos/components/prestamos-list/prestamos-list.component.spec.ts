import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrestamosListComponent } from './prestamos-list.component';

describe('PrestamosListComponent', () => {
  let component: PrestamosListComponent;
  let fixture: ComponentFixture<PrestamosListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrestamosListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrestamosListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
