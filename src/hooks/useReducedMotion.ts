'use client'

import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    mql.addEventListener('change', callback)
    return () => mql.removeEventListener('change', callback)
}

function getSnapshot() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getServerSnapshot() {
    return false
}

/**
 * Returns true if the user prefers reduced motion.
 * Falls back to false during SSR.
 */
export function useReducedMotion(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
