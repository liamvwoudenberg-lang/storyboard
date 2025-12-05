
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyApmAfK74ls9uwif6Qyta54xqeJjlliEGE",
  authDomain: "storybooord-66219543-59944.firebaseapp.com",
  projectId: "storybooord-66219543-59944",
  storageBucket: "storybooord-66219543-59944.firebasestorage.app",
  messagingSenderId: "949977391458",
  appId: "1:949977391458:web:254251faf2249041e34c3b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Analytics conditionally
let analytics;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.warn("Firebase Analytics not supported in this environment", error);
}

export { app, analytics, db, auth, googleProvider };