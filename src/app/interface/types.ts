export interface EventSearchResult {
  id: string;
  name: string;
  date: string;
  mag: number;
  lat: number;
  lon: number;
}

// For the /api/v1/grid_forecast endpoint (GeoJSON structure)
export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface GridCellProperties {
  continuity_index: number;
  status: string;
  forecast_time: string; // ISO 8601 date string
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONPolygon;
  properties: GridCellProperties;
}

export interface GridForecastResponse {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// For the /api/v1/backtest endpoints
export interface BacktestJob {
  job_id: string;
  status: 'processing';
}

export interface EventDetails {
    name: string;
    date: string;
    lat: number;
    lon: number;
    mag: number;
}

export interface BacktestResult {
    status: 'complete';
    event_details: EventDetails;
    plot_base64: string;
    ci_timeseries: { [date: string]: number };
}

export interface BacktestStatus {
    status: 'processing' | 'complete' | 'failed';
    result?: BacktestResult;
    error?: string;
}