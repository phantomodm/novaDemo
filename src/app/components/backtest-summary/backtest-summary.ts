import { Component, OnInit, inject } from '@angular/core';
import { ForecastService } from '../../core/services/forecast'; // Import your service
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-backtest-summary',
  imports: [CommonModule, MatTableModule],
  templateUrl: './backtest-summary.html',
  styleUrl: './backtest-summary.css'
})
export class BacktestSummary {
  public results: any[] = [];
  public displayedColumns: string[] = ['event_name', 'status', 'lead_time_days', 'event_mag', 'event_date'];
  private forecastService = inject(ForecastService);
  
  constructor() {}

  ngOnInit() {
    this.forecastService.getBacktestSummary().subscribe((response:any) => {
      this.results = response.results;
    });
  }
}
