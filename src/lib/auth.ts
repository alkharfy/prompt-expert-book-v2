import { getAuthCookies } from './cookie_utils'
import { authLogger } from './logger'

/**
 * Verify if user has a valid session
 * This is a synchronous version for client-side checks
 * For full verification with database, use authSystem.verifySession()
 */
export function verifySession(): boolean {
    if (typeof window === 'undefined') return false;

    // Check for userId cookie (non-httpOnly, readable from JS)
    // Note: sessionToken is httpOnly (set by server) so we can't read it from document.cookie
    // This is a quick client-side check — full verification happens via authSystem.verifySession()
    const { userId } = getAuthCookies();

    const isValid = !!userId;
    authLogger.debug('Session verification', { isValid });

    return isValid;
}
