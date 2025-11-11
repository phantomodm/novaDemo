import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataLayerSelector } from './data-layer-selector';

describe('DataLayerSelector', () => {
  let component: DataLayerSelector;
  let fixture: ComponentFixture<DataLayerSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataLayerSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataLayerSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
