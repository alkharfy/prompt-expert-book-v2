/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
    // Security headers (incl. the single Content-Security-Policy) are set in
    // middleware.ts. Do not add a second CSP here: browsers enforce every CSP
    // header they receive, and the duplicate previously blocked Google sign-in,
    // GA4 and the Meta Pixel.
}

module.exports = nextConfig
