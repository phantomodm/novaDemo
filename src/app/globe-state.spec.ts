import { TestBed } from '@angular/core/testing';

import { GlobeState } from './globe-state';

describe('GlobeState', () => {
  let service: GlobeState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GlobeState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
