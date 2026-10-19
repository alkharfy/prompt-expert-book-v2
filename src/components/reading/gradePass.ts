/**
 * «المستر بيصحّح» as a gate (owner decision 2026-10-19): in a lesson, what comes after the exercise opens once the
 * learner's own prompt passes — or once they tick the self-check when the grader can't answer or keeps disagreeing.
 * Remembered per browser so a passed exercise stays open on a later visit.
 */
const key = (rubricId: string) => `grade-pass:${rubricId}`

export function hasPassedGrade(rubricId: string): boolean {
    try {
        return localStorage.getItem(key(rubricId)) === '1'
    } catch {
        return false
    }
}

export function markGradePassed(rubricId: string) {
    try {
        localStorage.setItem(key(rubricId), '1')
    } catch {
        // Private mode: the gate still opens for this visit through the page state.
    }
}
