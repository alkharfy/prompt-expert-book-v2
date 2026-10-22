// Onboarding v2 personalisation of reading-page blocks:
// * blocks tagged with a track show only to that track (Mona's customer-service version or Ahmed's accounting one);
// * the intro p1 «جرّبها بنفسك» card becomes a live try of the SAME request the
//   reader checked on the onboarding result screen (their profession);
// * '⚡ للمتمرسين' cards collapse to one tappable line for first-time AI users.
// Readers with no answers (guests, legacy accounts) get the page unchanged.

import type { PageContent } from '@/types/book'
import { asRolePhrase, getProfessionTry } from '@/data/professionTries'
import type { AiLevelId, ProfessionId } from '@/types/learning'

export type ContentBlock = PageContent['contentBlocks'][number]
export type ReaderTrack = 'accounting' | 'service'

/**
 * Whose story the levels follow. Jobs that live on messages from people (customers, staff, parents, users)
 * get Mona; numbers and everyone unknown get Ahmed. The reader can switch on the page (TrackSwitch):
 * owner 2026-10-22, a programmer's new account still read only accounting.
 */
const SERVICE_PROFESSIONS: ProfessionId[] = ['sales_service', 'marketing_business', 'hr_admin', 'teacher', 'programmer']

export function readerTrack(profession: ProfessionId | null): ReaderTrack {
  return profession && SERVICE_PROFESSIONS.includes(profession) ? 'service' : 'accounting'
}

export function personalizeBlocks(
  blocks: ContentBlock[],
  reader: { profession: ProfessionId | null; aiLevel: AiLevelId | null; track?: ReaderTrack | null },
): ContentBlock[] {
  const track = reader.track ?? readerTrack(reader.profession)
  const onTrack = blocks.some(block => block.track)
    ? blocks.filter(block => !block.track || block.track === track)
    : blocks
  if (!reader.profession && reader.aiLevel !== 'new') return onTrack
  const result: ContentBlock[] = []
  for (const block of onTrack) {
    if (block.personalize === 'profession-try' && reader.profession) {
      const item = getProfessionTry(reader.profession)
      result.push({
        type: 'code',
        personalize: 'profession-try',
        title: item.id === 'other' ? '👉 جرّبها على مثال من حياتك' : `👉 جرّبها على شغلك ${asRolePhrase(item)}`,
        content: '',
        code: item.request,
      })
      result.push({
        type: 'card',
        title: '🔎 وبعدين راجع',
        content:
          '1. افتح chatgpt.com أو gemini.google.com — النسخة المجانية تكفي.\n' +
          '2. انسخ الطلب اللي فوق وجرّبه زي ما هو.\n' +
          `3. ${item.reviewTip}\n\n` +
          'استخدم أرقام تجريبية زي دي — متحطش بيانات عميل ولا أي حاجة سرية.\n\n' +
          'كده انت عملت أهم حاجتين في الكتاب كله: طلب واضح، ومراجعة.',
      })
      continue
    }
    if (block.audience === 'advanced' && reader.aiLevel === 'new') {
      result.push({ ...block, collapsed: true })
      continue
    }
    result.push(block)
  }
  return result
}
