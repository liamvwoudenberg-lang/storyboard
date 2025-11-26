// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBD6WLW2AdMJ1eYfnPqYc5q4wWYpWMj6sU",
  authDomain: "storyboard-e2d08.firebaseapp.com",
  projectId: "storyboard-e2d08",
  storageBucket: "storyboard-e2d08.firebasestorage.app",
  messagingSenderId: "452884005224",
  appId: "1:452884005224:web:1d9947daebc28f79aad6dd",
  measurementId: "G-3W9JKNY3XZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };