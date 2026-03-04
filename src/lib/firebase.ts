import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyB_lEBgSXXo-7vUDxGl7Ml17_dgn2i6WiQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'micartera-notifications.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'micartera-notifications',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'micartera-notifications.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '228032855350',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:228032855350:web:0d4cf6e339c6e5008b0797',
};

export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY ?? 'BDHhwtAGQj2CdNwuT_gGvVNzRyiepYn6ZxctO4ooOTmU_GhpbciJHrJKJbB4kJnKdbkHDL7BGNYggJfly_8RMFE';

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
