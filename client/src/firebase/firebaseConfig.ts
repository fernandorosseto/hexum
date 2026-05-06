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

console.log("Firebase Config Keys present:", {
  apiKey: !!firebaseConfig.apiKey,
  projectId: !!firebaseConfig.projectId,
  appId: !!firebaseConfig.appId
});

// Inicializa o app Firebase (singleton)
const app = initializeApp(firebaseConfig);

// Exporta os serviços usados no projeto
export const auth = getAuth(app);
export const db   = getFirestore(app);
export default app;
