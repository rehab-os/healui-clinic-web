// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBZPX8-FEkWADjckDZXEsAuCimwohjLQuQ",
  authDomain: "healui.firebaseapp.com",
  projectId: "healui",
  storageBucket: "healui.firebasestorage.app",
  messagingSenderId: "85550761100",
  appId: "1:85550761100:web:cdfb0fef208268f7ee27a9",
  measurementId: "G-EYK90BMGVK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// const analytics = getAnalytics(app);

export { auth, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential };
export default app;