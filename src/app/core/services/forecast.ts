import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { GridForecastResponse, EventSearchResult } from '../../interface/types';

@Injectable({
  providedIn: 'root'
})
export class ForecastService {
  private apiUrl = 'https://boomtube-910896594298.us-central1.run.app'; // Base URL for FastAPI
  private http = inject(HttpClient);

  constructor() { }

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

  // New method to fetch the live grid data
  getGridForecast(): Observable<GridForecastResponse> {
    return this.http.get<GridForecastResponse>(`${this.apiUrl}/api/v1/grid_forecast`);
  }
}
