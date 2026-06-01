import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const gymFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_GYM_FIREBASE_API_KEY || "AIzaSyCLgovaXfshvbwyGM-v970AkDiE73Vo0a4",
  authDomain: process.env.NEXT_PUBLIC_GYM_FIREBASE_AUTH_DOMAIN || "espacioscdu.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_GYM_FIREBASE_PROJECT_ID || "espacioscdu",
  storageBucket:
    process.env.NEXT_PUBLIC_GYM_FIREBASE_STORAGE_BUCKET || "espacioscdu.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_GYM_FIREBASE_MESSAGING_SENDER_ID || "547238322401",
  appId: process.env.NEXT_PUBLIC_GYM_FIREBASE_APP_ID || "1:547238322401:web:75e6bb9d40cfba6efb97a0",
}

const GYM_APP_NAME = "gym-cdu"

function getGymApp() {
  const existing = getApps().find((a) => a.name === GYM_APP_NAME)
  return existing ?? initializeApp(gymFirebaseConfig, GYM_APP_NAME)
}

export const gymDb = getFirestore(getGymApp())
