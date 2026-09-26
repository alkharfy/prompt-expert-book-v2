import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import {
  getAuth,
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updatePassword,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
}

let app: FirebaseApp | undefined
let authInstance: Auth | undefined

// Initialize Firebase (client-side only)
if (typeof window !== 'undefined') {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]
  }

  authInstance = getAuth(app)
}

// Export auth instance (will be undefined on server - check before using)
export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    throw new Error(
      'Firebase Auth is not available. This function can only be called on the client side.'
    )
  }
  return authInstance
}

// Legacy export — prefer getFirebaseAuth() for safety
// May be undefined on server - always check before using
export const auth: Auth | undefined = authInstance

export {
  app,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updatePassword,
  GoogleAuthProvider,
  signInWithPopup,
  type User
}
