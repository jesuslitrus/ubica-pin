// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDOn1JHMVCf6K_iYhQSowbfz_2nregQIDA",
  authDomain: "ubica-pin.firebaseapp.com",
  projectId: "ubica-pin",
  storageBucket: "ubica-pin.firebasestorage.app",
  messagingSenderId: "443866550071",
  appId: "1:443866550071:web:dd26261a2e3263ce8bd4b2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);