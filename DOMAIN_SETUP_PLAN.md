# خطة ربط الدومين prompt-mr.com بمشروع Vercel

## المعلومات الأساسية

| البند | القيمة |
|-------|--------|
| الدومين الجديد | `prompt-mr.com` |
| رابط Vercel الحالي | `prompt-expert-book-ten.vercel.app` |
| المشروع على Vercel | `prompt-expert-book` |

---

## الخطوة 1: إضافة الدومين في Vercel Dashboard

1. افتح [Vercel Dashboard](https://vercel.com/dashboard)
2. اضغط على مشروع **prompt-expert-book**
3. اذهب لـ **Settings** → **Domains**
4. في خانة الإدخال اكتب: `prompt-mr.com`
5. اضغط **Add**
6. Vercel هيسألك تضيف `www.prompt-mr.com` كمان — اضغط **Add** عليه برضو
7. هيظهرلك **DNS Records** المطلوبة — **انسخها** (هتحتاجها في الخطوة 2)

### السجلات اللي Vercel هيطلبها (عادةً):

| النوع | الاسم (Host) | القيمة (Value) | TTL |
|-------|-------------|----------------|-----|
| **A** | `@` | `76.76.21.21` | Auto |
| **CNAME** | `www` | `cname.vercel-dns.com` | Auto |

> ⚠️ **مهم**: الأرقام الفعلية ممكن تختلف — استخدم اللي Vercel بيعرضها ليك بالظبط.

---

## الخطوة 2: إعداد DNS عند مزود الدومين

اذهب لوحة تحكم مزود الدومين اللي اشتريت منه (مثال: Namecheap, GoDaddy, Google Domains, Cloudflare, إلخ).

### لو المزود هو **Namecheap**:
1. ادخل على [Namecheap Dashboard](https://ap.www.namecheap.com/)
2. بجانب `prompt-mr.com` اضغط **Manage**
3. اذهب لتاب **Advanced DNS**
4. احذف أي سجلات A أو CNAME موجودة مسبقاً (إلا MX لو عندك بريد)
5. أضف السجلات التالية:

| النوع | Host | القيمة | TTL |
|-------|------|--------|-----|
| A Record | `@` | `76.76.21.21` | Automatic |
| CNAME Record | `www` | `cname.vercel-dns.com` | Automatic |

### لو المزود هو **GoDaddy**:
1. ادخل على [GoDaddy DNS](https://dcc.godaddy.com/dns)
2. اختار `prompt-mr.com`
3. اضغط **DNS Records**
4. احذف سجلات A و CNAME القديمة
5. أضف نفس السجلات أعلاه

### لو المزود هو **Cloudflare**:
1. ادخل على [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. اختار `prompt-mr.com`
3. اذهب لـ **DNS** → **Records**
4. أضف السجلات:
   - A Record: Name = `@`, Content = `76.76.21.21`, **Proxy OFF** (DNS Only - الأيقونة الرمادية)
   - CNAME: Name = `www`, Content = `cname.vercel-dns.com`, **Proxy OFF**

> ⚠️ **مهم لمستخدمي Cloudflare**: يجب تعطيل Proxy (الأيقونة البرتقالية) وتحويلها لـ DNS Only (رمادية). Vercel يدير SSL بنفسه ولا يتوافق مع Cloudflare Proxy.

### لو المزود هو **Google Domains / Squarespace**:
1. اذهب لـ [Google Domains](https://domains.google.com/)
2. اختار `prompt-mr.com` → **DNS**
3. في **Custom Records** أضف نفس السجلات

---

## الخطوة 3: انتظار انتشار DNS (5 دقائق - 48 ساعة)

- عادةً بياخد **5-30 دقيقة**
- في بعض الحالات النادرة ممكن يوصل **24-48 ساعة**
- تقدر تتابع الانتشار من: [https://dnschecker.org/#A/prompt-mr.com](https://dnschecker.org/#A/prompt-mr.com)
- لما تشوف `76.76.21.21` ظاهر في أغلب المواقع → DNS اشتغل

---

## الخطوة 4: التحقق في Vercel

1. ارجع لـ **Vercel** → **Settings** → **Domains**
2. بجانب `prompt-mr.com` لازم يظهر ✅ **Valid Configuration**
3. Vercel هيصدر **شهادة SSL تلقائية** (Let's Encrypt) — ده بياخد 1-5 دقائق
4. بعد ما يظهر 🔒 **SSL Certificate Issued** → الدومين شغال بالكامل

---

## الخطوة 5: تحديث متغيرات البيئة (Environment Variables)

### في Vercel Dashboard:
1. اذهب لـ **Settings** → **Environment Variables**
2. ابحث عن `NEXT_PUBLIC_SITE_URL`
3. غيّر القيمة من:
   ```
   https://prompt-expert-book-ten.vercel.app
   ```
   إلى:
   ```
   https://prompt-mr.com
   ```
4. اضغط **Save**

### المتغيرات اللي لازم تتحدث:

| المتغير | القيمة القديمة | القيمة الجديدة |
|---------|---------------|---------------|
| `NEXT_PUBLIC_SITE_URL` | `https://prompt-expert-book-ten.vercel.app` | `https://prompt-mr.com` |

---

## الخطوة 6: تحديث Kashier (بوابة الدفع)

### في Kashier Dashboard:
1. ادخل على [Kashier Merchant Dashboard](https://merchant.kashier.io/)
2. اذهب لـ **Settings** أو **Integrations**
3. حدّث **Redirect URL / Callback URL** لـ:
   ```
   https://prompt-mr.com/payment/callback
   ```
4. حدّث **Webhook URL** لـ:
   ```
   https://prompt-mr.com/api/payment/webhook
   ```
5. تأكد إن الدومين `prompt-mr.com` مضاف في **Allowed Domains / Origins**

---

## الخطوة 7: تحديث Firebase (Google Auth)

### في Firebase Console:
1. افتح [Firebase Console](https://console.firebase.google.com/)
2. اختار مشروعك
3. اذهب لـ **Authentication** → **Settings** → **Authorized domains**
4. اضغط **Add domain**
5. أضف: `prompt-mr.com`
6. أضف كمان: `www.prompt-mr.com`

> ⚠️ **بدون هذه الخطوة**: تسجيل الدخول بـ Google **لن يعمل** على الدومين الجديد!

---

## الخطوة 8: إعادة النشر (Redeploy)

بعد تحديث Environment Variables، لازم تعمل redeploy:

```powershell
cd e:\testbookF\new-book\book2
npx vercel --prod --yes
```

أو من Vercel Dashboard:
1. اذهب لـ **Deployments**
2. اضغط على آخر deployment
3. اضغط **⋮** → **Redeploy**

---

## الخطوة 9: تحديث الكود (اختياري لكن مُوصى)

### تحديث `next.config.js` (لو فيه domain restrictions):

```js
// إضافة الدومين الجديد في images.domains لو محتاج
module.exports = {
  // ...
  images: {
    domains: ['prompt-mr.com', 'prompt-expert-book-ten.vercel.app'],
  },
}
```

### تحديث `robots.ts`:
```ts
// تحديث sitemap URL
sitemap: 'https://prompt-mr.com/sitemap.xml'
```

### تحديث `sitemap.ts`:
```ts
// تحديث base URL
const baseUrl = 'https://prompt-mr.com'
```

---

## الخطوة 10: اختبار شامل

بعد ما كل حاجة تشتغل، جرّب الآتي:

| الاختبار | الرابط | المتوقع |
|----------|--------|---------|
| الصفحة الرئيسية | `https://prompt-mr.com` | ✅ تفتح بدون أخطاء |
| WWW redirect | `https://www.prompt-mr.com` | ✅ يحول لـ `prompt-mr.com` |
| HTTP redirect | `http://prompt-mr.com` | ✅ يحول لـ `https://` |
| SSL Certificate | 🔒 في المتصفح | ✅ شهادة صالحة |
| تسجيل دخول Google | صفحة Login | ✅ يشتغل بدون أخطاء |
| تسجيل عادي | صفحة Register | ✅ يشتغل |
| الدفع | صفحة Payment | ✅ يفتح كاشير ويرجع للـ callback |
| Webhook | بعد الدفع | ✅ يتفعل الاشتراك |
| الرابط القديم | `prompt-expert-book-ten.vercel.app` | ✅ لسه شغال كـ fallback |

---

## ملخص الخطوات بالترتيب

```
1. ✏️  Vercel: أضف prompt-mr.com في Settings → Domains
2. 🌐 DNS: أضف A Record و CNAME عند مزود الدومين
3. ⏳ انتظر انتشار DNS (5-30 دقيقة عادةً)
4. ✅ Vercel: تأكد من Valid Configuration + SSL
5. 🔧 Vercel: حدّث NEXT_PUBLIC_SITE_URL
6. 💳 Kashier: حدّث Redirect URL + Webhook URL + Allowed Domains
7. 🔑 Firebase: أضف prompt-mr.com في Authorized Domains
8. 🚀 أعد النشر (Redeploy)
9. 📝 حدّث robots.ts و sitemap.ts (اختياري)
10. 🧪 اختبر كل حاجة
```

---

## ملاحظات مهمة

- ✅ **الرابط القديم** (`prompt-expert-book-ten.vercel.app`) **هيفضل شغال** — Vercel مش بيحذفه
- ✅ **SSL مجاني** — Vercel بيصدر شهادة Let's Encrypt تلقائياً
- ⚠️ **لو بتستخدم Cloudflare**: لازم تعطّل Proxy (DNS Only) عشان Vercel يدير SSL
- ⚠️ **لو عندك بريد إلكتروني** على الدومين: لا تحذف سجلات MX!
- 💡 **نصيحة**: ابدأ بالخطوات 1-4 الأول، وبعد ما DNS ينتشر كمّل الباقي
