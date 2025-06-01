
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBeiaQLJUhQltzf9U23tICNN0inmG-vG5w",
  authDomain: "metabook-464c5.firebaseapp.com",
  projectId: "metabook-464c5",
  storageBucket: "metabook-464c5.firebasestorage.app",
  messagingSenderId: "950037061391",
  appId: "1:950037061391:web:df114de95e8b0ba092687a",
  measurementId: "G-393K6CX3G7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Set persistence properly for Firebase v9
// This is critical for PWAs, especially on iOS
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Auth persistence error:", error);
  });

// Configure Firestore persistence based on platform
const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
const isPWA = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;

// Only enable persistence for non-iOS platforms
if (!isIOS && typeof window !== 'undefined' && window.indexedDB) {
  enableIndexedDbPersistence(db).catch((err) => {
    console.log('Firestore persistence error:', err.code);
  });
}

// Log platform detection for debugging
console.log("Platform detection:", { isIOS, isPWA });

// Add a helper function to check auth state - useful for debugging
const checkAuthState = () => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

export { auth, db, checkAuthState };
export default app;
