import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch()), 
    provideFirebaseApp(() => initializeApp({ projectId: "nova-001-471111", appId: "1:910896594298:web:41f8ffeb4dbcd0245eaac3", storageBucket: "nova-001-471111.firebasestorage.app", apiKey: "AIzaSyAYHjNvUNoiDLneVKf9yL_rxiFSH7p980E", authDomain: "nova-001-471111.firebaseapp.com", messagingSenderId: "910896594298" })), provideFirestore(() => getFirestore()),
  ]
};
