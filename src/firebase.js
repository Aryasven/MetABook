
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

// Initialize auth with persistence for better PWA support
const auth = getAuth(app);
auth.setPersistence('local'); // Use local persistence for PWAs

// Enable offline persistence for Firestore (helps with PWA)
// This is especially important for iOS PWAs which may lose connection
try {
  db.enablePersistence({ synchronizeTabs: true })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab
        console.log('Persistence failed: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        // The current browser does not support persistence
        console.log('Persistence not supported by browser');
      }
    });
} catch (e) {
  console.log('Firestore persistence error:', e);
}

export { auth, db };
export default app;
