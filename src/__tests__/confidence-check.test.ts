import { describe, expect, it } from 'vitest'
import { confidenceMessage } from '@/components/reading/ConfidenceCheck'
import { introData } from '@/data/introData'

describe('confidence check on intro page 3', () => {
  it('answers every pick with a message that matches how sure the reader was', () => {
    expect(confidenceMessage(100)).toContain('كنت هتبعته')
    expect(confidenceMessage(75)).toContain('75٪')
    expect(confidenceMessage(50)).toContain('نص نص')
    expect(confidenceMessage(0)).toContain('عندك حق تشك')
  })

  it('has one check per track, each saying exactly where the mistake is', () => {
    const checks = introData[2].contentBlocks.filter(block => block.type === 'confidence')
    expect(checks.map(check => check.track)).toEqual(['accounting', 'service'])
    expect(checks[0].answer).toContain('14٪')
    expect(checks[1].answer).toContain('14 يوم')
  })
})

describe('confidence check on a sound reply', () => {
  it('does not praise doubt when the reply was actually correct', () => {
    expect(confidenceMessage(0, true)).toContain('شكّيت في رد سليم')
    expect(confidenceMessage(100, true)).toContain('سليم')
  })
})
