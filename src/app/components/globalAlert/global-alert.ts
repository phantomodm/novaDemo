import { Component, OnInit, AfterViewInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
// --- NEW IMPORTS FOR DIALOG ---
import { App } from '../../app';
import { ForecastService } from '../../core/services/forecast';
import { MatDialogContent, MatDialogRef} from '@angular/material/dialog';

export interface GlobalAlertFeature {
  type: "Feature";
  properties: {
    cell_id: number;
    status: string;
    kappa_score: number;
    alert_start_time: string;
    last_updated_time: string;
    
    // --- NEW FIELDS ---
    lat: number;
    lon: number;
  };
  geometry: any;
}
@Component({
  selector: 'app-global-alert',
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogContent
  ],
  templateUrl: './global-alert.html',
  styleUrl: './global-alert.css'
})
export class GlobalAlertComponent implements OnInit, AfterViewInit {
  readonly dialogRef = inject(MatDialogRef<GlobalAlertComponent>);
  public forecastService = inject(ForecastService);
  public globalAlertData = this.forecastService.globalAlertData;
  displayedColumns = ['status', 'cell_id', 'kappa', 'actions'];
  dataSource = new MatTableDataSource<GlobalAlertFeature>([]);
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('appComponent') appComponent!: App;

  constructor(
    // --- INJECT DIALOG REF ---
    
  ) {
     // Load data immediately
     this.dataSource.data = this.forecastService.globalAlertData();
  }

  closeDialog() {
    console.log('Closing dialog from method');
    this.dialogRef.close();
  }

  ngOnInit() {
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch(property) {
        case 'status': return item.properties.status;
        case 'cell_id': return item.properties.cell_id;
        case 'kappa': return item.properties.kappa_score;
        default: return '';
      }
    };
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  // --- Actions ---

  flyToEvent(cell: GlobalAlertFeature) {
    // 1. Perform the action on the main map
    //this.appComponent.panToCell(cell as any);
    this.appComponent.flyToEvent(cell.properties.lat, cell.properties.lon, cell.properties.cell_id.toString());
    
    // 2. CLOSE THE MODAL so the user can see the map
    //this.dialogRef.close();
  }

  initiateBacktest(cell: GlobalAlertFeature) {
    // 1. Open the backtest panel
    this.appComponent.leftSidenav().open();
    this.appComponent.customLat = cell.properties.lat;
    this.appComponent.customLon = cell.properties.lon;
    
    // 2. CLOSE THE MODAL
    //this.dialogRef.close();
  }
}
