import { Component, effect, computed, inject, OnInit, ViewChild, signal, Signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { DecimalPipe, DatePipe, AsyncPipe } from '@angular/common';
import { map } from 'rxjs/operators';
import { ForecastFeature, ForecastResponse } from '../../core/models/features.model';
import { ForecastService } from '../../core/services/forecast';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-global-alert1',
  imports: [MatCardModule, MatIconModule, MatTabsModule, DatePipe, MatListModule, DecimalPipe],
  templateUrl: './global-alert.html',
  styleUrl: './global-alert.css',
})
export class GlobalAlert1 {
  @ViewChild('rightSidenav') public rightSidenav!: MatSidenav;
  public forecastService = inject(ForecastService);
  globalStatus$ = this.forecastService.globalStatus;
  globalStatusClass = computed(() => {
    const status = this.globalStatus$();
    return `status-${status.toLowerCase().replace('_plus', '')}`;
  });

  gridData = computed(() => this.forecastService.gridData() as ForecastResponse | null);
  selectedCell: any = null;

  // --- NEW Property for the Alert List ---
  public alertList: any[] = [];
  

  constructor() {
    effect(() => {
      const response = this.gridData();
      if (!response || !response.features) {
        this.alertList = [];
        return;
      }
      this.alertList = response.features.filter(
        (cell: any) => cell.properties.status !== 'GREEN' && cell.properties.status !== 'STABLE'
      );
    });
  }

  ngOnInit() {

    
  }

  // --- NEW: Function to pan the globe ---
  panToCell(cell: ForecastFeature) {
    // 1. Set the selected cell to show the inspector tab
    this.selectedCell = cell;

    // 2. Open the sidenav
    this.rightSidenav.open();

    // 3. Pan the globe (assuming you have a globe service)
    // this.globeService.panTo(cell.geometry.coordinates);
    console.log('Panning to cell:', cell.properties.cell_id);
  }

  // --- NEW: Helper to get the right icon ---
  getStatusIcon(status: string): string {
    switch (status) {
      case 'GREEN':
        return 'check_circle';
      case 'WATCH':
        return 'visibility';
      case 'ADVISORY':
        return 'info';
      case 'ALERT':
        return 'warning';
      case 'CRITICAL':
        return 'crisis_alert';
      case 'PRECRITICAL_PLUS':
        return 'crisis_alert';
      default:
        return 'help_outline';
    }
  }
}
