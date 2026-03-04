import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyB_lEBgSXXo-7vUDxGl7Ml17_dgn2i6WiQ',
  authDomain: 'micartera-notifications.firebaseapp.com',
  projectId: 'micartera-notifications',
  storageBucket: 'micartera-notifications.firebasestorage.app',
  messagingSenderId: '228032855350',
  appId: '1:228032855350:web:0d4cf6e339c6e5008b0797',
};

export const VAPID_KEY = 'BDHhwtAGQj2CdNwuT_gGvVNzRyiepYn6ZxctO4ooOTmU_GhpbciJHrJKJbB4kJnKdbkHDL7BGNYggJfly_8RMFE';

const app = initializeApp(firebaseConfig);

let messaging: ReturnType<typeof getMessaging> | null = null;

const initializeMessaging = async () => {
  try {
    const supported = await isSupported();
    if (supported) {
      messaging = getMessaging(app);
    }
  } catch (error) {
    console.log('Messaging not supported:', error);
  }
};

initializeMessaging();

export { messaging, getToken, onMessage };
