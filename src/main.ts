import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
//import { initializeCesium } from './app/core/config/cesium.config';

// Configure Cesium globally
(window as any)['CESIUM_BASE_URL'] = './assets/cesium/';

// // Initialize Cesium configuration
// setTimeout(() => {
//   initializeCesium();
// }, 0);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
