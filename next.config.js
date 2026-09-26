/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                    { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://*.firebaseapp.com https://www.googletagmanager.com https://connect.facebook.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://api.kashier.io https://api.openai.com https://generativelanguage.googleapis.com https://api.groq.com https://api.x.ai https://api.deepseek.com https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://connect.facebook.net https://www.facebook.com https://graph.facebook.com; frame-src 'self' https://checkout.kashier.io https://*.firebaseapp.com https://accounts.google.com https://www.facebook.com https://connect.facebook.net; object-src 'none'; base-uri 'self'" },
                ],
            },
        ]
    },
}

module.exports = nextConfig
