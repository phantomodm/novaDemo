import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

// We can re-use the GeoJSON interface from the ForecastService
import { ForecastResponse } from '../models/features.model';

@Injectable({
  providedIn: 'root'
})
export class GisDataService {
    private apiUrl = 'https://boomtube-910896594298.us-central1.run.app'; // Base URL for FastAPI
 // Use proxy base path

  // Cache the responses so we don't re-fetch static data
  public gnssStations$!: Observable<ForecastResponse>;
  public faultLines$!: Observable<ForecastResponse>;

  constructor(private http: HttpClient) { }

  /**
   * Fetches the GeoJSON of all configured GNSS stations.
   */
  getGnssStations(): Observable<ForecastResponse> {
    if (!this.gnssStations$) {
      this.gnssStations$ = this.http.get<ForecastResponse>(`${this.apiUrl}/api/v1/data/gnss_stations`).pipe(
        shareReplay(1) // Cache the result
      );
    }
    return this.gnssStations$;
  }

  /**
   * Fetches the GeoJSON of tectonic fault lines.
   */
  getFaultLines(): Observable<ForecastResponse> {
    if (!this.faultLines$) {
      this.faultLines$ = this.http.get<ForecastResponse>(`${this.apiUrl}/api/v1/data/fault_lines`).pipe(
        shareReplay(1) // Cache the result
      );
    }
    return this.faultLines$;
  }
}