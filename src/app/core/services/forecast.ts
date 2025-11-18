import { Injectable, inject, signal, WritableSignal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of, catchError, tap, switchMap, timer } from 'rxjs';
import { GridForecastResponse, EventSearchResult } from '../../interface/types';
import { STATUS_RANK, ForecastFeature, StatusKey, ForecastResponse, BacktestSummaryResponse, BacktestSummary} from '../models/features.model';

// Define the API response for the action plan
export interface ActionPlan {
  id: string;
  type: string;
  summary: string;
  actions: { action: string; priority: number; zone?: string }[];
}

// Define the API response for the simulation
export interface SimulationResult {
  status: string;
  result_url: string;
}

export interface WatchlistFeature {
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



@Injectable({
  providedIn: 'root'
})
export class ForecastService {
  private apiUrl = 'https://boomtube-910896594298.us-central1.run.app'; // Base URL for FastAPI
  private http = inject(HttpClient);
  private planApiUrl = '/api/v1/prescriptive/generate_plan_auto';
  private simApiUrl = '/api/v1/consequence/simulate';

  public gridData: WritableSignal<ForecastResponse | null> = signal(null);
  public globalStatus: WritableSignal<string> = signal('GREEN');
   public globalAlertData = signal<WatchlistFeature[]>([]);

  constructor() {
    // Start polling the API for live data when the service is created
    this.startPolling();
  }

  // Poll the API every 60 seconds
  private startPolling(): void {
    timer(0, 60000).pipe( // 0s delay, then every 60,000 ms
      // switchMap(() => this.fetchForecastData())
      switchMap(() => {
        return forkJoin({
          grid: this.fetchForecastData(),
          watchlist: this.fetchWatchlistData()
        });
      }
        
      )
    ).subscribe({
      next: () => {},
      error: (err) => {
        console.error("Polling error:", err);
      }
    });
  }
  private fetchWatchlistData(): Observable<any> {
    const url = `${this.apiUrl}/v1/forecast/watchlist`;
    return this.http.get<any>(url).pipe(
      tap(response => {
        console.log("Watchlist response:", response);
        if (response && response.data && response.data.features) {
          this.globalAlertData.set(response.data.features);
        } else {
          this.globalAlertData.set([]);
        }
      }),
      catchError(err => {
        console.error("Error fetching watchlist:", err);
        return of(null);
      })
    );
  }

  private fetchForecastData(): Observable<ForecastResponse | null> {
    return this.http.get<ForecastResponse>(`${this.apiUrl}/api/v1/grid_forecast`).pipe(
      tap((response: any) => {
        // 1. Update the grid data for the globe
        console.log("Forecast response:", response);
        this.gridData.set(response);

        // 2. Calculate and update the global status
        const worstStatus = this.calculateWorstStatus(response.features);
        this.globalStatus.set(worstStatus);
      }),
      catchError((err: any) => {
        console.error("Error fetching forecast data:", err);
        this.globalStatus.set('UNKNOWN'); // Set status to UNKNOWN on error
        return of(null); // Return an observable of null on error
      })
    );
  }

  healthCheck(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/ping`);
  }

  searchEvents(query: string): Observable<EventSearchResult[]> {
    if (!query.trim()) {
      return of([]);
    }
    const params = new HttpParams().set('q', query);
    return this.http.get<EventSearchResult[]>(`${this.apiUrl}/api/search_events`, { params });
  }

  startBacktest(eventId: string, months: number): Observable<any> {
    const params = new HttpParams().set('event_id', eventId).set('months_before', months.toString());
    return this.http.post<any>(`${this.apiUrl}/api/v1/backtest`, null, { params });
  }

  getBacktestResults(jobId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/v1/backtest/results/${jobId}`);
  }

  // In ForecastService or a new BacktestService
  getBacktestSummary(): Observable<BacktestSummaryResponse> {
    return this.http.get<BacktestSummaryResponse>(`${this.apiUrl}/api/v1/backtest/summary`);
  }

  // New method to fetch the live grid data
  getGridForecast(): Observable<GridForecastResponse> {
    return this.http.get<GridForecastResponse>(`${this.apiUrl}/api/v1/grid_forecast`);
  }

  private calculateWorstStatus(features: ForecastFeature[]): string {
    if (!features || features.length === 0) {
      return 'GREEN'; 
    }

    let worstRank = -1;
    let worstStatus = 'GREEN';

    for (const feature of features) {
      
      // --- THIS IS THE FIX (PART 2) ---
      // Cast the generic 'string' to our specific 'StatusKey' type
      const status = feature.properties.status.toUpperCase() as StatusKey;
      
      // This line will now pass the linter check
      const rank = STATUS_RANK[status] || -1;

      if (rank > worstRank) {
        worstRank = rank;
        worstStatus = status;
      }
    }
    return worstStatus;
  }

  // Helper function to get a CSS class for the status
  getStatusClass(status: string): string {
    return `status-${status.toLowerCase().replace('_plus', '')}`;
  }

  /**
   * Calls the API to generate an automatic action plan.
   * This endpoint is tier-gated and requires a 'ci' user.
   */
  generateActionPlan(): Observable<{ status: string, plan: ActionPlan }> {
    return this.http.get<{ status: string, plan: ActionPlan }>(`${this.apiUrl}/${this.planApiUrl}`);
  }

  /**
   * Calls the API to run a "what-if" simulation.
   * This endpoint is tier-gated and requires a 'ci' user.
   */
  runSimulation(lat: number, lon: number, mag: number, type: 'tsunami' | 'liquefaction'): Observable<SimulationResult> {
    const body = {
      lat: lat,
      lon: lon,
      magnitude: mag,
      type: type
    };
    return this.http.post<SimulationResult>(`${this.apiUrl}/${this.simApiUrl}`, body);
  }
}
