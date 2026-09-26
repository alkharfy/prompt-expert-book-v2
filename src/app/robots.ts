import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/config'

const BASE_URL = SITE_URL

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/api/', '/profile', '/bookmarks', '/certificate/'],
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
    }
}
