// Generates the Level 3 reference files in public/assets/practice/ (all fictional, same company as Levels 1–2):
//   approved-suppliers.pdf — Ahmed's reference file: approved suppliers, Kleen Pro's fixed 1,600, the 5,000 approval limit.
//   approved-replies.pdf   — Mona's reference file: the company's approved reply styles (same as the Level 2 examples).
// The text must stay identical to SUPPLIERS and APPROVED_REPLIES in src/data/unit3Data.ts.
// Usage: node scripts/generate-practice-files-l3.js <repo-root>   (uses the repo's puppeteer-core + installed Chrome)
const path = require('path')
const puppeteer = require(path.join(process.argv[2], 'node_modules', 'puppeteer-core'))

const root = process.argv[2]
const outDir = path.join(root, 'public', 'assets', 'practice')

const page = (title, body) => `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
body{font-family:"Segoe UI",Tahoma,Arial,sans-serif;font-size:13.5pt;line-height:1.9;color:#111;margin:0}
h1{font-size:19pt;margin:0 0 4px} h2{font-size:14pt;margin:22px 0 6px} .muted{color:#666;font-size:10.5pt}
table{border-collapse:collapse;width:100%;font-size:12pt} th,td{border:1px solid #999;padding:6px 8px;text-align:right;vertical-align:top}
th{background:#eee} ul li{margin-bottom:6px} .quote{border-right:3px solid #999;padding:4px 12px;margin:6px 0 14px}
</style></head><body><h1>${title}</h1>${body}<p class="muted">ملف تدريب من PromptMaster — كل الأسامي والأرقام وهمية.</p></body></html>`

const suppliers = page('قايمة الموردين المعتمدين — نيكست ستيب', `
<p class="muted">آخر تحديث: 1 أكتوبر 2026 · للمراجعة جوه الشركة</p>
<table>
<tr><th>#</th><th>المورد</th><th>بيورّد إيه</th><th>السعر</th><th>السداد</th></tr>
<tr><td>1</td><td>النور لمستلزمات المكاتب</td><td>ورق وأحبار وأدوات مكتبية</td><td>حسب أمر الشراء</td><td>خلال 30 يوم</td></tr>
<tr><td>2</td><td>المصرية للصيانة</td><td>صيانة التكييفات والمولّد والأجهزة</td><td>حسب أمر الشغل</td><td>خلال 30 يوم</td></tr>
<tr><td>3</td><td>سريع للشحن</td><td>شحن طلبيات العملاء (فاتورة كل أسبوع)</td><td>حسب عدد الشحنات</td><td>خلال 15 يوم</td></tr>
<tr><td>4</td><td>كلين برو للنضافة</td><td>نضافة المكاتب</td><td>ثابت: 1,600 في الشهر قبل الضريبة</td><td>خلال 15 يوم</td></tr>
<tr><td>5</td><td>دلتا للأجهزة</td><td>أجهزة كمبيوتر وملحقاتها</td><td>حسب أمر الشراء</td><td>خلال 30 يوم</td></tr>
</table>
<h2>قواعد</h2>
<ol>
<li>ضريبة القيمة المضافة 14٪ على فواتير الموردين دول (في التدريب ده).</li>
<li>أي فاتورة فوق 5,000 جنيه قبل الضريبة: موافقة المدير المالي قبل السداد.</li>
<li>أي مورد مش في القايمة: محتاج موافقة المدير المالي قبل أي تعامل.</li>
</ol>`)

const replies = page('ردود نيكست ستيب المعتمدة', `
<p class="muted">آخر تحديث: 1 أكتوبر 2026 · أمثلة للأسلوب بس، واللي بين [ ] بيتغيّر</p>
<h2>1. تأخير</h2>
<p class="quote">«حقك علينا يا فندم، طلب حضرتك رقم [رقم الطلب] اتأخر عن ميعاده. هتابع مع شركة الشحن وأرجعلك [الميعاد]. ولو احتجت أي حاجة، أنا معاك.»</p>
<h2>2. منتج فيه عيب أو كسر</h2>
<p class="quote">«آسفين جداً على كده. ابعتلنا صورة للمنتج، والفني هيفحصه خلال يومين عمل، وبعدها حضرتك تختار: تبديل أو استرجاع.»</p>
<h2>3. طلب مش في إيدي (خصم، أو تعويض، أو سؤال قانوني)</h2>
<p class="quote">«تمام يا فندم، هحوّل طلب حضرتك للمشرف المسؤول، وهيرد على حضرتك [الميعاد].»</p>`)

async function pdf(browser, html, file) {
    const tab = await browser.newPage()
    await tab.setContent(html, { waitUntil: 'load' })
    await tab.pdf({ path: path.join(outDir, file), format: 'A4', margin: { top: '22mm', bottom: '22mm', left: '20mm', right: '20mm' }, printBackground: true })
    await tab.close()
}

;(async () => {
    const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
    await pdf(browser, suppliers, 'approved-suppliers.pdf')
    await pdf(browser, replies, 'approved-replies.pdf')
    await browser.close()
    console.log('done: approved-suppliers.pdf, approved-replies.pdf')
})()
