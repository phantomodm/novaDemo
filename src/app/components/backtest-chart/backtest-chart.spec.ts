import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BacktestChart } from './backtest-chart';

describe('BacktestChart', () => {
  let component: BacktestChart;
  let fixture: ComponentFixture<BacktestChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BacktestChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BacktestChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
