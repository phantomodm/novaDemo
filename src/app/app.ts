import {
  Component,
  computed,
  signal,
  OnInit,
  inject,
  AfterViewInit,
  ElementRef,
  viewChild,
  effect,
  NgZone,
  ChangeDetectorRef,
} from '@angular/core';
//import { SwPush } from '@angular/service-worker';
import { RouterOutlet } from '@angular/router';
import { CesiumService } from './core/services/cesium';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule, MatChipSet, MatChip } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable, Subscription, interval, of } from 'rxjs';
import {
  switchMap,
  takeWhile,
  finalize,
  startWith,
  debounceTime,
  distinctUntilChanged,
  map,
  tap,
} from 'rxjs/operators';
import { ForecastService } from './core/services/forecast';
import { EventSearchResult, GridForecastResponse, BacktestJob } from './interface/types';
import { Chart as ChartModalComponent } from './components/chart/chart';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DataLayerSelector } from './components/data-layer-selector/data-layer-selector';
import { KappaLegend } from './components/kappa-legend/kappa-legend';
import { GlobalAlert } from './components/global-alert/global-alert';
import { CellDetail } from './components/cell-detail/cell-detail';
import { ActionPlan } from './components/action-plan/action-plan';
import { ForecastFeature, ForecastResponse } from './core/models/features.model';
import * as Cesium from 'cesium';
import { DataLayerKey } from './core/models/features.model';
import { GlobeState } from './core/services/globe-state';
import { BacktestChart } from './components/backtest-chart/backtest-chart';
import { BacktestSummaryComponent } from './components/backtest-summary/backtest-summary';
import { GisDataService } from './core/services/gis-data';

