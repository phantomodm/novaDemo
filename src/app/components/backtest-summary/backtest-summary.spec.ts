import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BacktestSummary } from './backtest-summary';

describe('BacktestSummary', () => {
  let component: BacktestSummary;
  let fixture: ComponentFixture<BacktestSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BacktestSummary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BacktestSummary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
