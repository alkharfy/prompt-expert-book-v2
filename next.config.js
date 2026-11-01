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
    // Old book chapters 6-10 were removed on 2026-11-01 (the five levels replace them);
    // old links in emails, bookmarks and search results land on the course map.
    async redirects() {
        return [
            { source: '/read/:section(section-(?:6|7|8|9|10))', destination: '/toc', permanent: true },
            { source: '/read/:section(section-(?:6|7|8|9|10))/:page*', destination: '/toc', permanent: true },
        ]
    },
}

module.exports = nextConfig
