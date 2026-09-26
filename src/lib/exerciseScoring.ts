// =====================================================
// نظام تقييم التمارين المشترك
// Shared Exercise Scoring Engine
// =====================================================

export interface ScoringCriterion {
    id: string
    name: string
    weight: number
    check: 'contains_role' | 'has_context' | 'has_specificity' | 'has_constraints' | 'has_format' | 'has_examples' | 'has_steps' | 'minimum_length'
    description: string
}

// أنماط الكشف الموحدة (تجمع أنماط Hospital + Running Project)
export const checkPatterns = {
    contains_role: /أنت|تصرف|كـ|بصفتك|بصفت|you are|act as|as a|متخصص|خبير|مدير|مسؤول|مهندس|مصمم|محلل/i,
    has_context: /السياق|الخلفية|context|background|يستهدف|الجمهور|الفئة|العمر|السوق|المنافس|الميزانية|الفريق|المستخدم/i,
    has_specificity: /تحديد|بالتحديد|specific|specifically|محدد|\d+|أريد|المطلوب|بالضبط|النتيجة|الهدف/i,
    has_constraints: /لا تـ|تجنب|يجب|حد أقصى|كحد|don't|avoid|must|maximum|الطول|كلمة|بدون|ممنوع/i,
    has_format: /تنسيق|شكل|قائمة|نقاط|جدول|format|list|bullet|عناوين|ترقيم|JSON|markdown|جدول/i,
    has_examples: /مثال|أمثلة|example|for instance|نموذج|مثل:|كمثال/i,
    has_steps: /خطوة|خطوات|step|steps|أولاً|ثانياً|ثالثاً|\d\.|1\.|2\.|3\.|المرحلة/i,
    minimum_length: null as unknown as RegExp, // handled separately
}

/**
 * تقييم معيار واحد ضد برومبت المستخدم
 */
export function evaluateCriterion(userPrompt: string, criterion: ScoringCriterion, minLength: number = 80): boolean {
    if (criterion.check === 'minimum_length') {
        return userPrompt.length >= minLength
    }
    const pattern = checkPatterns[criterion.check]
    if (!pattern) return false
    return pattern.test(userPrompt)
}

/**
 * تقييم كامل لبرومبت المستخدم مقابل مجموعة معايير
 * يرجع النسبة (0-100) والنقاط المكتسبة
 */
export function scorePrompt(
    userPrompt: string,
    criteria: ScoringCriterion[],
    maxPoints: number,
    minLength: number = 80,
    passThreshold: number = 70
): { score: number; pointsEarned: number; passedCriteria: string[] } {
    let totalWeight = 0
    let earnedWeight = 0
    const passedCriteria: string[] = []

    for (const criterion of criteria) {
        totalWeight += criterion.weight
        if (evaluateCriterion(userPrompt, criterion, minLength)) {
            earnedWeight += criterion.weight
            passedCriteria.push(criterion.id)
        }
    }

    const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0
    const pointsEarned = score >= passThreshold ? maxPoints : Math.round(maxPoints * 0.5)

    return { score, pointsEarned, passedCriteria }
}
