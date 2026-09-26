/**
 * Generate GOLDS Mini Guide PDF — PromptMaster Brand
 * Run: node scripts/generate-pdf.cjs
 */
const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'assets', 'content', 'golds-mini-guide.pdf');

const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800;900&family=Tajawal:wght@300;400;500;700;800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --orange: #FF6B35;
    --orange-glow: #FF8C42;
    --dark-bg: #0A0A0A;
    --card-bg: #1A1A1A;
    --card-bg2: #141414;
    --white: #FFFFFF;
    --gray: #B0B0B0;
    --gray-muted: #707070;
  }

  body {
    font-family: 'Cairo', 'Tajawal', sans-serif;
    background: var(--dark-bg);
    color: var(--white);
    direction: rtl;
    line-height: 1.8;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ===== PAGE SETUP ===== */
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 20mm 22mm;
    page-break-after: always;
    position: relative;
    overflow: hidden;
    background: var(--dark-bg);
  }
  .page:last-child { page-break-after: avoid; }

  /* ===== BACKGROUND GLOW ===== */
  .page::before {
    content: '';
    position: absolute;
    top: -100px; right: -100px;
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(255,107,53,0.08) 0%, transparent 70%);
    pointer-events: none;
  }
  .page::after {
    content: '';
    position: absolute;
    bottom: -80px; left: -80px;
    width: 300px; height: 300px;
    background: radial-gradient(circle, rgba(255,140,66,0.05) 0%, transparent 70%);
    pointer-events: none;
  }

  /* ===== COVER PAGE ===== */
  .cover {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    min-height: 297mm;
    padding: 30mm 25mm;
  }
  .cover::before {
    content: '';
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(255,107,53,0.12) 0%, rgba(255,107,53,0.04) 40%, transparent 70%);
    pointer-events: none;
  }

  .brand-badge {
    display: inline-block;
    background: rgba(255,107,53,0.12);
    border: 1px solid rgba(255,107,53,0.3);
    border-radius: 50px;
    padding: 8px 28px;
    font-size: 14px;
    font-weight: 600;
    color: var(--orange);
    letter-spacing: 1px;
    margin-bottom: 24px;
  }

  .cover-icon {
    font-size: 72px;
    margin-bottom: 20px;
    filter: drop-shadow(0 0 30px rgba(255,107,53,0.4));
  }

  .cover h1 {
    font-size: 42px;
    font-weight: 900;
    background: linear-gradient(135deg, #FF6B35, #FF8C42);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 12px;
    line-height: 1.3;
  }

  .cover h2 {
    font-size: 24px;
    font-weight: 700;
    color: var(--white);
    margin-bottom: 16px;
  }

  .cover-subtitle {
    font-size: 17px;
    color: var(--gray);
    max-width: 420px;
    margin: 0 auto 40px;
    line-height: 1.9;
  }

  .cover-stats {
    display: flex;
    gap: 32px;
    justify-content: center;
    margin-bottom: 40px;
  }
  .stat-item {
    text-align: center;
  }
  .stat-number {
    font-size: 32px;
    font-weight: 900;
    color: var(--orange);
    display: block;
  }
  .stat-label {
    font-size: 13px;
    color: var(--gray-muted);
  }

  .cover-divider {
    width: 80px;
    height: 3px;
    background: linear-gradient(90deg, var(--orange), var(--orange-glow));
    border-radius: 2px;
    margin: 0 auto 32px;
  }

  .cover-footer {
    margin-top: auto;
    padding-top: 40px;
    font-size: 13px;
    color: var(--gray-muted);
  }
  .cover-footer a {
    color: var(--orange);
    text-decoration: none;
    font-weight: 600;
  }

  /* ===== SECTION HEADERS ===== */
  .section-header {
    margin-bottom: 28px;
    padding-bottom: 16px;
    border-bottom: 2px solid rgba(255,107,53,0.15);
  }
  .section-number {
    display: inline-block;
    background: linear-gradient(135deg, var(--orange), var(--orange-glow));
    color: white;
    width: 36px; height: 36px;
    border-radius: 10px;
    text-align: center;
    line-height: 36px;
    font-weight: 800;
    font-size: 16px;
    margin-left: 12px;
    vertical-align: middle;
  }
  .section-header h2 {
    display: inline;
    font-size: 28px;
    font-weight: 800;
    color: var(--white);
    vertical-align: middle;
  }
  .section-header p {
    font-size: 15px;
    color: var(--gray);
    margin-top: 8px;
    padding-right: 48px;
  }

  /* ===== GOLDS LETTER CARD ===== */
  .golds-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 28px 28px;
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
    transition: all 300ms ease;
  }
  .golds-card::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--orange), var(--orange-glow));
  }

  .golds-letter-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 14px;
  }

  .golds-letter {
    width: 56px; height: 56px;
    background: linear-gradient(135deg, var(--orange), var(--orange-glow));
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: 900;
    color: white;
    flex-shrink: 0;
    box-shadow: 0 4px 20px rgba(255,107,53,0.3);
  }

  .golds-title {
    font-size: 22px;
    font-weight: 800;
    color: var(--white);
  }
  .golds-title-en {
    font-size: 14px;
    font-weight: 600;
    color: var(--orange);
    display: block;
    margin-top: 2px;
  }

  .golds-desc {
    font-size: 15px;
    color: var(--gray);
    line-height: 1.9;
    margin-bottom: 14px;
  }

  /* ===== EXAMPLE BOXES ===== */
  .example-box {
    background: rgba(255,107,53,0.06);
    border: 1px solid rgba(255,107,53,0.15);
    border-radius: 12px;
    padding: 16px 20px;
    margin-top: 12px;
  }
  .example-box .label {
    font-size: 12px;
    font-weight: 700;
    color: var(--orange);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .bad-example {
    background: rgba(255,60,60,0.06);
    border-color: rgba(255,60,60,0.15);
    border-radius: 10px;
    padding: 10px 16px;
    margin-bottom: 8px;
    font-size: 14px;
    color: #ff6b6b;
  }
  .bad-example::before { content: '❌ '; }
  .good-example {
    background: rgba(50,205,50,0.06);
    border-color: rgba(50,205,50,0.15);
    border-radius: 10px;
    padding: 10px 16px;
    font-size: 14px;
    color: #50C878;
  }
  .good-example::before { content: '✅ '; }

  /* ===== TIPS ===== */
  .tip-list {
    list-style: none;
    padding: 0;
  }
  .tip-list li {
    font-size: 14px;
    color: var(--gray);
    padding: 6px 0;
    padding-right: 24px;
    position: relative;
    line-height: 1.7;
  }
  .tip-list li::before {
    content: '◆';
    position: absolute;
    right: 0;
    color: var(--orange);
    font-size: 10px;
    top: 10px;
  }

  /* ===== FULL EXAMPLE PAGE ===== */
  .full-example {
    background: var(--card-bg2);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 28px;
    margin: 20px 0;
  }
  .full-example h3 {
    font-size: 18px;
    font-weight: 700;
    color: var(--orange);
    margin-bottom: 16px;
  }
  .prompt-block {
    background: rgba(255,107,53,0.05);
    border: 1px solid rgba(255,107,53,0.2);
    border-radius: 14px;
    padding: 20px 24px;
    font-size: 15px;
    line-height: 2;
    color: var(--white);
    position: relative;
  }
  .prompt-block::before {
    content: '💡 Prompt';
    position: absolute;
    top: -10px; right: 20px;
    background: var(--dark-bg);
    padding: 0 10px;
    font-size: 12px;
    font-weight: 700;
    color: var(--orange);
  }
  .prompt-label {
    display: inline-block;
    background: linear-gradient(135deg, var(--orange), var(--orange-glow));
    color: white;
    padding: 2px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    margin-left: 4px;
  }

  /* ===== COMPARISON TABLE ===== */
  .compare-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    border-radius: 14px;
    overflow: hidden;
    margin: 20px 0;
    font-size: 14px;
  }
  .compare-table th {
    background: rgba(255,107,53,0.15);
    color: var(--orange);
    padding: 12px 16px;
    font-weight: 700;
    text-align: right;
  }
  .compare-table td {
    background: rgba(255,255,255,0.02);
    padding: 10px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    color: var(--gray);
  }
  .compare-table tr:last-child td { border-bottom: none; }
  .compare-table .highlight td {
    background: rgba(255,107,53,0.06);
    color: var(--white);
    font-weight: 600;
  }

  /* ===== CTA PAGE ===== */
  .cta-section {
    text-align: center;
    padding: 40px 30px;
    margin-top: 40px;
  }
  .cta-box {
    background: linear-gradient(135deg, rgba(255,107,53,0.12), rgba(255,140,66,0.06));
    border: 2px solid rgba(255,107,53,0.3);
    border-radius: 24px;
    padding: 40px 36px;
    margin: 0 auto;
    max-width: 440px;
  }
  .cta-box h2 {
    font-size: 28px;
    font-weight: 900;
    background: linear-gradient(135deg, #FF6B35, #FF8C42);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 16px;
  }
  .cta-box p {
    font-size: 16px;
    color: var(--gray);
    margin-bottom: 24px;
    line-height: 1.8;
  }
  .cta-button {
    display: inline-block;
    background: linear-gradient(135deg, #FF6B35, #FF8C42);
    color: white;
    padding: 16px 48px;
    border-radius: 14px;
    font-size: 18px;
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 0 20px rgba(255,107,53,0.4), 0 0 40px rgba(255,107,53,0.2);
  }

  .features-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 24px 0;
    text-align: right;
  }
  .feature-item {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 14px;
    color: var(--gray);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .feature-item .check {
    color: var(--orange);
    font-size: 16px;
    flex-shrink: 0;
  }

  /* ===== PAGE NUMBER ===== */
  .page-number {
    position: absolute;
    bottom: 15mm;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    color: var(--gray-muted);
  }

  /* ===== HEADER BAR ===== */
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .page-header .logo {
    font-size: 16px;
    font-weight: 900;
    background: linear-gradient(135deg, #FF6B35, #FF8C42);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .page-header .chapter {
    font-size: 12px;
    color: var(--gray-muted);
  }

  .intro-text {
    font-size: 16px;
    color: var(--gray);
    line-height: 2;
    margin-bottom: 24px;
  }

  .highlight-text {
    color: var(--orange);
    font-weight: 700;
  }

  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,107,53,0.2), transparent);
    margin: 24px 0;
  }

  .golds-overview {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin: 30px 0;
  }
  .golds-overview-item {
    text-align: center;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 16px 12px;
    width: 100px;
  }
  .golds-overview-item .letter {
    font-size: 32px;
    font-weight: 900;
    background: linear-gradient(135deg, #FF6B35, #FF8C42);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    display: block;
  }
  .golds-overview-item .word {
    font-size: 11px;
    color: var(--gray);
    display: block;
    margin-top: 4px;
  }
</style>
</head>
<body>

<!-- ==================== PAGE 1: COVER ==================== -->
<div class="page cover">
  <div class="brand-badge">PromptMaster</div>
  <div class="cover-icon">🏆</div>
  <h1>دليل GOLDS المصغّر</h1>
  <h2>5 تقنيات Prompt أساسية في 10 دقائق</h2>
  <div class="cover-divider"></div>
  <p class="cover-subtitle">
    اتعلم إزاي تكتب Prompts احترافية تخلّي الذكاء الاصطناعي يفهمك من أول مرة — باستخدام إطار عمل GOLDS البسيط والفعّال
  </p>
  <div class="cover-stats">
    <div class="stat-item">
      <span class="stat-number">5</span>
      <span class="stat-label">تقنيات أساسية</span>
    </div>
    <div class="stat-item">
      <span class="stat-number">10</span>
      <span class="stat-label">دقائق قراءة</span>
    </div>
    <div class="stat-item">
      <span class="stat-number">500+</span>
      <span class="stat-label">متعلم استفاد</span>
    </div>
  </div>
  <div class="cover-footer">
    من كتاب <a>خبير البرومبتات</a> — أول كتاب عربي تفاعلي لاحتراف الـ Prompt Engineering<br>
    prompt-mr.com
  </div>
</div>

<!-- ==================== PAGE 2: INTRO + GOLDS OVERVIEW ==================== -->
<div class="page">
  <div class="page-header">
    <span class="logo">PromptMaster</span>
    <span class="chapter">دليل GOLDS المصغّر</span>
  </div>

  <div class="section-header">
    <h2>ليه الـ Prompt مهم؟</h2>
  </div>

  <p class="intro-text">
    تخيّل إنك بتتكلم مع شخص ذكي جداً... بس مش بيعرف يقرأ أفكارك. <span class="highlight-text">الذكاء الاصطناعي زي كده بالظبط.</span>
  </p>
  <p class="intro-text">
    لو كتبتله <em>"اكتبلي حاجة عن التسويق"</em> — هيديك إجابة عامة مملة. لكن لو وصفتله بالظبط إنت عايز إيه، هيبهرك بالنتيجة.
  </p>
  <p class="intro-text">
    <span class="highlight-text">إطار GOLDS</span> هو أسهل طريقة تنظّم بيها أفكارك وتكتب Prompt فعّال في كل مرة — حتى لو أول مرة تستخدم ChatGPT.
  </p>

  <div class="divider"></div>

  <div style="text-align: center; margin-bottom: 16px;">
    <span style="font-size: 20px; font-weight: 800; color: var(--white);">إطار GOLDS — نظرة سريعة</span>
  </div>

  <div class="golds-overview">
    <div class="golds-overview-item">
      <span class="letter">G</span>
      <span class="word">Goal<br>الهدف</span>
    </div>
    <div class="golds-overview-item">
      <span class="letter">O</span>
      <span class="word">Output<br>المخرجات</span>
    </div>
    <div class="golds-overview-item">
      <span class="letter">L</span>
      <span class="word">Length<br>الطول</span>
    </div>
    <div class="golds-overview-item">
      <span class="letter">D</span>
      <span class="word">Details<br>التفاصيل</span>
    </div>
    <div class="golds-overview-item">
      <span class="letter">S</span>
      <span class="word">Style<br>الأسلوب</span>
    </div>
  </div>

  <div class="divider"></div>

  <p class="intro-text" style="text-align: center; font-size: 15px;">
    في الصفحات الجاية، هنشرح كل حرف بالتفصيل مع أمثلة عملية تقدر تجربها فوراً 👇
  </p>

  <span class="page-number">2</span>
</div>

<!-- ==================== PAGE 3: G — Goal ==================== -->
<div class="page">
  <div class="page-header">
    <span class="logo">PromptMaster</span>
    <span class="chapter">G — Goal</span>
  </div>

  <div class="golds-card">
    <div class="golds-letter-row">
      <div class="golds-letter">G</div>
      <div>
        <div class="golds-title">الهدف</div>
        <span class="golds-title-en">Goal — حدّد بالظبط إنت عايز إيه</span>
      </div>
    </div>
    <p class="golds-desc">
      أول وأهم خطوة. <strong style="color: var(--white);">ابدأ بفعل واضح</strong> يوصف اللي عايزه من الـ AI. كل ما الهدف كان أوضح، النتيجة هتكون أدق.
    </p>

    <div class="example-box">
      <div class="label">🎯 مثال عملي</div>
      <div class="bad-example">اكتبلي حاجة عن التسويق</div>
      <div class="good-example">اكتبلي خطة تسويق لمتجر إلكتروني لبيع الملابس مدتها 30 يوم</div>
    </div>

    <ul class="tip-list" style="margin-top: 16px;">
      <li>ابدأ دايماً بفعل: <strong style="color: var(--white);">اكتب، حلل، قارن، لخّص، صمم</strong></li>
      <li>خلّي الهدف محدد وقابل للقياس</li>
      <li>لو الهدف معقد — قسّمه لخطوات</li>
    </ul>
  </div>

  <!-- O — Output -->
  <div class="golds-card">
    <div class="golds-letter-row">
      <div class="golds-letter">O</div>
      <div>
        <div class="golds-title">المخرجات</div>
        <span class="golds-title-en">Output — وصف شكل النتيجة اللي عايزها</span>
      </div>
    </div>
    <p class="golds-desc">
      حدّد <strong style="color: var(--white);">الشكل أو الـ format</strong> اللي عايز النتيجة تطلع فيه. ده بيفرق كتير في جودة الإجابة.
    </p>

    <div class="example-box">
      <div class="label">📋 الأشكال المتاحة</div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
        <span style="background: rgba(255,107,53,0.15); padding: 4px 14px; border-radius: 20px; font-size: 13px; color: var(--orange);">📝 نص</span>
        <span style="background: rgba(255,107,53,0.15); padding: 4px 14px; border-radius: 20px; font-size: 13px; color: var(--orange);">📊 جدول</span>
        <span style="background: rgba(255,107,53,0.15); padding: 4px 14px; border-radius: 20px; font-size: 13px; color: var(--orange);">🔢 قائمة مرقمة</span>
        <span style="background: rgba(255,107,53,0.15); padding: 4px 14px; border-radius: 20px; font-size: 13px; color: var(--orange);">💻 كود</span>
        <span style="background: rgba(255,107,53,0.15); padding: 4px 14px; border-radius: 20px; font-size: 13px; color: var(--orange);">📧 إيميل</span>
        <span style="background: rgba(255,107,53,0.15); padding: 4px 14px; border-radius: 20px; font-size: 13px; color: var(--orange);">❓ FAQ</span>
      </div>
    </div>

    <ul class="tip-list" style="margin-top: 14px;">
      <li>ممكن تطلب أكتر من شكل: "اكتبلي جدول + ملخص في 3 نقاط"</li>
      <li>الجدول مثالي للمقارنات، والقوائم مثالية للخطوات</li>
    </ul>
  </div>

  <span class="page-number">3</span>
</div>

<!-- ==================== PAGE 4: L + D ==================== -->
<div class="page">
  <div class="page-header">
    <span class="logo">PromptMaster</span>
    <span class="chapter">L — Length  |  D — Details</span>
  </div>

  <!-- L — Length -->
  <div class="golds-card">
    <div class="golds-letter-row">
      <div class="golds-letter">L</div>
      <div>
        <div class="golds-title">الطول</div>
        <span class="golds-title-en">Length — تحكّم في حجم الإجابة</span>
      </div>
    </div>
    <p class="golds-desc">
      بدون تحديد الطول، الـ AI ممكن يديك سطرين أو صفحتين! <strong style="color: var(--white);">حدّد الطول بدقة</strong> حسب احتياجك.
    </p>

    <div class="example-box">
      <div class="label">📏 طرق تحديد الطول</div>
      <table style="width: 100%; font-size: 13px; color: var(--gray); margin-top: 8px;">
        <tr><td style="padding: 4px 0;">🔤 بالكلمات</td><td>"في 100 كلمة" أو "200-300 كلمة"</td></tr>
        <tr><td style="padding: 4px 0;">📝 بالجُمل</td><td>"في 3 جمل" أو "5 جمل حد أقصى"</td></tr>
        <tr><td style="padding: 4px 0;">📄 بالفقرات</td><td>"فقرتين" أو "3 فقرات قصيرة"</td></tr>
        <tr><td style="padding: 4px 0;">🔢 بالنقاط</td><td>"5 نقاط" أو "3-7 عناصر"</td></tr>
        <tr><td style="padding: 4px 0;">⏱️ بوقت القراءة</td><td>"في دقيقتين قراءة"</td></tr>
      </table>
    </div>
  </div>

  <!-- D — Details -->
  <div class="golds-card">
    <div class="golds-letter-row">
      <div class="golds-letter">D</div>
      <div>
        <div class="golds-title">التفاصيل</div>
        <span class="golds-title-en">Details — أعطيه السياق اللي يحتاجه</span>
      </div>
    </div>
    <p class="golds-desc">
      الـ AI مش بيعرف حاجة عنك! <strong style="color: var(--white);">كل ما تديله تفاصيل أكتر، النتيجة هتكون أدق.</strong> فكّر في 4 أسئلة:
    </p>

    <div class="example-box">
      <div class="label">🔍 أسئلة التفاصيل الأربعة</div>
      <div style="margin-top: 12px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
          <span style="background: var(--orange); color: white; width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; flex-shrink: 0;">1</span>
          <span style="font-size: 14px; color: var(--white);"><strong>الجمهور:</strong> <span style="color: var(--gray);">مين هيقرأ أو يستخدم ده؟</span></span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
          <span style="background: var(--orange); color: white; width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; flex-shrink: 0;">2</span>
          <span style="font-size: 14px; color: var(--white);"><strong>السياق:</strong> <span style="color: var(--gray);">هيُستخدم فين ومتى؟</span></span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
          <span style="background: var(--orange); color: white; width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; flex-shrink: 0;">3</span>
          <span style="font-size: 14px; color: var(--white);"><strong>المتطلبات:</strong> <span style="color: var(--gray);">إيه اللي لازم يكون موجود؟</span></span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="background: var(--orange); color: white; width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; flex-shrink: 0;">4</span>
          <span style="font-size: 14px; color: var(--white);"><strong>القيود:</strong> <span style="color: var(--gray);">إيه اللي لازم أتجنبه أو أبعد عنه؟</span></span>
        </div>
      </div>
    </div>
  </div>

  <span class="page-number">4</span>
</div>

<!-- ==================== PAGE 5: S — Style ==================== -->
<div class="page">
  <div class="page-header">
    <span class="logo">PromptMaster</span>
    <span class="chapter">S — Style</span>
  </div>

  <div class="golds-card">
    <div class="golds-letter-row">
      <div class="golds-letter">S</div>
      <div>
        <div class="golds-title">الأسلوب</div>
        <span class="golds-title-en">Style — حدّد النبرة والشخصية</span>
      </div>
    </div>
    <p class="golds-desc">
      نفس المحتوى ممكن يتكتب بـ 10 أساليب مختلفة. <strong style="color: var(--white);">الأسلوب بيحدد إزاي الإجابة بتتقال</strong> مش إيه اللي بيتقال.
    </p>

    <div class="example-box">
      <div class="label">🎨 أبعاد الأسلوب</div>
      <table style="width: 100%; font-size: 13px; margin-top: 8px; border-spacing: 0;">
        <tr>
          <td style="padding: 6px 0; color: var(--orange); font-weight: 700; width: 80px;">النبرة</td>
          <td style="padding: 6px 0; color: var(--gray);">رسمي، ودي، فكاهي، جدي، تحفيزي</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: var(--orange); font-weight: 700;">المستوى</td>
          <td style="padding: 6px 0; color: var(--gray);">مبتدئ، متوسط، خبير، أكاديمي</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: var(--orange); font-weight: 700;">الشخصية</td>
          <td style="padding: 6px 0; color: var(--gray);">"زي مدرّس صبور"، "زي صاحبك الخبير"</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: var(--orange); font-weight: 700;">اللغة</td>
          <td style="padding: 6px 0; color: var(--gray);">فصحى، عامية، تقنية، بسيطة</td>
        </tr>
      </table>
    </div>

    <div class="example-box" style="margin-top: 14px;">
      <div class="label">💬 شوف الفرق</div>
      <div class="bad-example" style="margin-top: 8px;">اشرحلي الذكاء الاصطناعي</div>
      <div class="good-example">اشرحلي الذكاء الاصطناعي بأسلوب بسيط وودّي، كأنك مدرّس بيشرح لطالب في ثانوي، بالعامية المصرية</div>
    </div>
  </div>

  <div class="divider"></div>

  <!-- GOLDS Complete Template -->
  <div style="text-align: center; margin-bottom: 16px;">
    <span style="font-size: 20px; font-weight: 800; color: var(--white);">📋 قالب GOLDS الكامل</span>
  </div>

  <div class="prompt-block">
    <span class="prompt-label">G</span> <strong>[الهدف]:</strong> اكتبلي...  / حلّللي... / قارنلي...<br><br>
    <span class="prompt-label">O</span> <strong>[المخرجات]:</strong> في شكل جدول / قائمة / نص...<br><br>
    <span class="prompt-label">L</span> <strong>[الطول]:</strong> في 200 كلمة / 5 نقاط / فقرتين...<br><br>
    <span class="prompt-label">D</span> <strong>[التفاصيل]:</strong> الجمهور... السياق... المتطلبات...<br><br>
    <span class="prompt-label">S</span> <strong>[الأسلوب]:</strong> بأسلوب... ونبرة... ولغة...
  </div>

  <span class="page-number">5</span>
</div>

<!-- ==================== PAGE 6: FULL EXAMPLE ==================== -->
<div class="page">
  <div class="page-header">
    <span class="logo">PromptMaster</span>
    <span class="chapter">مثال عملي كامل</span>
  </div>

  <div class="section-header">
    <h2>🚀 مثال عملي: GOLDS في العمل</h2>
    <p>شوف إزاي الـ 5 عناصر بيتجمعوا مع بعض في Prompt واحد فعّال</p>
  </div>

  <div class="full-example">
    <h3>المهمة: كتابة إيميل تسويقي</h3>
    <div class="prompt-block" style="margin-bottom: 20px;">
      <span class="prompt-label">G</span> اكتبلي إيميل تسويقي لإطلاق منتج جديد — تطبيق لإدارة المهام اسمه "مُنجز"<br><br>
      <span class="prompt-label">O</span> في شكل إيميل HTML بسيط: عنوان جذاب + مقدمة + 3 مميزات + CTA<br><br>
      <span class="prompt-label">L</span> الإيميل كله ما يزيدش عن 200 كلمة<br><br>
      <span class="prompt-label">D</span> الجمهور: رواد أعمال عرب (25-40 سنة). التطبيق مجاني أول 30 يوم. متاح على iOS و Android. يدعم العربية بالكامل<br><br>
      <span class="prompt-label">S</span> أسلوب حماسي وودّي، بالعامية المصرية، زي صاحبك اللي بيقولك على حاجة حلوة لقاها
    </div>
  </div>

  <div class="divider"></div>

  <!-- Comparison Table -->
  <div style="text-align: center; margin-bottom: 16px;">
    <span style="font-size: 18px; font-weight: 800; color: var(--white);">GOLDS مقارنة بباقي الـ Frameworks</span>
  </div>

  <table class="compare-table">
    <thead>
      <tr>
        <th>الإطار</th>
        <th>العناصر</th>
        <th>التركيز</th>
        <th>الأنسب لـ</th>
      </tr>
    </thead>
    <tbody>
      <tr class="highlight">
        <td>🏆 GOLDS</td>
        <td>5</td>
        <td>البساطة + الشمول</td>
        <td>كل الأغراض</td>
      </tr>
      <tr>
        <td>CO-STAR</td>
        <td>6</td>
        <td>المحتوى التسويقي</td>
        <td>الإعلانات</td>
      </tr>
      <tr>
        <td>CRISPE</td>
        <td>6</td>
        <td>لعب الأدوار</td>
        <td>الاستشارات</td>
      </tr>
      <tr>
        <td>RTF</td>
        <td>3</td>
        <td>السرعة</td>
        <td>المهام البسيطة</td>
      </tr>
      <tr>
        <td>RISEN</td>
        <td>5</td>
        <td>الخطوات</td>
        <td>المهام المعقدة</td>
      </tr>
    </tbody>
  </table>

  <span class="page-number">6</span>
</div>

<!-- ==================== PAGE 7: CTA ==================== -->
<div class="page">
  <div class="page-header">
    <span class="logo">PromptMaster</span>
    <span class="chapter">الخطوة التالية</span>
  </div>

  <div style="text-align: center; margin-top: 30px;">
    <div style="font-size: 56px; margin-bottom: 16px;">🎯</div>
    <h2 style="font-size: 30px; font-weight: 900; color: var(--white); margin-bottom: 12px;">عجبك اللي قريته؟ ده بس البداية!</h2>
    <p style="font-size: 16px; color: var(--gray); max-width: 450px; margin: 0 auto 30px; line-height: 1.9;">
      في الكتاب الكامل هتلاقي <span class="highlight-text">89 صفحة</span> تفاعلية + <span class="highlight-text">40+ تمرين</span> عملي + <span class="highlight-text">55+ قالب Prompt</span> جاهز + مشروع ممتد تبنيه من الصفر
    </p>
  </div>

  <div class="features-grid">
    <div class="feature-item">
      <span class="check">✦</span>
      <span>10 فصول شاملة من الأساسيات للاحتراف</span>
    </div>
    <div class="feature-item">
      <span class="check">✦</span>
      <span>40+ تمرين تفاعلي بتطبق فيه وانت بتتعلم</span>
    </div>
    <div class="feature-item">
      <span class="check">✦</span>
      <span>55+ قالب Prompt جاهز للاستخدام</span>
    </div>
    <div class="feature-item">
      <span class="check">✦</span>
      <span>مشروع ممتد: تبني AI Agent من الصفر</span>
    </div>
    <div class="feature-item">
      <span class="check">✦</span>
      <span>Daily Missions + نقاط + ترتيب</span>
    </div>
    <div class="feature-item">
      <span class="check">✦</span>
      <span>شهادة إتمام قابلة للمشاركة</span>
    </div>
    <div class="feature-item">
      <span class="check">✦</span>
      <span>محتوى عربي 100% بأسلوب سهل</span>
    </div>
    <div class="feature-item">
      <span class="check">✦</span>
      <span>تحديثات مستمرة مع أحدث أدوات AI</span>
    </div>
  </div>

  <div class="cta-section">
    <div class="cta-box">
      <h2>ابدأ رحلتك دلوقتي 🚀</h2>
      <p>
        ابدأ مجاناً بالمقدمة والفصل الأول — أو اختار خطة تناسبك وابدأ تحترف!
      </p>
      <a class="cta-button">prompt-mr.com</a>
      <p style="font-size: 13px; color: var(--gray-muted); margin-top: 16px; margin-bottom: 0;">
        خطط تبدأ من 299 جنيه/سنة فقط
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 40px;">
    <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(255,107,53,0.3), transparent); margin-bottom: 20px;"></div>
    <p style="font-size: 13px; color: var(--gray-muted);">
      تم إعداد هذا الدليل بواسطة فريق <span style="color: var(--orange); font-weight: 700;">PromptMaster</span><br>
      جميع الحقوق محفوظة © 2026
    </p>
  </div>

  <span class="page-number">7</span>
</div>

</body>
</html>`;

async function generatePDF() {
  console.log('⏳ Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  console.log('⏳ Rendering HTML...');
  await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: 30000 });

  console.log('⏳ Generating PDF...');
  await page.pdf({
    path: OUTPUT_PATH,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    preferCSSPageSize: false,
  });

  await browser.close();
  console.log(`✅ PDF generated: ${OUTPUT_PATH}`);
}

generatePDF().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
