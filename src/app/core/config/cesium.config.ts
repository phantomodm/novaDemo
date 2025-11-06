declare let Cesium: any;

export const CESIUM_CONFIG = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiMDFmZjdiZS1mZWU0LTQ5MzktOTgxMC1jZTE2ZGE1YjhmMGUiLCJpZCI6MzUxMzI5LCJpYXQiOjE3NjA2NjI2NjF9.y_HaG_nTARNbnLD_S0FQUwEcUFJypnZ2kGxha2MgUjw'
};

export function initializeCesium(): void {
  if (typeof Cesium !== 'undefined') {
    Cesium.Ion.defaultAccessToken = CESIUM_CONFIG.accessToken;
    console.log('Cesium initialized with access token');
  } else {
    console.warn('Cesium not available for initialization');
  }
}