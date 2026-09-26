import type { MetadataRoute } from 'next'
import { BLOG_POSTS } from '@/data/blogPosts'
import { SITE_URL } from '@/lib/config'

const BASE_URL = SITE_URL

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date()

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
        { url: `${BASE_URL}/toc`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
        { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/exercises`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
        { url: `${BASE_URL}/tools`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${BASE_URL}/achievements`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
        { url: `${BASE_URL}/leaderboard`, lastModified: now, changeFrequency: 'daily', priority: 0.4 },
        { url: `${BASE_URL}/challenge`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
        { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
        { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
        { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
        { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
        { url: `${BASE_URL}/refund-policy`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
        { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    ]

    // Blog post pages
    const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map(post => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.publishedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }))

    // Content-gated: only pages that render REAL content to an unauthenticated
    // crawler — the free preview = intro + chapter 1 (section-2..10 have
    // freePageLimit 0; library/appendix/glossary are paid). Locked pages return
    // empty shells to guests, so listing them would be soft-404s that hurt crawl
    // quality — they are intentionally EXCLUDED from the sitemap.
    const sectionPages: MetadataRoute.Sitemap = []
    const freeSections = [
        { id: 'intro', pages: 6 },
        { id: 'section-1', pages: 17 },
    ]

    for (const section of freeSections) {
        for (let page = 1; page <= section.pages; page++) {
            sectionPages.push({
                url: `${BASE_URL}/read/${section.id}/${page}`,
                lastModified: now,
                changeFrequency: 'monthly',
                priority: 0.6,
            })
        }
    }

    return [
        ...staticPages,
        ...blogPages,
        ...sectionPages,
    ]
}
