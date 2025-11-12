import { Component, OnInit, inject } from '@angular/core';
import { ForecastService } from '../../core/services/forecast'; // Import your service
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { BacktestSummaryResponse, BacktestSummary } from '../../core/models/features.model';

@Component({
  selector: 'app-backtest-summary',
  imports: [CommonModule, MatTableModule],
  templateUrl: './backtest-summary.html',
  styleUrl: './backtest-summary.css'
})
export class BacktestSummaryComponent implements OnInit {
  public results: any[] = [];
  public displayedColumns: string[] = ['event_name', 'status', 'lead_time_days', 'event_mag', 'event_date'];
  private forecastService = inject(ForecastService);
  
  constructor() {}

  ngOnInit() {
    this.forecastService.getBacktestSummary()
    .subscribe({
      next: (response: BacktestSummaryResponse) => {
        // Assign the data to our local array, which updates the table
        this.results = response.results;
      },
      error: (err) => {
        console.error("Failed to load backtest summary:", err);
      }
    });
  }
}
