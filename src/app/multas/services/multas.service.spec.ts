import { TestBed } from '@angular/core/testing';

import { MultasService } from './multas.service';

describe('MultasService', () => {
  let service: MultasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MultasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
