import { TestBed } from '@angular/core/testing';

import { ProrrogaService } from './prorroga.service';

describe('ProrrogaService', () => {
  let service: ProrrogaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProrrogaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
