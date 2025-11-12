export const KAPPA_WEIGHTS = {
  'f1_seismic_rate': 3.0, 'f2_gnss_anomaly': 2.5, 'f3_tec_anomaly': 2.0,
  'f4_b_value': 2.8, 'f5_clustering': 2.2, 'f6_omori': 2.0,
  'f7_geomag_anomaly': 1.8, 'f8_thermal_anomaly': 1.5, 'f9_radon_anomaly': 1.7,
  'f10_kernel_energy': 3.2, 'f11_depth_trend': 2.5, 'f12_tidal_stress': 0.5
};

// Define a ranking for our alert states
export const STATUS_RANK = {
  "CRITICAL": 5,
  "PRECRITICAL_PLUS": 4,
  "ALERT": 3,
  "ADVISORY": 2,
  "WATCH": 1,
  "GREEN": 0,
  "STABLE": 0, // Handle old 'STABLE' status
  "UNKNOWN": -1,
  "NO_DATA": -1
};

// This is the object you've defined in multiple places
export const DRIVER_NAMES_ICONS = {
  'f1_seismic_rate': { name: 'Seismic Rate', icon: 'trending_up' },
  'f2_gnss_anomaly': { name: 'GNSS Anomaly', icon: 'satellite_alt' },
  'f3_tec_anomaly': { name: 'TEC Anomaly', icon: 'bolt' },
  'f4_b_value': { name: 'b-value Drop', icon: 'insights' },
  'f5_clustering': { name: 'Spatial Clustering', icon: 'hub' },
  'f6_omori': { name: 'Omori Anomaly', icon: 'history_toggle_off' },
  'f7_geomag_anomaly': { name: 'Geomagnetic', icon: 'public' },
  'f8_thermal_anomaly': { name: 'Thermal Anomaly', icon: 'local_fire_department' },
  'f9_radon_anomaly': { name: 'Radon Anomaly', icon: 'gas_meter' },
  'f10_kernel_energy': { name: 'Kernel Energy', icon: 'waves' },
  'f11_depth_trend': { name: 'Depth Trend', icon: 'arrow_upward' },
  'f12_tidal_stress': { name: 'Tidal Stress', icon: 'nights_stay' },
};

export interface ForecastResponse {
  type: "FeatureCollection";
  features: ForecastFeature[];
}

/**
 * Interface for a single row in the 'backtest_results' table.
 * This represents the final summary for a single backtested event
 * (either an unstable quake or a stable period).
 */
export interface BacktestSummary {
  // Note: 'event_name' is not in the database table,
  // so it is not included here.
  
  event_date: string;       // ISO timestamp string
  event_mag: number;        // e.g., 9.1 or 0 (for stable)
  event_lat: number;        // e.g., 38.322
  event_lon: number;        // e.g., 142.369
  cell_id: number;          // e.g., 588
  status: 'SUCCESS' | 'FAILED'; // 'SUCCESS' (1) or 'FAILED' (0)
  lead_time_days: number;   // e.g., 28 or 0
}

/**
 * Interface for the full API response from the
 * GET /v1/backtest/summary endpoint.
 */
export interface BacktestSummaryResponse {
  status: 'success' | 'error';
  results: BacktestSummary[];
}

export interface FeatureDay { time: string; [key: string]: any; }
export interface ChartDataPoint { name: Date; value: number; }
export interface ChartSeries { name: string; series: ChartDataPoint[]; }
export const DATA_LAYERS = {
  'final_ci': 'Final Fused CI (Alerts)',
  'gnss_stations': 'GIS: GNSS Stations',
  'fault_lines': 'GIS: Tectonic Faults',
  'f1_seismic_rate': 'f1: Seismic Rate',
  'f2_gnss_anomaly': 'f2: GNSS Anomaly',
  'f3_tec_anomaly': 'f3: TEC Anomaly',
  'f4_b_value': 'f4: b-value',
  'f5_clustering': 'f5: Clustering',
  'f6_omori': 'f6: Omori',
  'f7_geomag_anomaly': 'f7: Geomagnetic',
  'f8_thermal_anomaly': 'f8: Thermal Anomaly',
  'f9_radon_anomaly': 'f9: Radon Anomaly',
  'f10_kernel_energy': 'f10: Kernel Energy',
  'f11_depth_trend': 'f11: Depth Trend',
  'f12_tidal_stress': 'f12: Tidal Stress',
};
export const LAYER_KEYS = Object.keys(DATA_LAYERS);
export interface ForecastFeature {
  type: "Feature";
  properties: {
    cell_id: number;
    status: string; // "GREEN", "WATCH", "ALERT", "CRITICAL", etc.
    continuity_index: number; // The final fused score (0.0 - 1.0)
    forecast_time: string; // ISO date string
    features_json: string; // The JSON string of the 30-day, 12D history
    ci_final: number; // Also the final fused score
    
    // Optional ML model scores (will be null for your "Equation" model)
    ci_model_gnn?: number | null; 
    ci_model_rf?: number | null;
    ci_model_gb?: number | null;
    predicted_lead_time?: number | null;
  };
  geometry: any; // GeoJSON geometry object
}

// --- THIS IS THE FIX ---
// Create a new type that is ONLY one of the keys from the object above
export type FeatureDriverKey = keyof typeof DRIVER_NAMES_ICONS;
export type StatusKey = keyof typeof STATUS_RANK;
export type DataLayerKey = keyof typeof DATA_LAYERS;