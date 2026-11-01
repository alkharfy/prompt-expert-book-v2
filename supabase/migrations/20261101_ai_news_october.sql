-- «أخبار AI» (/ai-updates): news from 24 Sep to 1 Nov 2026, checked against each company's own page
-- (Google blog and Gemini release notes, OpenAI, Anthropic newsroom; the free-Gemini change quotes Google via 9to5Google).
-- Safe to run twice: a title that already exists is skipped.

insert into ai_changelog (title_ar, content_ar, category, importance, source_url, published_at, is_active)
select v.title_ar, v.content_ar, v.category, v.importance, v.source_url, v.published_at::date, true
from (values
  ($t$Gemini 4 Carbon — أقوى موديل من جوجل لحد دلوقتي$t$,
   $c$جوجل أعلنت Gemini 4 Carbon، وقالت إنه أقوى موديلاتها، وأشطر حاجة فيه الأمن السيبراني والشغلانات الطويلة. لسه مش متاح للناس: البداية مع فرق الأمن السيبراني، ومفيش ميعاد لسه لتطبيق Gemini. يعني مش هيغيّر حاجة في شغلك النهارده.$c$,
   'new_model', 'normal',
   'https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-carbon/', '2026-10-28'),

  ($t$GPT-6.1 Terra — بيستخدم البرامج بدالك (للمدفوع بس)$t$,
   $c$OpenAI أطلقت GPT-6.1 Terra، موديل بيتحكم في الكمبيوتر ويستخدم البرامج بدالك. متاح في الباقات المدفوعة، ومش في ChatGPT المجاني. وقبل ما تدّي أي أداة صلاحية على ملفاتك وبرامجك، راجع المستوى 4 «بيشتغل معاك».$c$,
   'new_model', 'normal',
   'https://openai.com/news/product-releases/', '2026-10-26'),

  ($t$Gemini 4 Argon في تطبيق Gemini — للمشتركين بس$t$,
   $c$جوجل نزّلت Gemini 4 Argon في تطبيق Gemini، للشغلانات اللي فيها كذا خطوة، زي تحليل تقرير مالي. متاح لمشتركي Google AI Pro و Ultra بس. لو بتستخدم Gemini ببلاش، مش هتلاقيه.$c$,
   'new_model', 'normal',
   'https://gemini.google/release-notes/', '2026-10-13'),

  ($t$Gemini المجاني: مبقاش ينفع تختار الموديل$t$,
   $c$من 9 أكتوبر، اللي بيستخدم Gemini من غير اشتراك مبقاش بيختار الموديل بنفسه: فيه اختيار واحد بس «Auto». وجوجل بتقول إن أغلب الطلبات بتروح لـ Flash-Lite، أسرع موديل عندها، والطلبات اللي محتاجة تفكير أكتر ممكن تروح لـ Flash أو Pro. لو الرد طلع عام، وضّح طلبك أكتر (المستوى 1)، أو جرّب نفس الطلب على ChatGPT أو Claude المجانيين.$c$,
   'breaking', 'high',
   'https://9to5google.com/2026/10/09/gemini-auto-free-users/', '2026-10-09'),

  ($t$ChatGPT المجاني بقى على GPT-6 — والرد ممكن يبقى فيه زراير ورسومات$t$,
   $c$OpenAI نزّلت GPT-6 في ChatGPT للكل: المجاني بياخد النسخة الأصغر GPT-6 Luna من 8 أكتوبر، والمدفوع GPT-6 Sol. والجديد «Intelligent UI»: الرد ممكن يجيلك فيه رسم بياني، أو زراير، أو فورم تملاه جوه المحادثة. ونفس القاعدة: الرسم الشيك مش دليل إن الأرقام صح، راجعها.$c$,
   'update', 'high',
   'https://openai.com/index/gpt-6-for-everyone/', '2026-10-07'),

  ($t$Claude Haiku 5.5 — أسرع موديل صغير من Anthropic$t$,
   $c$Anthropic أطلقت Claude Haiku 5.5، أسرع موديل صغير عندها، معمول للشغل الكتير والسريع زي التلخيص. بيفرق أكتر مع الشركات اللي بتبني على الـ API.$c$,
   'new_model', 'normal',
   'https://www.anthropic.com/news', '2026-10-07'),

  ($t$Gemini: الـ Skills بتاخد مكان الـ Gems$t$,
   $c$جوجل بدأت تنزّل «Skills» في Gemini: تعليمات محفوظة لشغلانة بتتكرر، وتستخدمها في أي محادثة. وهتاخد مكان الـ Gems، واللي عندك منها هيتنقل لوحده. ده نفس اللي بتعمله في المستوى 3 والمستوى 5.$c$,
   'update', 'normal',
   'https://gemini.google/release-notes/', '2026-09-30'),

  ($t$Claude Sonnet 5.5 — أسرع وأرخص$t$,
   $c$Anthropic أطلقت Claude Sonnet 5.5، أسرع وأرخص من Sonnet 5.$c$,
   'new_model', 'normal',
   'https://www.anthropic.com/news', '2026-09-28')
) as v(title_ar, content_ar, category, importance, source_url, published_at)
where not exists (select 1 from ai_changelog existing where existing.title_ar = v.title_ar);

-- The Sora entry still sent readers to «الوحدة 6» of the old book (removed 2026-11-01).
update ai_changelog
set content_ar = replace(content_ar, 'ومبادئ برومبت الفيديو في الوحدة 6 تنطبق عليها كلها.', 'ولو عايز تعمل فيديو ببلاش، جرّب ورشة الفيديو على Google Flow.')
where content_ar like '%الوحدة 6%';
