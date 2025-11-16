// Give the service worker access to Firebase
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker
// Make sure you get these credentials from your Firebase project settings
const firebaseConfig = {
    projectId: 'nova-001-471111',
    appId: '1:910896594298:web:41f8ffeb4dbcd0245eaac3',
    storageBucket: 'nova-001-471111.firebasestorage.app',
    apiKey: 'AIzaSyAYHjNvUNoiDLneVKf9yL_rxiFSH7p980E',
    authDomain: 'nova-001-471111.firebaseapp.com',
    messagingSenderId: '910896594298',
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// This just handles the background notification
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/icons/icon-192x192.png' // Optional: path to your app icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});