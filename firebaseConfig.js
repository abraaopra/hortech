// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAdXoRE1coPJjcLuW7UD4hZMtZMEbV6i90",
  authDomain: "hortechapp.firebaseapp.com",
  projectId: "hortechapp",
  storageBucket: "hortechapp.firebasestorage.app",
  messagingSenderId: "288848410026",
  appId: "1:288848410026:web:3443cd1b3faa68959327d3",
  measurementId: "G-KM9K94TK95"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);