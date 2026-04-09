import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCCdxKSRNBYFdL-IlpZ8eTfRP2KpKYeNU4",
  authDomain: "autolavadopro-1ed74.firebaseapp.com",
  projectId: "autolavadopro-1ed74",
  storageBucket: "autolavadopro-1ed74.firebasestorage.app",
  messagingSenderId: "1059514571719",
  appId: "1:1059514571719:web:c022cef7bfff4a8c3ed7e2",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
