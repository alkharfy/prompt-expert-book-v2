// Generates the Level 2 practice photos in public/assets/practice/ (all fictional):
//   receipts-oct-2026.jpg   — 3 crumpled thermal receipts on a desk; the fuel one has a faded digit (4?0).
//   order-invoice-photo.jpg — a customer's photo of order NS-5530's invoice; a coffee stain hides the receive day.
// Usage: node scripts/generate-practice-files-l2.js <repo-root>   (uses the repo's puppeteer-core + installed Chrome)
const path = require('path')
const puppeteer = require(path.join(process.argv[2], 'node_modules', 'puppeteer-core'))

const root = process.argv[2]
const outDir = path.join(root, 'public', 'assets', 'practice')

const noise = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`

const base = `
*{box-sizing:border-box;margin:0;padding:0}
body{width:900px;height:1000px;overflow:hidden;font-family:Tahoma,"Segoe UI",Arial,sans-serif;direction:rtl}
.desk{position:absolute;inset:0;background:
  ${noise},
  repeating-linear-gradient(92deg,#7a5534 0 14px,#6e4b2d 14px 22px,#80593a 22px 40px,#704c2e 40px 52px);
}
.vignette{position:absolute;inset:0;background:radial-gradient(ellipse at 45% 40%,rgba(0,0,0,0) 45%,rgba(0,0,0,.45) 100%);pointer-events:none}
.paper{position:absolute;background:#f3efe6;color:#3a3a3a;box-shadow:0 18px 30px rgba(0,0,0,.45),0 2px 4px rgba(0,0,0,.3)}
.paper::after{content:"";position:absolute;inset:0;pointer-events:none;mix-blend-mode:multiply;background:
  linear-gradient(115deg,rgba(0,0,0,0) 0 30%,rgba(0,0,0,.10) 31%,rgba(0,0,0,0) 36%),
  linear-gradient(68deg,rgba(0,0,0,0) 0 55%,rgba(0,0,0,.08) 56%,rgba(255,255,255,0) 60%),
  linear-gradient(160deg,rgba(0,0,0,0) 0 70%,rgba(0,0,0,.09) 71%,rgba(0,0,0,0) 75%),
  linear-gradient(20deg,rgba(255,255,255,.0) 0 15%,rgba(0,0,0,.06) 16%,rgba(0,0,0,0) 22%),
  ${noise}}
.thermal{font-size:17px;line-height:1.75;padding:22px 20px 26px;width:280px;filter:blur(.35px);
  clip-path:polygon(0 1.5%,6% 0,12% 1.5%,18% 0,24% 1.5%,30% 0,36% 1.5%,42% 0,48% 1.5%,54% 0,60% 1.5%,66% 0,72% 1.5%,78% 0,84% 1.5%,90% 0,96% 1.5%,100% 0,100% 98.5%,94% 100%,88% 98.5%,82% 100%,76% 98.5%,70% 100%,64% 98.5%,58% 100%,52% 98.5%,46% 100%,40% 98.5%,34% 100%,28% 98.5%,22% 100%,16% 98.5%,10% 100%,4% 98.5%,0 100%)}
.thermal h3{text-align:center;font-size:19px;margin-bottom:2px}
.c{text-align:center}.row{display:flex;justify-content:space-between;gap:8px}.dash{border-top:2px dashed #777;margin:8px 0}
.b{font-weight:bold}.n{direction:ltr;unicode-bidi:embed;font-family:Consolas,"Courier New",monospace}
.faded{color:#9a9a9a}.ghost{opacity:.16;filter:blur(1.4px)}
`

const receipts = `<!doctype html><html lang="ar"><head><meta charset="utf-8"><style>${base}</style></head><body>
<div class="desk"></div>
<div class="paper thermal" style="top:110px;right:70px;transform:rotate(-5deg) skewY(1deg)">
  <h3>مكتبة الأمل</h3><div class="c">المعادي — القاهرة</div>
  <div class="c n">12/10/2026  10:42</div><div class="dash"></div>
  <div class="row"><span>ورق A4 رزمة</span><span class="n">1 x 185.00</span></div><div class="row"><span></span><span class="n">185.00</span></div>
  <div class="row"><span>قلم جاف</span><span class="n">10 x 6.00</span></div><div class="row"><span></span><span class="n">60.00</span></div>
  <div class="dash"></div><div class="row b"><span>الإجمالي</span><span class="n">245.00</span></div>
  <div class="dash"></div><div class="c">شكراً لزيارتكم</div>
</div>
<div class="paper thermal faded" style="top:180px;right:390px;width:250px;transform:rotate(7deg) skewX(-2deg)">
  <h3>محطة وقود</h3><div class="c">الطريق الدائري</div>
  <div class="c n">14/10/2026  08:15</div><div class="dash"></div>
  <div class="row"><span>بنزين 92</span><span></span></div>
  <div class="row b"><span>المبلغ</span><span class="n">4<span class="ghost">8</span>0.00</span></div>
  <div class="row"><span>طريقة الدفع</span><span>كاش</span></div>
  <div class="dash"></div><div class="c">نتمنى لكم رحلة سعيدة</div>
</div>
<div class="paper thermal" style="top:560px;right:130px;transform:rotate(-2deg) skewY(-1.5deg)">
  <h3>بوفيه الصفا</h3><div class="c n">15/10/2026</div><div class="dash"></div>
  <div class="row"><span>شاي</span><span class="n">6 x 10.00</span></div><div class="row"><span></span><span class="n">60.00</span></div>
  <div class="row"><span>قهوة</span><span class="n">4 x 25.00</span></div><div class="row"><span></span><span class="n">100.00</span></div>
  <div class="dash"></div><div class="row b"><span>الإجمالي</span><span class="n">160.00</span></div>
</div>
<div class="vignette"></div>
</body></html>`

const invoice = `<!doctype html><html lang="ar"><head><meta charset="utf-8"><style>${base}
.sheet{top:90px;right:110px;width:640px;padding:34px 38px;font-size:19px;line-height:1.9;transform:perspective(1400px) rotateX(9deg) rotateZ(-3.5deg)}
.sheet h2{font-size:28px;margin-bottom:4px}.sheet table{width:100%;border-collapse:collapse;margin:14px 0}
.sheet td,.sheet th{border:1px solid #888;padding:6px 8px;text-align:right}.muted{color:#666;font-size:15px}
.stain{position:relative;display:inline-block}
.stain::before{content:"";position:absolute;left:-16px;right:-12px;top:-12px;bottom:-14px;border-radius:48% 52% 45% 55%;
  background:radial-gradient(ellipse at 50% 50%,rgba(104,64,30,.96) 0 52%,rgba(104,64,30,.7) 62%,rgba(104,64,30,.25) 72%,rgba(104,64,30,0) 78%)}
</style></head><body>
<div class="desk" style="filter:brightness(.92) hue-rotate(-8deg)"></div>
<div class="paper sheet">
  <h2>نيكست ستيب</h2><div class="muted">أجهزة ومنتجات منزلية — أونلاين</div>
  <div class="dash"></div>
  <div><b>فاتورة</b></div>
  <div>رقم الطلب: <span class="n b">NS-5530</span></div>
  <div>تاريخ الطلب: <span class="n">01/10/2026</span></div>
  <div>تاريخ الاستلام: <span class="n"><span class="stain">07</span>/10/2026</span></div>
  <div>اسم العميل: مصطفى عادل · <span class="n">0100 000 0007</span></div>
  <table><tr><th>المنتج</th><th>الكمية</th><th>السعر</th></tr>
  <tr><td>غطا سرير مقاس كبير (240×260)</td><td class="n">1</td><td class="n">1,150</td></tr>
  <tr><td>الشحن</td><td></td><td class="n">50</td></tr>
  <tr><td class="b">الإجمالي</td><td></td><td class="n b">1,200</td></tr></table>
  <div class="muted">الاستبدال مجاني خلال 14 يوم من الاستلام، لو المنتج بحالته وفي كرتونته.</div>
  <div class="muted">ملف تدريب من PromptMaster — كل الأسامي والأرقام وهمية.</div>
</div>
<div class="vignette"></div>
</body></html>`

;(async () => {
    const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
    const tab = await browser.newPage()
    await tab.setViewport({ width: 900, height: 1000, deviceScaleFactor: 1 })
    for (const [html, file] of [[receipts, 'receipts-oct-2026.jpg'], [invoice, 'order-invoice-photo.jpg']]) {
        await tab.setContent(html, { waitUntil: 'load' })
        await tab.screenshot({ path: path.join(outDir, file), type: 'jpeg', quality: 70 })
        console.log('wrote', file)
    }
    await browser.close()
})()
