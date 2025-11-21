import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject,
  inject,
  input,
  effect,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DRIVER_NAMES_ICONS, FeatureDriverKey } from '../../core/models/features.model';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ChartSeries, ChartDataPoint, FeatureDay } from '../../core/models/features.model';
import { NgxChartsModule, ScaleType, Color } from '@swimlane/ngx-charts';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

interface DialogData {
  ciTimeseries: { [key: string]: number } | null;
  featuresJson: string | null;
  leadTimeDays: number;
}

@Component({
  selector: 'app-backtest-chart',
  standalone: true,
  imports: [CommonModule, NgxChartsModule, MatCheckboxModule],
  templateUrl: './backtest-chart.html',
  styleUrls: ['./backtest-chart.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BacktestChart implements OnInit {
  // --- 1. Use Signal-based Inputs ---
  ciTimeseries!: { [key: string]: number };
  featuresJson!: any;
  leadTimeDays!: number;

  // --- 2. Create Writable Signals for state ---
  public featureToggles = signal<{ [key: string]: boolean }>({});
  public driverNames = signal(DRIVER_NAMES_ICONS);
  private rawFeatures = signal<FeatureDay[]>([]);
  private mainCiSeries = signal<ChartSeries | null>(null);
  public featureSeries = signal<any[]>([]);

  // --- 3. Create Computed Signals for derived data ---
  public chartData = computed(() => {
    const mainSeries = this.mainCiSeries();
    const toggles = this.featureToggles();
    const features = this.rawFeatures();

    if (!mainSeries || !mainSeries.series || mainSeries.series.length === 0) {
      return [];
    }

    const newChartData: ChartSeries[] = [mainSeries];

    // Add series for any "on" toggles
    for (const [key, toggledOn] of Object.entries(toggles)) {
      if (toggledOn) {
        // --- FIX for TS7053 (Type Casting) ---
        const driverKey = key as FeatureDriverKey;

        if (features && features.length > 0) {
          const featureSeries: ChartDataPoint[] = features.map((day) => ({
            name: new Date(day.time),
            value: day[driverKey] || 0, // Use the typed key
          }));

          newChartData.push({
            name: DRIVER_NAMES_ICONS[driverKey]?.name || key, // Use the typed key
            series: featureSeries,
          });
        }
      }
    }
    return newChartData;
  });

  public referenceLines = computed(() => {
    const days = this.leadTimeDays;
    const series = this.mainCiSeries();

    // Safety checks
    if (!days || days <= 0 || !series || !series.series || series.series.length === 0) {
      return [];
    }

    // 1. Find the end date (Mainshock date)
    // We assume the series is sorted, so the last point is the mainshock
    const lastPoint = series.series[series.series.length - 1];
    const mainshockDate = new Date(lastPoint.name);

    // 2. Calculate the "Signal Date"
    const signalDate = new Date(mainshockDate);
    signalDate.setDate(signalDate.getDate() - days);

    // 3. Return the line configuration for ngx-charts
    return [
      {
        name: `Signal Detected (${days}d lead)`,
        value: signalDate,
      },
      {
        name: 'Mainshock',
        value: mainshockDate,
      },
    ];
  });

  // --- (Chart styling properties are unchanged) ---
  // Add the type "Color" to the property
  public colorScheme: Color = {
    name: 'main',
    selectable: false,
    group: ScaleType.Linear,
    domain: [
      '#000000',
      '#FF0000',
      '#FFA500',
      '#FFFF00',
      '#00BFFF',
      '#32CD32',
      '#8A2BE2',
      '#FFC0CB',
      '#A52A2A',
      '#00FFFF',
      '#FF00FF',
      '#7FFF00',
      '#D2691E',
    ],
  };

  // Do the same for your other color scheme
  public ciColorScheme: Color = {
    name: 'ci',
    selectable: false,
    group: ScaleType.Linear,
    domain: ['#000000'], // Black for the main line
  };

  constructor(
    public dialogRef: MatDialogRef<BacktestChart>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    console.log('Dialog data received:', data);
    this.leadTimeDays = data.leadTimeDays;
    this.ciTimeseries = data.ciTimeseries;
    this.featuresJson = JSON.parse(data.featuresJson);

    effect(() => {
      const ciData = this.ciTimeseries;
      const jsonData = this.featuresJson;

      if (ciData && jsonData) {
        this.processData(ciData, jsonData);
      }
    });
  }

  private processData(ciData: { [key: string]: number }, jsonData: unknown): void {
    // 1. Parse the main CI series
    const ciSeriesPoints: ChartDataPoint[] = Object.entries(ciData).map(([date, value]) => ({
      name: new Date(date),
      value: 1.0 - value, // Convert from Fuser (0=unstable) to Kappa (1=unstable)
    }));
    this.mainCiSeries.set({ name: '12D Instability (Kappa)', series: ciSeriesPoints });

    // 2. Parse the raw 12D features safely
    let parsedFeatures: any[] = [];
    try {
      if (typeof jsonData === 'string') {
        parsedFeatures = JSON.parse(jsonData);
      } else if (Array.isArray(jsonData)) {
        parsedFeatures = jsonData;
      } else {
        console.warn('Unexpected featuresJson type:', typeof jsonData);
      }
    } catch (e) {
      console.error('Failed to parse features_json:', e);
      parsedFeatures = [];
    }
    this.rawFeatures.set(parsedFeatures);

    // 3. Transform features into ngx-charts format automatically
    const chartData =
      parsedFeatures.length > 0
        ? Object.keys(parsedFeatures[0])
            .filter((k) => k !== 'time') // exclude the timestamp field
            .map((key) => ({
              name: key,
              series: parsedFeatures.map((f) => ({
                name: new Date(f.time).toISOString(),
                value: f[key],
              })),
            }))
        : [];

    this.featureSeries.set(chartData);

    // Set up initial toggles to "off"
    const toggles = chartData.reduce((acc, series) => {
      acc[series.name] = true;
      return acc;
    }, {} as Record<string, boolean>);
    this.featureToggles.set(toggles);

    // 4. Reset toggles
    this.featureToggles.set(toggles);
  }

  ngOnInit(): void {
    // Process the data injected into the dialog
    if (this.data.ciTimeseries && this.data.featuresJson) {
      this.processData(this.data.ciTimeseries, this.data.featuresJson);
    }
  }
  ngOnChanges(): void {}

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
    this.featureToggles.update((toggles) => {
      return {
        ...toggles,
        [key]: isChecked,
      };
    });
  }
}
