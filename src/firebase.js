import { initializeApp } from "firebase/app";
import { getFirestore, collection } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCeUN03XtLYNCYLYsgvhTYP9VJdlMacrzY",
  authDomain: "deep-dynamics-410914.firebaseapp.com",
  projectId: "deep-dynamics-410914",
  storageBucket: "deep-dynamics-410914.appspot.com",
  messagingSenderId: "343498729048",
  appId: "1:343498729048:web:3b1effd102d60f6f024c2d",
  measurementId: "G-51JL1462J8"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
export const colRef = collection(firestore, 'Marks');
