// ================================================================
// CONFIGURACIÓN DE FIREBASE
// ================================================================

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

// Verificar que firebase.auth sea una función antes de usarla
if (typeof firebase.auth === 'function') {
    window.auth = firebase.auth();
} else {
    console.error('❌ Firebase Auth no está disponible. Revisa la carga de scripts.');
    window.auth = null;
}

if (typeof firebase.firestore === 'function') {
    window.db = firebase.firestore();
} else {
    console.error('❌ Firestore no está disponible.');
    window.db = null;
}

if (typeof firebase.storage === 'function') {
    window.storage = firebase.storage();
} else {
    console.error('❌ Storage no está disponible.');
    window.storage = null;
}

// Lista de correos con permisos de administrador
window.FIREBASE_ADMIN_EMAILS = [
    'puntoycoma.ediciontextos@gmail.com',
    // Agrega aquí el correo de tu cliente
];