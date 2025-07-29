import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AportesListComponent } from './aportes-list.component';

describe('AportesListComponent', () => {
  let component: AportesListComponent;
  let fixture: ComponentFixture<AportesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AportesListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AportesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
