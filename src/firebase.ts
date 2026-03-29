import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "elchango-81e77.firebaseapp.com",
  projectId: "elchango-81e77",
  storageBucket: "elchango-81e77.firebasestorage.app",
  messagingSenderId: "165478818623",
  appId: "1:165478818623:web:7856902084ec484c49e98a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
