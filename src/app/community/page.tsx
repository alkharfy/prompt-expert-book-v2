'use client'

import { motion } from 'framer-motion'
import Navigation from '@/components/Navigation'

const wallOfFameEntries = [
  {
    id: 1,
    name: 'مثال تعليمي — التسويق',
    prompt: 'صمم لي خطة تسويقية لمتجر إلكتروني ناشئ متخصص في المنتجات الصديقة للبيئة، مع التركيز على جمهور الشباب في الخليج العربي، وميزانية محدودة لا تتجاوز 500 دولار شهرياً.',
    category: 'تسويق',
  },
  {
    id: 2,
    name: 'مثال تعليمي — مراجعة الكود',
    prompt: 'أنت مهندس برمجيات خبير. راجع الكود التالي وحدد المشاكل الأمنية المحتملة، ثم اقترح حلولاً عملية مع أمثلة كود محسّنة. ركّز على: حقن SQL، XSS، وإدارة الجلسات.',
    category: 'برمجة',
  },
  {
    id: 3,
    name: 'مثال تعليمي — الكتابة',
    prompt: 'اكتب قصة قصيرة للأطفال (6-10 سنوات) عن روبوت صغير يتعلم معنى الصداقة. القصة يجب أن تتضمن: حواراً بسيطاً، درساً أخلاقياً غير مباشر، ونهاية مفتوحة تشجع الطفل على التفكير.',
    category: 'كتابة إبداعية',
  },
]

