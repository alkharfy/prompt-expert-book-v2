// التحقق من أن المسار آمن (داخلي فقط) لمنع Open Redirect.
// Each caller passes its own allowlist: anything else falls back to /toc.
export function getSafeRedirectPath(path: string | null, allowedPrefixes: readonly string[]): string {
    if (!path || typeof path !== 'string') return '/toc'
    const trimmed = path.trim()
    // منع Open Redirect: يجب أن يكون المسار نسبياً وليس URL خارجي
    if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('://')) {
        return '/toc'
    }
    if (!allowedPrefixes.some(prefix => trimmed.startsWith(prefix))) {
        return '/toc'
    }
    return trimmed
}