//declare let Cesium: any;
Cesium.Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiMDFmZjdiZS1mZWU0LTQ5MzktOTgxMC1jZTE2ZGE1YjhmMGUiLCJpZCI6MzUxMzI5LCJpYXQiOjE3NjA2NjI2NjF9.y_HaG_nTARNbnLD_S0FQUwEcUFJypnZ2kGxha2MgUjw';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSliderModule,
    MatProgressBarModule,
    MatListModule,
    MatDialogModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    ChartModalComponent,
    DataLayerSelector,
    KappaLegend,
    GlobalAlert,
    MatChipSet,
    MatChip,
    CellDetail,
    ActionPlan,
    BacktestChart,
    BacktestSummaryComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, AfterViewInit {
  private forecastService = inject(ForecastService);
  private globeStateService = inject(GlobeState);
  private gisDataService = inject(GisDataService);
  private sanitizer = inject(DomSanitizer);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private pollingSubscription: Subscription | null = null;

  public dialog: MatDialog = inject(MatDialog);
  protected readonly title = signal('novaDemo');
  readonly cesiumContainer = viewChild.required<ElementRef>('cesiumContainer');
  leftSidenav = viewChild.required<MatSidenav>('leftSidenav');
  rightSidenav = viewChild.required<MatSidenav>('rightSidenav');
  cesium = inject(CesiumService);
  selectedCell: any = null;
  //viewer!: Cesium.Viewer;
  viewer!: any;

  monthsBefore: number = 3;
  backtestState: 'idle' | 'processing' | 'complete' | 'failed' = 'idle';
  backtestJobId: string | null = null;
  backtestPlot: SafeUrl | null = null;
  backtestResult: any = null; // Simplified for brevity
  backtestError: string | null = null;

  // --- Properties for Autocomplete ---
  searchControl = new FormControl();
  filteredEvents$!: Observable<EventSearchResult[]>;

  // --- Properties for Global Status ---
  globalStatus = this.forecastService.globalStatus;
  statusClass = computed(() => {
    const status = this.globalStatus();
    return `status-${status.toLowerCase().replace('_plus', '')}`;
  });

  private gnssStationsData: ForecastResponse | null = null;
  private faultLinesData: ForecastResponse | null = null;

  constructor() {
    effect(() => {
      // 1. Get the current values from the signals
      const gridData = this.forecastService.gridData();
      const selectedLayerKey = this.globeStateService.selectedLayer();

      // 2. Honor your constraint: "do not update without both values present"
      //    We also must check if the 'viewer' has been initialized
      if (gridData && selectedLayerKey && this.viewer) {
        // 3. Run the heavy rendering logic outside Angular's zone
        this.ngZone.runOutsideAngular(() => {
          this.renderGlobeLayers(gridData, selectedLayerKey);
        });
      } else if (this.viewer) {
        // If data is null (e.g., loading or error), clear the globe
        this.ngZone.runOutsideAngular(() => {
          this.viewer.entities.removeAll();
        });
      }
    });
  }

  displayEvent(event: EventSearchResult): string {
    return event && event.name ? `${event.name} (${event.mag})` : '';
  }

  flyToEvent(lat: number, lon: number, name: string) {
    console.log(lat, lon, name);
    if (!this.viewer || !this.viewer.scene || !this.viewer.camera) {
      return;
    }
    this.viewer.entities.removeAll();
    const position = Cesium.Cartesian3.fromDegrees(lon, lat, 1500000);
    this.viewer.camera.flyTo({
      destination: position,
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
      duration: 3,
    });
    this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      point: {
        pixelSize: 15,
        color: Cesium.Color.RED,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
      },
      label: {
        text: name || 'Event Location',
        font: '16px sans-serif',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -20),
      },
    });
  }

  ngOnInit(): void {
    //this.cesium.plotPoints("cesium");
    //this.rightSidenav().open();
    this.gisDataService.getGnssStations().subscribe((data:any) => {
      this.gnssStationsData = data;
    });
    this.gisDataService.getFaultLines().subscribe((data) => {
      this.faultLinesData = data;
    });
    this.filteredEvents$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      tap((value) => {
        console.log('Autocomplete input:', value);
      }),
      switchMap((value) => {
        const query = typeof value === 'string' ? value : value?.name;
        return this.forecastService.searchEvents(query || '').pipe(
          map((earthquake) =>
            earthquake.map((e) => {
              const labelText = `M${e.mag} – ${e.date} ${e.name.split(' - ')[1]}`;
              return { ...e, name: labelText };
            })
          )
        );
      })
    );
  }

  ngAfterViewInit(): void {
    this.initiateGlobe();
    // We must initialize the viewer after the view is ready
  }
  initiateGlobe() {
    this.ngZone.runOutsideAngular(() => {
      this.viewer = new Cesium.Viewer(this.cesiumContainer().nativeElement, {
        animation: false,
        timeline: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        baseLayerPicker: false,
        navigationHelpButton: false,
        infoBox: false,
        selectionIndicator: false,
      });

      this.viewer.scene.skyAtmosphere.show = false;
      this.viewer.scene.skyBox.show = false;
      this.viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#1E1E1E');
      this.viewer.scene.globe.depthTestAgainstTerrain = true;

      // Add a spin to the globe
      this.viewer.clock.onTick.addEventListener(() => {
        this.viewer.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, 0.002);
      });

      // const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
      // handler.setInputAction((movement: any) => {
      //   const pickedObject = this.viewer.scene.pick(movement.position);
      //   if (Cesium.defined(pickedObject) && pickedObject.id?.properties) {
      //     this.ngZone.run(() => {
      //       this.selectedCell = pickedObject.id.properties.getValue(this.viewer.clock.currentTime);
      //       this.backtestState = 'idle'; // Ensure backtest panel closes
      //       this.rightSidenav().open();
      //       this.cdr.detectChanges(); // Manually trigger change detection
      //     });
      //   } else {
      //      this.ngZone.run(() => {
      //        this.rightSidenav().close();
      //      });
      //   }
      //}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    });
  }
  openChartModal(): void {
    if (this.backtestPlot) {
      const dialogRef = this.dialog.open(ChartModalComponent, {
        width: '90vw',
        maxWidth: '1200px',
        data: { plotUrl: this.backtestPlot },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result !== undefined) {
          console.log('The dialog was closed');
          this.rightSidenav().close();
        }
      });
    }
  }

  subscribeToAlerts() {
    // 1. Subscribe to the "global_alerts" topic
    // (This requires setting up your AngularFire/Service Worker)
    // ... logic to get permission and subscribe to "global_alerts" ...

    // 2. Listen for incoming messages
    this.swPush.messages.subscribe(
      (payload: any) => {
        console.log('Push notification received:', payload);
        
        const title = payload.notification.title;
        const body = payload.notification.body;
        const cellId = payload.data.cell_id;

        // 3. Show a snackbar
        this.snackBar.open(body, 'View', {
          duration: 10000,
          panelClass: ['alert-snackbar']
        }).onAction().subscribe(() => {
          // Pan the globe to the cell when the user clicks "View"
          // this.panToCellById(cellId);
        });
      }
    );
  }

  renderGlobeLayers(geoJsonData: ForecastResponse, selectedLayerKey: DataLayerKey | string) {
    if (!this.viewer) return;

    // Clear all entities
    this.viewer.entities.removeAll();

    // --- 1. Draw the primary grid data (if it's loaded) ---
    if (geoJsonData) {
      geoJsonData.features.forEach((feature: ForecastFeature) => {
        let valueToRender = 0.0;
        let color: Cesium.Color;

        // ... (This is your existing logic from renderGrid)
        try {
          if (selectedLayerKey === 'final_ci') {
            valueToRender = feature.properties.continuity_index;
            color = this.getColorForCI(valueToRender);
          } else {
            const featureHistory = JSON.parse(feature.properties.features_json);
            const latestDay = featureHistory[featureHistory.length - 1];
            valueToRender = latestDay[selectedLayerKey] || 0;
            color = this.getColorForFeature(valueToRender);
          }
        } catch (e) {
          color = Cesium.Color.BLACK.withAlpha(0.0);
        }

        this.viewer.entities.add({
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(feature.geometry.coordinates[0].flat()),
            material: color.withAlpha(0.6),
            outline: true,
            outlineColor: Cesium.Color.WHITE.withAlpha(0.1),
          },
          properties: feature.properties,
          description: `...`, // Your tooltip
        });
      });
    }

    // --- 2. Draw the GNSS Stations (if selected) ---
    if (selectedLayerKey === 'gnss_stations' && this.gnssStationsData) {
      this.gnssStationsData.features.forEach((station:any) => {
        this.viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(
            station.geometry.coordinates[0],
            station.geometry.coordinates[1]
          ),
          point: {
            pixelSize: 6,
            color: Cesium.Color.AQUA,
          },
          properties: station.properties,
          description: `
          <div class="tooltip">
            <strong>Station:</strong> ${station.properties.station_id} <br>
            <strong>Name:</strong> ${station.properties.station_name}
          </div>
        `,
        });
      });
    }

    // --- 3. Draw the Fault Lines (if selected) ---
    if (selectedLayerKey === 'fault_lines' && this.faultLinesData) {
      this.faultLinesData.features.forEach((fault:any) => {
        this.viewer.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray(fault.geometry.coordinates.flat()),
            width: 2,
            material: Cesium.Color.RED,
          },
          properties: fault.properties,
          description: `
          <div class="tooltip">
            <strong>Fault Line</strong>
          </div>
        `,
        });
      });
    }
  }
  /**
   * Returns a color based on the "Kappa" alert status
   * (Assumes CI is a stability score from 0.0 to 1.0)
   */
  getColorForCI(ciValue: number): Cesium.Color {
    // Convert 0.0-1.0 stability score to 1.0-0.0 instability score (Kappa)
    const kappa = 1.0 - ciValue;

    // These colors match your kappa-engine.css
    if (kappa >= 1.25) return Cesium.Color.RED; // CRITICAL
    if (kappa >= 0.95) return Cesium.Color.ORANGE; // ALERT
    if (kappa >= 0.85) return Cesium.Color.YELLOW; // ADVISORY
    if (kappa >= 0.75) return Cesium.Color.DEEPSKYBLUE; // WATCH

    // Default to a semi-transparent green for STABLE
    return Cesium.Color.LIMEGREEN.withAlpha(0.5); // GREEN
  }

  /**
   * Returns a simple "heat" color for raw feature data
   * (Assumes value is a normalized anomaly score 0.0 to 1.0)
   */
  getColorForFeature(value: number): Cesium.Color {
    if (value <= 0.01) {
      // No anomaly, make it mostly transparent
      return Cesium.Color.BLUE.withAlpha(0.2);
    }
    // Simple heatmap: blue (low) -> yellow (mid) -> red (high)
    return Cesium.Color.fromHsl(
      0.6 * (1.0 - value), // Hue (0.6=Blue, 0.3=Green, 0.1=Yellow, 0.0=Red)
      1.0, // Saturation
      0.5 // Lightness
    );
  }

  /**
   * Opens a modal dialog to display the
   * historical backtest summary table.
   */
  openBacktestSummary(): void {
    this.dialog.open(BacktestSummaryComponent, {
      width: '80vw', // Make it wide
      maxWidth: '1200px',
      autoFocus: false,
    });
  }

  runBacktest() {
    const selectedEvent = this.searchControl.value as EventSearchResult;
    if (!selectedEvent || !selectedEvent.id) {
      return;
    }
    //this.flyToEvent(selectedEvent.lat, selectedEvent.lon, selectedEvent.name);
    this.backtestState = 'processing';
    this.backtestResult = null;
    this.backtestError = null;
    this.rightSidenav().open();

    this.forecastService.startBacktest(selectedEvent.id, this.monthsBefore).subscribe({
      next: (job: BacktestJob) => {
        this.backtestJobId = job.job_id;
        console.log('Backtest job started with ID:', job.job_id);
        this.pollForResults(job.job_id);
      },
      error: (err) => {
        this.backtestState = 'failed';
        this.backtestError = 'Could not start the job.';
      },
    });
  }

  pollForResults(jobId: string): void {
    if (!jobId) {
      return;
    }
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
    this.pollingSubscription = interval(3000)
      .pipe(
        switchMap(() => this.forecastService.getBacktestResults(jobId)),
        tap((r) => console.log(r)),
        takeWhile((status) => status.status === 'processing', true)
      )
      .subscribe({
        next: (status) => {
          console.log(status);
          if (status.status === 'complete') {
            this.backtestState = 'complete';
            this.backtestResult = status.result;
            this.flyToEvent(
              this.backtestResult.event_details.lat,
              this.backtestResult.event_details.lon,
              this.backtestResult.event_details.name
            );
            this.backtestPlot = this.sanitizer.bypassSecurityTrustUrl(
              'data:image/png;base64,' + status.result.plot_base64
            );
          } else if (status.status === 'failed') {
            this.backtestState = 'failed';
            this.backtestError = 'Backtest job failed on server.';
            this.rightSidenav().close();
          } else {
            console.log('Backtest job still processing...');
          }
        },
      });
  }
}
