import { TestBed } from '@angular/core/testing';

import { RebuyService } from './rebuy.service';

describe('RebuyService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RebuyService = TestBed.get(RebuyService);
    expect(service).toBeTruthy();
  });
});
