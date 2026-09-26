import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BLOG_POSTS, getPostBySlug, getAllSlugs } from '@/data/blogPosts'
import { SITE_URL } from '@/lib/config'
import BlogPostClient from './BlogPostClient'

// SSG: Generate all blog post routes at build time
export function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }))
}

// SEO: Dynamic metadata per post
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: 'مقال غير موجود' }

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags.join(', '),
    openGraph: {
      title: `${post.title} | PromptMaster`,
      description: post.excerpt,
      type: 'article',
      locale: 'ar_EG',
      url: `${SITE_URL}/blog/${slug}`,
      images: [`${SITE_URL}/assets/og-default.png`],
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  }
}

export default async function BlogPostPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  // Get related posts (same category, excluding current)
  const related = BLOG_POSTS
    .filter(p => p.category === post.category && p.slug !== post.slug)
    .slice(0, 2)

  return <BlogPostClient post={post} relatedPosts={related} />
}
