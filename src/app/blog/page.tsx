import type { Metadata } from 'next'
import BlogListClient from './BlogListClient'

export const metadata: Metadata = {
  title: 'المدونة',
  description: 'مقالات ودليل شامل عن هندسة البرومبت والذكاء الاصطناعي — نصائح عملية، قوالب جاهزة، ومقارنات بين الأدوات.',
  openGraph: {
    title: 'المدونة | PromptMaster',
    description: 'مقالات عملية عن هندسة البرومبت والذكاء الاصطناعي بالعربي',
  },
}

export default function BlogPage() {
  return <BlogListClient />
}
