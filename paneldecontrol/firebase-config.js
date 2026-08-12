const firebaseConfig = {
  apiKey: "AIzaSyC6GGmebTtMc5Fgv1BJQYfITuDaYTCOk2M",
  authDomain: "puntoycomaeditorial-b7a0a.firebaseapp.com",
  projectId: "puntoycomaeditorial-b7a0a",
  storageBucket: "puntoycomaeditorial-b7a0a.firebasestorage.app",
  messagingSenderId: "468641801501",
  appId: "1:468641801501:web:e0df6227c0b97ebf2dedf4",
  measurementId: "G-N0JE0K0MQK"
};

if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
}

window.db = firebase.firestore();
window.storage = firebase.storage();
window.auth = firebase.auth();
window.FIREBASE_ADMIN_EMAILS = ['puntoycoma.ediciontextos@gmail.com']; 