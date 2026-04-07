import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAV-YPsv6l3uTiODv5VlCgIjHPMqX-oQG8",
  authDomain: "ngheta-c7063.firebaseapp.com",
  projectId: "ngheta-c7063",
  storageBucket: "ngheta-c7063.firebasestorage.app",
  messagingSenderId: "1088200020034",
  appId: "1:1088200020034:web:917a15daacad2f3ee79ddb",
  measurementId: "G-6CPZF5KWJK"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
