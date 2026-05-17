// ============================================================
//  firebase/firebaseConfig.ts
//  Inicializa o app Firebase com as credenciais do .env
//  Substitua os valores no arquivo .env da pasta /client
// ============================================================

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // ✏️ Estas variáveis são lidas do arquivo .env
  // Edite /client/.env com os valores do seu projeto Firebase
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Inicializa o app Firebase (singleton) — graceful quando sem credenciais
let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.warn('⚠️ Firebase não inicializado (credenciais ausentes). Modo offline ativo.', e);
}

export { auth, db };
export default app;
