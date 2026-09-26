import 'server-only'
import * as admin from 'firebase-admin'

// Initialize Firebase Admin (server-side only)
if (!admin.apps.length) {
  try {
    const rawKey = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY
    if (!rawKey) {
      throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY environment variable is not set')
    }

    let serviceAccount: Record<string, unknown>
    try {
      serviceAccount = JSON.parse(rawKey)
    } catch {
      throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY contains invalid JSON')
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    })

  } catch (error) {
    console.error('Firebase Admin initialization failed:', error)
    throw error
  }
}

export const adminAuth = admin.auth()
export const adminApp = admin.app()

/**
 * Verify Firebase ID token (for API routes and middleware)
 * @param idToken - Firebase ID token from Authorization header
 * @returns Decoded token or null if invalid
 */
export async function verifyFirebaseToken(
  idToken: string
): Promise<admin.auth.DecodedIdToken | null> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    return decodedToken
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Get Firebase user by email
 * @param email - User email address
 * @returns User record or null if not found
 */
export async function getFirebaseUserByEmail(
  email: string
): Promise<admin.auth.UserRecord | null> {
  try {
    return await adminAuth.getUserByEmail(email)
  } catch (error: unknown) {
    // auth/user-not-found is expected, don't log it
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'auth/user-not-found') {
      return null
    }
    console.error('getFirebaseUserByEmail failed:', error)
    return null
  }
}

/**
 * Get Firebase user by UID
 * @param uid - Firebase user ID
 * @returns User record or null if not found
 */
export async function getFirebaseUserByUid(
  uid: string
): Promise<admin.auth.UserRecord | null> {
  try {
    return await adminAuth.getUser(uid)
  } catch (error: unknown) {
    // auth/user-not-found is expected, don't log it
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'auth/user-not-found') {
      return null
    }
    console.error('getFirebaseUserByUid failed:', error)
    return null
  }
}

/**
 * Delete Firebase user (for cleanup/admin operations)
 * @param uid - Firebase user ID to delete
 * @returns true if successful, false otherwise
 */
export async function deleteFirebaseUser(uid: string): Promise<boolean> {
  try {
    await adminAuth.deleteUser(uid)
    return true
  } catch (error) {
    console.error('Failed to delete Firebase user:', error)
    return false
  }
}
