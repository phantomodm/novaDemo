import { TestBed } from '@angular/core/testing';

import { Cesium } from './cesium';

describe('Cesium', () => {
  let service: Cesium;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Cesium);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
