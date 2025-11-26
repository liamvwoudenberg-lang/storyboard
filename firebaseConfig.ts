import firebase from "firebase/app";
import "firebase/analytics";
import "firebase/firestore";

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
// Check if apps are already initialized to avoid duplication errors during hot reload
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
const analytics = firebase.analytics();
const db = firebase.firestore();

export { app, analytics, db };