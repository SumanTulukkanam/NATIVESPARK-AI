// config/firebase-config.js
// Enhanced Firebase configuration with global availability

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged, 
    signOut 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    deleteDoc
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2hbGzkiummRHw83Wi-zGfrbhT_7Vo4e4",
  authDomain: "nativespark-ai-d0a6e.firebaseapp.com",
  projectId: "nativespark-ai-d0a6e",
  storageBucket: "nativespark-ai-d0a6e.firebasestorage.app",
  messagingSenderId: "262988378205",
  appId: "1:262988378205:web:687291f679c334bf7d1db4",
  measurementId: "G-MMFGK8JYR3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// CRITICAL: Make Firebase available globally for non-module scripts
window.auth = auth;
window.db = db;
window.googleProvider = googleProvider;
window.signInWithPopup = signInWithPopup;
window.onAuthStateChanged = onAuthStateChanged;
window.signOut = signOut;
window.doc = doc;
window.setDoc = setDoc;
window.getDoc = getDoc;
window.updateDoc = updateDoc;
window.deleteDoc = deleteDoc;

// Log successful initialization
console.log('✅ Firebase initialized successfully');
console.log('✅ Auth available:', !!window.auth);
console.log('✅ Firestore available:', !!window.db);

// Export for module usage
export { 
    auth, 
    db, 
    googleProvider, 
    signInWithPopup, 
    onAuthStateChanged, 
    signOut,
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    deleteDoc 
};