import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyBWyjJymQ9goyGWE3QidVb77niRWlXb_7Q",
  authDomain: "negociosadlb.firebaseapp.com",
  projectId: "negociosadlb",
  storageBucket: "negociosadlb.firebasestorage.app",
  messagingSenderId: "8330188706",
  appId: "1:8330188706:web:2d39d097182ed03e4204fb",
  measurementId: "G-VN7XYR85K3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
