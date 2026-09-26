import { readdirSync, readFileSync, statSync } from 'fs'
import { join, resolve } from 'path'

// Fail the build if any fabricated marketing stat sneaks into the landing copy.
// Honest copy only — no invented counts, ratings, percentages or testimonials.
const LANDING_DIR = resolve(process.cwd(), 'src/components/landing')
// Match fabricated-stat SIGNATURES (with context), not bare numbers — so CSS
// font-weight:500, scrollY>500, SVG path digits, etc. are NOT false-positives.
const FORBIDDEN = /500\s?\+|\+\s?500|متعلم سعيد|يوصون به|4\.9\s*\/\s*5|4\.9\s*من\s*5|★\s*4\.9|أحمد\s+م\.|سارة\s+أ\.|محمد\s+ع\.|خالد\s+ب\.|\b(?:3420|2890|2650|2480|2100)\b/

function walk(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...walk(full))
    } else {
      files.push(full)
    }
  }
  return files
}

let failed = false
for (const file of walk(LANDING_DIR)) {
  const content = readFileSync(file, 'utf8')
  const match = content.match(FORBIDDEN)
  if (match) {
    failed = true
    console.error(`Fabricated stat found in ${file}: "${match[0]}"`)
  }
}

if (failed) {
  process.exit(1)
}

console.log('OK: no fabricated stats')
process.exit(0)
