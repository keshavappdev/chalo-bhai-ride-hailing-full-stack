import admin from 'firebase-admin';import { env } from './env.js';
let app=null;
export function getFirebaseMessaging(){
  if(app) return admin.messaging(app);
  if(!env.firebaseServiceAccountJson) return null;
  try{const serviceAccount=JSON.parse(env.firebaseServiceAccountJson);app=admin.initializeApp({credential:admin.credential.cert(serviceAccount)});return admin.messaging(app);}catch(e){console.warn('Firebase Admin disabled:',e.message);return null;}
}
