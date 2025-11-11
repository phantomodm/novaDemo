import { Component, input, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DRIVER_NAMES_ICONS,FeatureDriverKey } from '../../core/models/features.model';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ChartSeries, ChartDataPoint, FeatureDay } from '../../core/models/features.model';
import { NgxChartsModule, ScaleType, Color } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-backtest-chart',
  standalone: true,
  imports: [
    CommonModule,
    NgxChartsModule,
    MatCheckboxModule,

  ],
  templateUrl: './backtest-chart.html',
  styleUrls: ['./backtest-chart.css']
})


export class BacktestChart {

// --- 1. Use Signal-based Inputs ---
  ciTimeseries = input.required<{ [key: string]: number } | null>();
  featuresJson = input.required<string | null>();

  // --- 2. Create Writable Signals for state ---
  public featureToggles = signal<{ [key: string]: boolean }>({});
  public driverNames = signal(DRIVER_NAMES_ICONS);
  private rawFeatures = signal<FeatureDay[]>([]);
  private mainCiSeries = signal<ChartSeries | null>(null);

  // --- 3. Create Computed Signals for derived data ---
  public chartData = computed(() => {
    const mainSeries = this.mainCiSeries();
    const toggles = this.featureToggles();
    const features = this.rawFeatures();

    if (!mainSeries) return [];

    const newChartData: ChartSeries[] = [mainSeries];

    // Add series for any "on" toggles
    for (const [key, toggledOn] of Object.entries(toggles)) {
      if (toggledOn) {
        
        // --- FIX for TS7053 (Type Casting) ---
        const driverKey = key as FeatureDriverKey;

        const featureSeries: ChartDataPoint[] = features.map(day => ({
          name: new Date(day.time),
          value: day[driverKey] || 0 // Use the typed key
        }));
        
        newChartData.push({
          name: DRIVER_NAMES_ICONS[driverKey]?.name || key, // Use the typed key
          series: featureSeries
        });
      }
    }
    return newChartData;
  });
  
  // --- (Chart styling properties are unchanged) ---
  // Add the type "Color" to the property
  public colorScheme: Color = {
    name: 'main',
    selectable: false,
    group: ScaleType.Linear,
    domain: ['#000000', '#FF0000', '#FFA500', '#FFFF00', '#00BFFF', '#32CD32', '#8A2BE2', '#FFC0CB', '#A52A2A', '#00FFFF', '#FF00FF', '#7FFF00', '#D2691E']
  };

  // Do the same for your other color scheme
  public ciColorScheme: Color = {
    name: 'ci',
    selectable: false,
    group: ScaleType.Linear,
    domain: ['#000000'] // Black for the main line
  };

  constructor() {
    // --- 4. Use an effect to react to Input changes ---
    // This REPLACES ngOnChanges and processData
    effect(() => {
      const ciData = this.ciTimeseries();
      const jsonData = this.featuresJson();

      if (ciData && jsonData) {
        // --- All processing logic is now inside the effect ---
        
        // 1. Parse the main CI series
        const ciSeriesPoints: ChartDataPoint[] = Object.entries(ciData).map(([date, value]) => ({
          name: new Date(date),
          value: 1.0 - (value as number) // Convert from Fuser (0=unstable) to Kappa (1=unstable)
        }));
        this.mainCiSeries.set({ name: '12D Instability (Kappa)', series: ciSeriesPoints });
        
        // 2. Parse the raw 12D features
        try {
          this.rawFeatures.set(JSON.parse(jsonData));
        } catch (e) {
          console.error("Failed to parse features_json:", e);
          this.rawFeatures.set([]);
        }

        // 3. Reset toggles
        this.featureToggles.set({});
      }
    });
  }

  // --- ADD THIS NEW HELPER FUNCTION ---
  /**
   * Helper function to safely get the boolean state of a toggle
   * for the template, which fixes the linter error.
   */
  public isToggleChecked(key: string): boolean {
    // Read the value from the signal
    const toggles = this.featureToggles();
    return toggles[key] || false;
  }

  // --- 5. Create a method to update the toggle signal ---
  // This REPLACES updateChart()
  public onToggleChange(key: string, isChecked: boolean): void {
    this.featureToggles.update(toggles => {
      return {
        ...toggles,
        [key]: isChecked
      };
    });
  }
}