export default function CommunityPage() {
  return (
    <>
      <Navigation />
      <main
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #0a0a0f 0%, #0d0d15 50%, #0a0a0f 100%)',
          direction: 'rtl',
          paddingTop: '100px',
          paddingBottom: '80px',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '0 20px',
          }}
        >
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: '60px' }}
          >
            <h1
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                fontWeight: 800,
                color: '#ffffff',
                marginBottom: '16px',
                lineHeight: 1.4,
              }}
            >
              <span style={{ color: '#ff6b35' }}>{"{"}</span>{' '}
              المجتمع قيد الإعداد{' '}
              <span style={{ color: '#ff6b35' }}>{"}"}</span>
            </h1>
            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                color: 'rgba(255, 255, 255, 0.6)',
                maxWidth: '650px',
                margin: '0 auto',
                lineHeight: 1.8,
              }}
            >
              قنوات المجتمع والمشاركات لم تُفتح بعد. الأمثلة والتحدي أدناه مواد تعليمية توضيحية، وليست مشاركات عملاء أو دليلًا على وجود مجتمع نشط.
            </p>
          </motion.div>

          {/* Community Platform Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
              gap: '24px',
              marginBottom: '70px',
            }}
          >
            {/* Telegram Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              style={{
                display: 'block',
                textDecoration: 'none',
                background: 'rgba(10, 10, 10, 0.7)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 107, 53, 0.2)',
                borderRadius: '16px',
                padding: '36px 30px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '120px',
                  height: '120px',
                  background: 'radial-gradient(circle, rgba(0, 136, 204, 0.15) 0%, transparent 70%)',
                  borderRadius: '0 16px 0 0',
                  pointerEvents: 'none',
                }}
              />
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
                &#x2708;&#xFE0F;
              </div>
              <h2
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '12px',
                }}
              >
                قناة تيليجرام مخطط لها
              </h2>
              <p
                style={{
                  fontSize: '0.95rem',
                  color: 'rgba(255, 255, 255, 0.55)',
                  lineHeight: 1.8,
                  marginBottom: '20px',
                }}
              >
                نخطط لمساحة لمشاركة التجارب والأسئلة. لم يبدأ تشغيل القناة، ولا نعلن حاليًا موعدًا أو جلسات دورية.
                مع مؤلف الكتاب والخبراء.
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#ff6b35',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                }}
              >
                <span style={{ color: 'rgba(255, 107, 53, 0.5)', fontWeight: 600, fontSize: '0.95rem' }}>قريبا...</span>
              </div>
            </motion.div>

            {/* Discord Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.02, y: -4 }}
              style={{
                display: 'block',
                textDecoration: 'none',
                background: 'rgba(10, 10, 10, 0.7)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 107, 53, 0.2)',
                borderRadius: '16px',
                padding: '36px 30px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '120px',
                  height: '120px',
                  background: 'radial-gradient(circle, rgba(88, 101, 242, 0.15) 0%, transparent 70%)',
                  borderRadius: '0 16px 0 0',
                  pointerEvents: 'none',
                }}
              />
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
                &#x1F3AE;
              </div>
              <h2
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '12px',
                }}
              >
                مساحة ديسكورد مخطط لها
              </h2>
              <p
                style={{
                  fontSize: '0.95rem',
                  color: 'rgba(255, 255, 255, 0.55)',
                  lineHeight: 1.8,
                  marginBottom: '20px',
                }}
              >
                نفكر في قنوات لمشاركة النتائج
                والتجارب مع نماذج الذكاء الاصطناعي المختلفة، ومساحة حرة
                للنقاش والتعاون على مشاريع مشتركة.
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#ff6b35',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                }}
              >
                <span style={{ color: 'rgba(255, 107, 53, 0.5)', fontWeight: 600, fontSize: '0.95rem' }}>قريبا...</span>
              </div>
            </motion.div>
          </div>

          {/* Wall of Fame Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{ marginBottom: '70px' }}
          >
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <h2
                style={{
                  fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '10px',
                }}
              >
                حائط الشرف
              </h2>
              <p
                style={{
                  fontSize: '1rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
              >
                أمثلة برومبتات تعليمية
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
              }}
            >
              {wallOfFameEntries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  style={{
                    background: 'rgba(10, 10, 10, 0.7)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 107, 53, 0.2)',
                    borderRadius: '14px',
                    padding: '28px 24px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '14px',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: '#ff6b35',
                        fontSize: '1rem',
                      }}
                    >
                      {entry.name}
                    </span>
                    <span
                      style={{
                        background: 'rgba(255, 107, 53, 0.12)',
                        color: 'rgba(255, 107, 53, 0.85)',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}
                    >
                      {entry.category}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '0.9rem',
                      color: 'rgba(255, 255, 255, 0.65)',
                      lineHeight: 1.9,
                      borderRight: '3px solid rgba(255, 107, 53, 0.3)',
                      paddingRight: '14px',
                      margin: 0,
                    }}
                  >
                    {entry.prompt}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Weekly Challenges Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            style={{ marginBottom: '70px' }}
          >
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <h2
                style={{
                  fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '10px',
                }}
              >
                تحدٍّ للتدريب الذاتي
              </h2>
              <p
                style={{
                  fontSize: '1rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
              >
                جرّب المثال التالي وراجع الناتج بنفسك؛ لا يوجد تقييم أو مشاركة جماعية حاليًا
              </p>
            </div>

            <div
              style={{
                background: 'rgba(10, 10, 10, 0.7)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 107, 53, 0.25)',
                borderRadius: '16px',
                padding: '36px 32px',
                maxWidth: '700px',
                margin: '0 auto',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-40px',
                  left: '-40px',
                  width: '180px',
                  height: '180px',
                  background: 'radial-gradient(circle, rgba(255, 107, 53, 0.08) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '18px',
                }}
              >
                <span
                  style={{
                    background: 'rgba(255, 107, 53, 0.15)',
                    color: '#ff6b35',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  مثال تحدٍّ تعليمي
                </span>
                <span
                  style={{
                    color: 'rgba(255, 255, 255, 0.35)',
                    fontSize: '0.8rem',
                  }}
                >
                  ينتهي يوم الجمعة
                </span>
              </div>
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '14px',
                  lineHeight: 1.5,
                }}
              >
                اكتب برومبت واحد يجعل ChatGPT يُنشئ خطة عمل كاملة لمشروعك
              </h3>
              <p
                style={{
                  fontSize: '0.92rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  lineHeight: 1.8,
                  marginBottom: '24px',
                }}
              >
                التحدي: صياغة برومبت واحد شامل يتضمن السياق، الدور، المخرجات المطلوبة،
                والقيود. راجع الناتج وحدّد المعلومات الناقصة، ثم حسّن البرومبت.
              </p>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'rgba(255, 255, 255, 0.45)',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                  }}
                >
                  المستوى: متوسط
                </span>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'rgba(255, 255, 255, 0.45)',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                  }}
                >
                  الفصول: 3 - 5
                </span>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'rgba(255, 255, 255, 0.45)',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                  }}
                >
                  مثال توضيحي، دون مشاركات فعلية
                </span>
              </div>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            style={{
              textAlign: 'center',
              background: 'rgba(10, 10, 10, 0.7)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 107, 53, 0.2)',
              borderRadius: '16px',
              padding: '50px 30px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse at center, rgba(255, 107, 53, 0.05) 0%, transparent 60%)',
                pointerEvents: 'none',
              }}
            />
            <h2
              style={{
                fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: '14px',
                position: 'relative',
              }}
            >
              مشاركة البرومبتات غير متاحة بعد
            </h2>
            <p
              style={{
                fontSize: '1rem',
                color: 'rgba(255, 255, 255, 0.5)',
                maxWidth: '550px',
                margin: '0 auto 30px',
                lineHeight: 1.8,
                position: 'relative',
              }}
            >
              نخطط لفتح المشاركة لاحقًا. هذه الصفحة ليست ميزة مجتمع مدفوعة، ولا تتضمن عضوية أو جلسات دعم حاليًا.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.5) 0%, rgba(255, 140, 66, 0.5) 100%)',
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 700,
                fontSize: '1.05rem',
                padding: '14px 36px',
                borderRadius: '12px',
                textDecoration: 'none',
                cursor: 'default',
                border: 'none',
                position: 'relative',
              }}
            >
              قريبا...
            </motion.div>
          </motion.div>
        </div>
      </main>
    </>
  )
}
