// Onboarding v2 personalisation of reading-page blocks — no new lesson content:
// * the intro p1 «جرّبها بنفسك» card becomes a live try of the SAME request the
//   reader checked on the onboarding result screen (their profession);
// * '⚡ للمتمرسين' cards collapse to one tappable line for first-time AI users.
// Readers with no answers (guests, legacy accounts) get the page unchanged.

import type { PageContent } from '@/types/book'
import { asRolePhrase, getProfessionTry } from '@/data/professionTries'
import type { AiLevelId, ProfessionId } from '@/types/learning'

export type ContentBlock = PageContent['contentBlocks'][number]

export function personalizeBlocks(
  blocks: ContentBlock[],
  reader: { profession: ProfessionId | null; aiLevel: AiLevelId | null },
): ContentBlock[] {
  if (!reader.profession && reader.aiLevel !== 'new') return blocks
  const result: ContentBlock[] = []
  for (const block of blocks) {
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
