import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { MatListModule, MatList, MatListItem } from '@angular/material/list';
import { MatIconModule, MatIcon } from '@angular/material/icon';
import { FeatureDriverKey, FeatureDay, DRIVER_NAMES_ICONS, KAPPA_WEIGHTS } from '../../core/models/features.model';
import { NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';

// The raw cell properties from your API
export interface CellProperties {
  cell_id: number;
  status: string;
  continuity_index: number;
  forecast_time: string;
  features_json: string; // This is a JSON string
}

// The format ngx-charts needs
interface ChartDataPoint {
  name: Date;
  value: number;
}
interface ChartSeries {
  name: string;
  series: ChartDataPoint[];
}

@Component({
  selector: 'app-cell-detail',
  imports: [MatList, MatListItem, MatIcon,DecimalPipe,NgxChartsModule],
  templateUrl: './cell-detail.html',
  styleUrl: './cell-detail.css'
})
export class CellDetail {
   // This component receives the selected cell as input
  @Input() selectedCell: CellProperties | null = null;

  // Data for the sparkline chart
  public chartData: ChartSeries[] = [];
  // Data for the "Top 3 Drivers" list
  public topDrivers: any[] = [];

  // Chart styling
  public colorScheme = {
    name: 'kappa',
    selectable: false,
    group: ScaleType.Linear,
    domain: ['#FF0000', '#FFA500', '#FFFF00', '#00BFFF', '#32CD32']
  };
  public chartGradient = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedCell'] && this.selectedCell) {
      this.processCellData(this.selectedCell);
    }
  }

  private processCellData(cell: CellProperties): void {
    try {
      const features: FeatureDay[] = JSON.parse(cell.features_json);
      if (!features || features.length === 0) return;

      this.generateChartData(features);
      this.findTopDrivers(features[features.length - 1]); // Get last day

    } catch (e) {
      console.error("Failed to parse features_json:", e);
      this.chartData = [];
      this.topDrivers = [];
    }
  }

  /**
   * Re-runs the fusion logic in the browser to build the chart
   */
  private generateChartData(features: FeatureDay[]): void {
    const ciSeries: ChartDataPoint[] = [];

    for (const day of features) {
      let finalCI = 1.0; // Start at 1.0 (Stable)

      for (const [key, k_val] of Object.entries(KAPPA_WEIGHTS)) {
        if (day[key] !== undefined) {
          const featureValue = day[key];
          const ciComponent = Math.exp(-k_val * featureValue);
          finalCI *= ciComponent;
        }
      }
      if (ciSeries.length > 0) {
        ciSeries.push({
          name: new Date(day.time),
          value: finalCI // Store the 0.0-1.0 stability score
        });
      } else {
        this.chartData = [];
      }
    }

    this.chartData = [{
      name: 'Stability (CI)',
      series: ciSeries
    }];
  }

  /**
   * Finds the top 3 anomalies from the most recent day's data
   */
  private findTopDrivers(latestDay: FeatureDay): void {
    const drivers = [];
    for (const [key, value] of Object.entries(latestDay)) {
      const driverKey = key as FeatureDriverKey;
      if (key in DRIVER_NAMES_ICONS && value > 0) {
        drivers.push({
          id: key,
          ...DRIVER_NAMES_ICONS[driverKey],
          value: value
        });
      }
    }

    // Sort by anomaly value, descending, and take the top 3
    this.topDrivers = drivers
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  }
}
