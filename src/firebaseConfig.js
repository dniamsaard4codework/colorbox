// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyD5Hr6FeftQyZhbOOZm5SuRkOp_yTgFxo8",
    authDomain: "centricolor.firebaseapp.com",
    databaseURL: "https://centricolor-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "centricolor",
    storageBucket: "centricolor.appspot.com",
    messagingSenderId: "141398416478",
    appId: "1:141398416478:web:a3448a86b0b39f687d28cf",
    measurementId: "G-3K14ZKLRP4"
  };
  
  const app = initializeApp(firebaseConfig);
  const database = getDatabase(app);
  
  export { app, database };