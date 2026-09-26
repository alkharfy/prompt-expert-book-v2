// Device Fingerprint Generation Utility
// This module collects various browser/device characteristics to create a unique fingerprint

import { fingerLogger } from './logger'

export interface DeviceFingerprintData {
    hash: string
    info: {
        userAgent: string
        language: string
        languages: string[]
        platform: string
        screenResolution: string
        colorDepth: number
        timezone: string
        timezoneOffset: number
        cpuCores: number
        memory: number | null
        canvasFingerprint: string
        webglFingerprint: string
        pixelRatio: number
    }
}

class DeviceFingerprint {
    /**
     * Generate a complete device fingerprint
     * @returns DeviceFingerprintData with hash and detailed info
     */
    async generate(): Promise<DeviceFingerprintData> {
        const info = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            languages: Array.from(navigator.languages || [navigator.language]),
            platform: (navigator as any).userAgentData?.platform || navigator.platform || 'unknown',
            screenResolution: `${screen.width}x${screen.height}`,
            colorDepth: screen.colorDepth,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: new Date().getTimezoneOffset(),
            cpuCores: navigator.hardwareConcurrency || 0,
            memory: (navigator as any).deviceMemory || null,
            canvasFingerprint: this.getCanvasFingerprint(),
            webglFingerprint: this.getWebGLFingerprint(),
            pixelRatio: window.devicePixelRatio || 1,
        }

        // Use ONLY properties that are identical across ALL browsers on the same machine
        // We exclude browser-specific info (userAgent, languages, canvas, webgl strings)
        // to allow the same device to have the same hash across different browsers.
        // NOTE: We use screen.width/height directly (not window size) for actual screen resolution
        // NOTE: cpuCores and memory help distinguish different devices
        const hardwareFingerprint = {
            p: info.platform,                    // OS platform
            t: info.timezone,                    // Timezone
            cd: info.colorDepth,                 // Color depth
            cpu: info.cpuCores,                  // CPU cores (helps distinguish devices)
            mem: info.memory,                    // Device memory (helps distinguish devices)
        }

        const fingerprintString = JSON.stringify(hardwareFingerprint)
        const hash = await this.hashString(fingerprintString)

        // استخدام logger بدلاً من console.log - يظهر في التطوير فقط
        fingerLogger.debug('Cross-browser hash generated', { hash: hash.substring(0, 16) + '...' })
        fingerLogger.debug('Hardware fingerprint details', hardwareFingerprint)

        return {
            hash,
            info,
        }
    }

    /**
     * Generate Canvas Fingerprint
     * Each device renders canvas slightly differently due to GPU, OS, fonts, etc.
     */
    private getCanvasFingerprint(): string {
        try {
            const canvas = document.createElement('canvas')
            canvas.width = 200
            canvas.height = 50
            const ctx = canvas.getContext('2d')

            if (!ctx) return 'canvas-not-supported'

            // Draw a complex pattern
            ctx.textBaseline = 'top'
            ctx.font = '14px Arial'
            ctx.fillStyle = '#f60'
            ctx.fillRect(0, 0, 200, 50)
            ctx.fillStyle = '#069'
            ctx.fillText('Device Fingerprint Test 🔐', 2, 15)
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
            ctx.fillText('Unique Canvas Print', 4, 30)

            // Add some shapes
            ctx.beginPath()
            ctx.arc(50, 25, 10, 0, Math.PI * 2)
            ctx.fill()

            return canvas.toDataURL()
        } catch (e) {
            return 'canvas-error'
        }
    }

    /**
     * Generate WebGL Fingerprint
     * Collects GPU and renderer information
     */
    private getWebGLFingerprint(): string {
        try {
            const canvas = document.createElement('canvas')
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null

            if (!gl) return 'webgl-not-supported'

            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
            if (!debugInfo) return 'webgl-debug-not-available'

            const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)

            return `${vendor}~${renderer}`
        } catch (e) {
            return 'webgl-error'
        }
    }

    /**
     * Hash a string using SHA-256
     * @param str The string to hash
     * @returns Hexadecimal hash string
     */
    async hashString(str: string): Promise<string> {
        // crypto.subtle is only available in secure contexts (HTTPS / localhost)
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const encoder = new TextEncoder()
            const data = encoder.encode(str)
            const hashBuffer = await crypto.subtle.digest('SHA-256', data)
            const hashArray = Array.from(new Uint8Array(hashBuffer))
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        }
        // Fallback: simple hash for non-secure contexts (dev HTTP)
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash |= 0
        }
        return 'fb-' + Math.abs(hash).toString(16).padStart(8, '0')
    }

    /**
     * Generate a random device ID as a fallback
     * @returns A unique random ID
     */
    generateDeviceId(): string {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return 'device_' + crypto.randomUUID()
        }
        // Fallback for non-secure contexts
        return 'device_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10)
    }
}

// Export singleton instance
export const deviceFingerprint = new DeviceFingerprint()
