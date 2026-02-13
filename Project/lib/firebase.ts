'use client';
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Use localStorage persistence so the user stays signed in after page reload
let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, { persistence: browserLocalPersistence });
} catch (e) {
  // Already initialized (e.g. hot reload)
  auth = getAuth(app);
}
export { auth };
export const db = getFirestore(app);

// Delay before treating "null" as "signed out" so we don't clear state on reload
// before Firebase has restored the user from persistence (it often fires null first, then user).
const AUTH_NULL_DELAY_MS = 200;

export function useAuth(): { user: User | null; loading: boolean } {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let nullDelayTimeout: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user !== null) {
        if (nullDelayTimeout) clearTimeout(nullDelayTimeout);
        nullDelayTimeout = null;
        setCurrentUser(user);
        setLoading(false);
        return;
      }
      // user === null: might be "still restoring" or "really signed out"
      setCurrentUser(null);
      nullDelayTimeout = setTimeout(() => {
        nullDelayTimeout = null;
        setLoading(false);
      }, AUTH_NULL_DELAY_MS);
    });

    return () => {
      if (nullDelayTimeout) clearTimeout(nullDelayTimeout);
      unsubscribe();
    };
  }, []);

  return { user: currentUser, loading };
}