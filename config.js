import firebase from 'firebase'
require("@firebase/firestore")

var firebaseConfig = {
    apiKey: "AIzaSyDYTXfDwDrVL1GhC2WaoKtlXUM1nAb2P28",
    authDomain: "willyapp-c97bd.firebaseapp.com",
    projectId: "willyapp-c97bd",
    storageBucket: "willyapp-c97bd.appspot.com",
    messagingSenderId: "198800778557",
    appId: "1:198800778557:web:29e84b1081991abdff1154"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  export default firebase.firestore()