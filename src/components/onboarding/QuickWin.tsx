'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import type { SpecializationId } from '@/types/learning'

const prompts: Record<SpecializationId, { title: string; prompt: string }> = {
  programming: {
    title: '🖥️ برومبت برمجي جاهز',
    prompt: `أنت مهندس برمجيات محترف. أريد بناء REST API باستخدام Node.js و Express لتطبيق إدارة مهام.

المطلوب:
1. هيكل المشروع (folders structure)
2. كود CRUD كامل مع التعليقات
3. تعامل مع الأخطاء (error handling)
4. أمثلة Postman للتجربة

استخدم أحدث الممارسات (best practices) واكتب كود نظيف قابل للصيانة.`,
  },
  ecommerce: {
    title: '🛒 برومبت تجارة إلكترونية',
    prompt: `أنت خبير تجارة إلكترونية. عندي متجر إلكتروني لبيع الملابس النسائية في السعودية.

حلل لي:
1. أفضل 5 استراتيجيات لزيادة معدل التحويل (conversion rate)
2. كتابة وصف منتج مقنع لفستان سهرة سعره 450 ريال
3. خطة تسويقية لحملة رمضانية (أسبوعين)
4. تحسين صفحة المنتج لـ SEO

اعطني نتائج قابلة للتنفيذ فوراً.`,
  },
  design: {
    title: '🎨 برومبت تصميم إبداعي',
    prompt: `أنت مصمم UX/UI محترف. أريد تصميم تطبيق موبايل لحجز مواعيد عيادات.

أعطني:
1. User flow كامل من التسجيل حتى تأكيد الحجز
2. مخطط شاشات (wireframes) لـ 5 شاشات أساسية
3. اقتراح color palette مناسب للقطاع الطبي
4. أفضل ممارسات UX للحجز السريع
5. نقاط تحسين لتجربة المستخدم العربي (RTL)

ركز على البساطة وسهولة الاستخدام.`,
  },
  marketing: {
    title: '📢 برومبت تسويقي فعّال',
    prompt: `أنت خبير تسويق رقمي. عندي مشروع أكاديمية تعليم أونلاين للبرمجة.

أريد:
1. خطة محتوى لـ Instagram لمدة شهر (30 فكرة)
2. كتابة 3 نسخ إعلانية (ad copy) لـ Facebook Ads
3. بناء sales funnel من الوعي حتى الشراء
4. استراتيجية email marketing لـ 5 إيميلات
5. تحليل الجمهور المستهدف (buyer persona)

اعطني خطة عملية بأرقام ونتائج متوقعة.`,
  },
  general: {
    title: '💡 برومبت متعدد الأغراض',
    prompt: `أنت مساعد ذكي متعدد المهارات.

أريد منك:
1. تلخيص أي مقال طويل في 5 نقاط رئيسية مع تحديد الأفكار المهمة
2. اكتب لي خطة يومية منظمة لشخص يعمل من المنزل (Work from Home)
3. أنشئ قالب اجتماع فعّال (meeting template) يشمل: الهدف، النقاط، القرارات، المتابعة
4. حوّل هذا النص التقني إلى لغة بسيطة يفهمها أي شخص

قدم لي الإجابات بتنسيق واضح ومرتب.`,
  },
}

interface Props {
  specialization: SpecializationId
  onFinish: () => void
}

export default function QuickWin({ specialization, onFinish }: Props) {
  const [copied, setCopied] = useState(false)
  const { title, prompt } = useMemo(() => prompts[specialization], [specialization])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{ textAlign: 'center' }}
    >
      <h2 style={heading}>🎉 أول برومبت احترافي لك!</h2>
      <p style={subtitle}>{title}</p>

      <div style={promptBox}>
        <pre style={promptText}>{prompt}</pre>
        <button onClick={handleCopy} style={copyBtn}>
          {copied ? '✅ تم النسخ!' : '📋 انسخ البرومبت'}
        </button>
      </div>

      <p style={hint}>
        جرّبه الآن في ChatGPT أو أي أداة ذكاء اصطناعي وشوف الفرق!
      </p>

      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={onFinish}
        style={btnPrimary}
      >
        🚀 ابدأ الرحلة
      </motion.button>
    </motion.div>
  )
}

/* ── Styles ── */

const heading: React.CSSProperties = {
  fontSize: 'clamp(1.3rem, 4vw, 1.7rem)',
  fontWeight: 800,
  color: '#ffffff',
  marginBottom: 8,
}

const subtitle: React.CSSProperties = {
  fontSize: '1.05rem',
  color: '#FF6B35',
  marginBottom: 28,
  fontWeight: 600,
}

const promptBox: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,107,53,0.2)',
  borderRadius: 16,
  padding: '24px 20px 16px',
  marginBottom: 24,
  textAlign: 'right',
  position: 'relative',
}

const promptText: React.CSSProperties = {
  color: 'rgba(255,255,255,0.85)',
  fontSize: '0.88rem',
  lineHeight: 1.8,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  margin: 0,
  fontFamily: 'inherit',
}

const copyBtn: React.CSSProperties = {
  marginTop: 16,
  background: 'rgba(255,107,53,0.12)',
  color: '#FF6B35',
  border: '1px solid rgba(255,107,53,0.3)',
  borderRadius: 10,
  padding: '10px 24px',
  fontSize: '0.92rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const hint: React.CSSProperties = {
  color: 'rgba(255,255,255,0.45)',
  fontSize: '0.85rem',
  marginBottom: 28,
}

const btnPrimary: React.CSSProperties = {
  background: 'linear-gradient(135deg, #FF6B35, #FF8C42)',
  color: '#fff',
  border: 'none',
  borderRadius: 14,
  padding: '16px 56px',
  fontSize: '1.1rem',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 4px 24px rgba(255,107,53,0.35)',
  fontFamily: 'inherit',
}
