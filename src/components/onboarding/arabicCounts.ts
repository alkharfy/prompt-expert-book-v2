// Egyptian-Arabic count phrases: «يوم واحد / يومين / 3 أيام / 11 يوم».

interface CountForms {
  one: string
  two: string
  few: string // 3–10
  many: string // 11+
}

export function arabicCount(n: number, forms: CountForms): string {
  if (n === 1) return forms.one
  if (n === 2) return forms.two
  if (n >= 3 && n <= 10) return `${n} ${forms.few}`
  return `${n} ${forms.many}`
}

export const days = (n: number) => arabicCount(n, { one: 'يوم واحد', two: 'يومين', few: 'أيام', many: 'يوم' })
export const weeks = (n: number) => arabicCount(n, { one: 'أسبوع', two: 'أسبوعين', few: 'أسابيع', many: 'أسبوع' })
export const pages = (n: number) => arabicCount(n, { one: 'صفحة واحدة', two: 'صفحتين', few: 'صفحات', many: 'صفحة' })

/** Up to two weeks in days, then rounded weeks («حوالي 8 أسابيع»). */
export function duration(totalDays: number): string {
  return totalDays < 14 ? days(totalDays) : `حوالي ${weeks(Math.round(totalDays / 7))}`
}
