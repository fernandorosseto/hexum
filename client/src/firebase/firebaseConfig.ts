// ============================================================
//  firebase/firebaseConfig.ts
//  Inicializa o app Firebase com as credenciais do .env
//  Veja client/.env.example para a lista de variáveis.
// ============================================================

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Credenciais obrigatórias. `initializeApp` NÃO lança com valores undefined,
 * então o try/catch anterior nunca protegia nada: `auth` e `db` ficavam
 * não-nulos e o erro só aparecia depois, como falha de rede em runtime.
 */
const REQUIRED_KEYS = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;
const missing = REQUIRED_KEYS.filter(key => !firebaseConfig[key]);

export const isFirebaseConfigured = missing.length === 0;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error('Firebase: falha ao inicializar.', error);
    app = null;
    auth = null;
    db = null;
  }
} else {
  console.warn(
    `⚠️ Firebase desativado — faltam as variáveis: ${missing.map(k => `VITE_FIREBASE_${k.replace(/[A-Z]/g, c => '_' + c).toUpperCase()}`).join(', ')}. ` +
    'O jogo roda normalmente offline (solo e sandbox); o PvP fica indisponível.'
  );
}

export { auth, db };
export default app;
