import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultasListComponent } from './multas-list.component';

describe('MultasListComponent', () => {
  let component: MultasListComponent;
  let fixture: ComponentFixture<MultasListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultasListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MultasListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
