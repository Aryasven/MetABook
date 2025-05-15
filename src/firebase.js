
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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
export const auth = getAuth(app);
export const db = getFirestore(app);
