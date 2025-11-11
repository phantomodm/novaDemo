import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KappaLegend } from './kappa-legend';

describe('KappaLegend', () => {
  let component: KappaLegend;
  let fixture: ComponentFixture<KappaLegend>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KappaLegend]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KappaLegend);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
