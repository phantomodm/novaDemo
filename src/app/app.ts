import {
  Component,
  signal,
  OnInit,
  inject,
  AfterViewInit,
  ElementRef,
  viewChild,
  NgZone,
  ChangeDetectorRef
} from '@angular/core';
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
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable, Subscription, interval, of } from 'rxjs';
import { switchMap, takeWhile, finalize, startWith, debounceTime, distinctUntilChanged, map, tap } from 'rxjs/operators';
import { ForecastService } from './core/services/forecast';
import { EventSearchResult, GridForecastResponse, BacktestJob } from './interface/types';
import { Chart as ChartModalComponent } from './components/chart/chart';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

declare let Cesium: any;
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
    MatFormFieldModule,
    MatInputModule,
    MatSliderModule,
    MatProgressBarModule,
    MatListModule,
    MatDialogModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    ChartModalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, AfterViewInit {
  private forecastService = inject(ForecastService);
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

  constructor() {}
  
  displayEvent(event: EventSearchResult): string {
    return event && event.name ? `${event.name} (${event.mag})` : '';
  }

  flyToEvent(lat: number, lon: number, name: string) {
    console.log(lat,lon,name)
    if(!this.viewer || !this.viewer.scene || !this.viewer.camera) { return; }
    this.viewer.entities.removeAll();
    const position = Cesium.Cartesian3.fromDegrees(lon, lat, 1500000);
    this.viewer.camera.flyTo({
      destination: position,
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
      },
      duration: 3
    });
    this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      point: { pixelSize: 15, color: Cesium.Color.RED, outlineColor: Cesium.Color.WHITE, outlineWidth: 2 },
      label: {
            text: name || 'Event Location',
            font: '16px sans-serif',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20) 
          }
    });
  }

  ngOnInit(): void {
    //this.cesium.plotPoints("cesium");
    this.filteredEvents$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      tap(value => {console.log('Autocomplete input:', value);}),
      switchMap(value => {
        const query = typeof value === 'string' ? value : value?.name;
        return this.forecastService.searchEvents(query || '')
          .pipe(
            map((earthquake) => earthquake.map((e) => {
              const labelText = `M${e.mag} – ${e.date} ${e.name.split(" - ")[1]}`;
              return { ...e, name: labelText };
            }) )
          );
      })
    );
  }

  ngAfterViewInit(): void {
    this.initiateGlobe();
    this.loadGridData();
    // We must initialize the viewer after the view is ready
  }
  initiateGlobe(){
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
        data: { plotUrl: this.backtestPlot }
      });
      
      dialogRef.afterClosed().subscribe((result) => {
        if(result !== undefined){
          console.log('The dialog was closed');
          this.rightSidenav().close();
        }
      })
    }
  }
  loadGridData() {
    this.forecastService.getGridForecast().subscribe({
      next: (geoJsonData) => {
        this.ngZone.runOutsideAngular(() => {
          console.log(geoJsonData)
          this.renderGrid(geoJsonData);
        });
      },
      error: (err) => {
        console.error("Failed to load grid forecast data", err);
      }
    });
  }
  renderGrid(geoJsonData: GridForecastResponse) {
    // Clear any existing polygons
    this.viewer.entities.removeAll();

    geoJsonData.features.forEach(feature => {
      const ciValue = feature.properties.continuity_index;

      this.viewer.entities.add({
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(feature.geometry.coordinates[0].flat()),
          material: this.getColorForCI(ciValue).withAlpha(0.6),
          outline: true,
          outlineColor: Cesium.Color.WHITE.withAlpha(0.1)
        },
        properties: feature.properties,
        description: `
          <div class="tooltip">
            <strong>Continuity Index:</strong> ${ciValue.toFixed(4)} <br>
            <strong>Status:</strong> ${feature.properties.status}
          </div>
        `
      });
    });
  }
  getColorForCI(ci: number): any {
    if (ci < 0.1) return Cesium.Color.YELLOW; // Unstable
    if (ci < 0.5) return Cesium.Color.ORANGE; // Elevated Risk
    // For stable, let's use a transparent or very dark blue so it blends in
    return Cesium.Color.fromCssColorString('#1E90FF').withAlpha(0.2); 
  }

  runBacktest() {
    const selectedEvent = this.searchControl.value as EventSearchResult;
    if (!selectedEvent || !selectedEvent.id) { return; }
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
      }
    });
  }

  pollForResults(jobId: string): void {
    if (!jobId) { return; }
    if(this.pollingSubscription){
      this.pollingSubscription.unsubscribe();
    }
    this.pollingSubscription = interval(3000).pipe(
      switchMap(() => this.forecastService.getBacktestResults(jobId)),
      tap((r) => console.log(r)),
      takeWhile((status) => status.status === 'processing', true),
    ).subscribe({
      next: (status) => {
        console.log(status)
        if (status.status === 'complete') {
            this.backtestState = 'complete';
            this.backtestResult = status.result;
            this.flyToEvent(
              this.backtestResult.event_details.lat,
              this.backtestResult.event_details.lon,
              this.backtestResult.event_details.name
            );
            this.backtestPlot = this.sanitizer.bypassSecurityTrustUrl('data:image/png;base64,' + status.result.plot_base64);
        } else if (status.status === 'failed') {
            this.backtestState = 'failed';
            this.backtestError = 'Backtest job failed on server.';
            this.rightSidenav().close();
        } else {
            console.log('Backtest job still processing...');
        }
      }
    });
  }

}
