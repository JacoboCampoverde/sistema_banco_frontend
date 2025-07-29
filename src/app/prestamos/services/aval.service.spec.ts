import { TestBed } from '@angular/core/testing';

import { AvalService } from './aval.service';

describe('AvalService', () => {
  let service: AvalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AvalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
