// firebase.js — inicializa o SDK modular do Firebase (via CDN, sem build step).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Mantém a sessão logada no celular entre visitas.
setPersistence(auth, browserLocalPersistence).catch((e) =>
  console.warn('Persistência de auth não pôde ser configurada:', e),
);
