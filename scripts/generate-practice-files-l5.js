// Level 5 practice file (fictional): the time sheet for lesson 5.1, used again in the project.
// One example row (Ahmed's month from the lesson: 150 − (10 + 5 + 45) − 20 = 70) and empty rows whose sums fill in by themselves.
// Needs exceljs, which is not a project dependency: install it in a temp folder and run
//   NODE_PATH=<that folder>/node_modules node scripts/generate-practice-files-l5.js <repo-root>
const fs = require('fs')
const path = require('path')
const ExcelJS = require('exceljs')

const root = process.argv[2]
const filesDir = path.join(root, 'public', 'assets', 'practice')
fs.mkdirSync(filesDir, { recursive: true })

const columns = [
    { header: 'التاريخ', key: 'date', width: 12 },
    { header: 'الشغلانة', key: 'task', width: 30 },
    { header: 'شغل حقيقي ولا حالات تجريبية', key: 'kind', width: 16 },
    { header: 'من غير AI (دقيقة)', key: 'without', width: 13 },
    { header: 'قياس ولا تقدير', key: 'how', width: 12 },
    { header: 'تحضير', key: 'prep', width: 9 },
    { header: 'تشغيل', key: 'run', width: 9 },
    { header: 'مراجعة وتصليح', key: 'review', width: 12 },
    { header: 'الوقت معاه', key: 'with', width: 11 },
    { header: 'أغلاط اتمسكت', key: 'caught', width: 11 },
    { header: 'أغلاط فلتت', key: 'slipped', width: 10 },
    { header: 'وقت تصليح اللي فلت', key: 'fix', width: 14 },
    { header: 'التوفير الصافي', key: 'net', width: 13 },
    { header: 'ملاحظات', key: 'notes', width: 34 },
]

const EMPTY_ROWS = 20
const NOTE = 'ملف تدريب من PromptMaster — السطر الأول مثال (أحمد في الدرس)، امسحه أو سيبه. الوقت معاه والتوفير الصافي بيتحسبوا لوحدهم.'

;(async () => {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'PromptMaster — ملف تدريب'
    const ws = wb.addWorksheet('القياس', { views: [{ rightToLeft: true, state: 'frozen', ySplit: 1 }] })
    ws.columns = columns
    ws.getRow(1).font = { bold: true }
    ws.getRow(1).alignment = { wrapText: true, vertical: 'middle' }
    ws.getRow(1).height = 34

    ws.addRow({ date: '2026-10-05', task: 'مثال: مراجعة فواتير الشهر (أحمد)', kind: 'حالات تجريبية', without: 150, how: 'تقدير', prep: 10, run: 5, review: 45, caught: 2, slipped: 1, fix: 20, notes: 'فاتورة فلتت، واتكشفت مع المورد بعد أسبوع' })
    for (let i = 0; i < EMPTY_ROWS; i++) ws.addRow({})

    const last = 1 + 1 + EMPTY_ROWS
    for (let r = 2; r <= last; r++) {
        // Blank until the row has numbers, so the empty rows don't show zeros.
        ws.getCell(`I${r}`).value = { formula: `IF(COUNT(F${r}:H${r})=0,"",SUM(F${r}:H${r}))` }
        ws.getCell(`M${r}`).value = { formula: `IF(OR(D${r}="",I${r}=""),"",D${r}-I${r}-N(L${r}))` }
        for (const col of ['I', 'M']) ws.getCell(`${col}${r}`).font = { bold: true }
    }
    ws.getRow(2).font = { italic: true, color: { argb: 'FF666666' } }

    const total = last + 1
    ws.getCell(`B${total}`).value = 'الإجمالي (من غير سطر المثال)'
    ws.getCell(`B${total}`).font = { bold: true }
    for (const col of ['D', 'I', 'J', 'K', 'L', 'M']) {
        ws.getCell(`${col}${total}`).value = { formula: `SUM(${col}3:${col}${last})` }
        ws.getCell(`${col}${total}`).font = { bold: true }
    }
    ws.addRow([])
    ws.addRow([NOTE])

    await wb.xlsx.writeFile(path.join(filesDir, 'time-measure.xlsx'))
    console.log('wrote time-measure.xlsx')
})()
