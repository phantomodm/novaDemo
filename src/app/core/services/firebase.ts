import { Injectable, inject , signal} from '@angular/core';
import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class Firebase {
  // private snackBar = inject(MatSnackBar);
  // messaging = signal<MessagePayload | null>(null);
  // //private messaging = getMessaging();

  // /**
  //  * 1. Request permission from the user
  //  */
  // requestPermission() {
  //   Notification.requestPermission().then((permission) => {
  //     if (permission === 'granted') {
  //       console.log('Notification permission granted.');
  //       this.getAndSubscribeToken();
  //     } else {
  //       console.log('Unable to get permission to notify.');
  //     }
  //   });
  // }

  // /**
  //  * 2. Get the device token
  //  */
  // private async getAndSubscribeToken() {
  //   // try {
  //   //   const currentToken = await getToken(this.messaging, {
  //   //     vapidKey: environment.firebaseVapidKey 
  //   //   });
      
  //   //   if (currentToken) {
  //   //     console.log('FCM Token:', currentToken);
  //   //     // TODO: Send this token to your backend to subscribe
  //   //     // to the 'global_alerts' topic.
  //   //   } else {
  //   //     console.log('No registration token available.');
  //   //   }
  //   // } catch (err) {
  //   //   console.log('An error occurred while retrieving token. ', err);
  //   // }
  // }

  // /**
  //  * 3. Listen for foreground messages
  //  */
  // listenForMessages() {
  //   onMessage(this.messaging, (payload: MessagePayload) => {
  //     console.log('Message received. ', payload);
  //     this.showSnackbar(payload);
  //   });
  // }

  // /**
  //  * 4. Show the snackbar alert
  //  */
  // private showSnackbar(payload: MessagePayload) {
  //   const title = payload.notification?.title || 'New Alert';
  //   const body = payload.notification?.body || 'Check the globe for details.';
  //   let cellId = '';
  //   if (payload.data && payload.data["cell_id"]){
  //       cellId = payload.data["cell_id"];
  //   }

  //   this.snackBar.open(body, 'View', {
  //     duration: 10000,
  //     panelClass: ['alert-snackbar']
  //   }).onAction().subscribe(() => {
  //     // This is where you'd call your panToCell logic
  //     console.log('Panning to cell:', cellId);
  //     // this.globeService.panToCell(cellId);
  //   });
  // }
  
}
