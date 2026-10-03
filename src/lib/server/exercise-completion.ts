import 'server-only'
import { allExercises } from '@/data/exercisesData'
import { hospitalChallenges } from '@/data/hospitalChallengesData'
import { runningProjects, type ProjectPhase } from '@/data/runningProjectData'
import { hasMeaningfulFieldValue, isSubstantivePrompt, scorePrompt } from '@/lib/exerciseScoring'
import { renderPromptTemplate } from '@/lib/prompt-template'
import { userHasFeature } from '@/lib/subscription'
import { updateMissionProgress } from '@/lib/missions'
import { dbLogger } from '@/lib/logger'

type CompletionDb = { from: (table: string) => any; rpc: (...args: any[]) => any }
type AnswerObject = Record<string, unknown>
interface ValidatedExercise {
    exercise_id: string
    exercise_type: 'quiz' | 'fill_blank' | 'prompt_builder'
    section_id: string
    user_answer: string
    is_correct: boolean | null
    points_earned: number
    requiredFeature: 'exercises' | 'tools'
}
type Validation = { ok: true; exercise: ValidatedExercise } | { ok: false; error: string }

const exercises = new Map(Object.values(allExercises).flat().map(exercise => [exercise.exerciseId, exercise]))
const challenges = new Map(hospitalChallenges.map(challenge => [challenge.exerciseId, challenge]))
const phases = new Map<string, ProjectPhase>(runningProjects.flatMap(project => project.phases.map((phase, index) =>
    [`running-project-${project.id}-phase-${index}`, phase] as const)))

function parseObject(value: string): AnswerObject | null {
    try {
        const parsed: unknown = JSON.parse(value)
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as AnswerObject : null
    } catch { return null }
}
const normalized = (value: string) => value.trim().toLowerCase()
const invalid = (): Validation => ({ ok: false, error: 'بيانات التدريب أو إجابته غير صالحة' })

/** Scores known submissions only. Browser points, correctness and timestamps have no authority. */
export function validateExerciseSubmission(input: unknown): Validation {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return invalid()
    const payload = input as AnswerObject
    if (typeof payload.exercise_id !== 'string' || typeof payload.user_answer !== 'string'
        || payload.user_answer.length > 20000) return invalid()
    const id = payload.exercise_id
    const exercise = exercises.get(id)
    let result: ValidatedExercise
    if (exercise) {
        result = {
            exercise_id: id, exercise_type: exercise.type, section_id: exercise.sectionId,
            user_answer: payload.user_answer, is_correct: null, points_earned: 0,
            requiredFeature: 'exercises',
        }
        if (exercise.type === 'quiz') {
            if (!exercise.options.some(option => option.id === payload.user_answer)) return invalid()
            result.is_correct = payload.user_answer === exercise.correctAnswerId
            result.points_earned = result.is_correct ? exercise.points : 0
        } else {
            const answer = parseObject(payload.user_answer)
            if (!answer) return invalid()
            if (exercise.type === 'fill_blank') {
                if (exercise.blanks.some(blank => typeof answer[blank.id] !== 'string')) return invalid()
                const correct = exercise.blanks.filter(blank => {
                    const submitted = normalized(answer[blank.id] as string)
                    return [blank.correctAnswer, ...(blank.alternatives || [])].some(value => normalized(value) === submitted)
                }).length
                result.is_correct = correct === exercise.blanks.length
                result.points_earned = result.is_correct ? exercise.points : Math.floor(correct / exercise.blanks.length * exercise.points * 0.5)
                result.user_answer = JSON.stringify(Object.fromEntries(exercise.blanks.map(blank => [blank.id, answer[blank.id]])))
            } else {
                const values = Object.fromEntries(exercise.steps.map(step => [step.id, typeof answer[step.id] === 'string' ? answer[step.id] as string : '']))
                if (exercise.steps.some(step => step.required !== false && !hasMeaningfulFieldValue(values[step.id]))
                    || !isSubstantivePrompt(renderPromptTemplate(exercise.templateFormat, values), 60)
                    || typeof answer.__practiceOutput !== 'string' || answer.__practiceOutput.trim().length < 20
                    || answer.__selfReviewed !== 'true') return invalid()
                result.points_earned = exercise.points
                result.user_answer = JSON.stringify({ ...values, __practiceOutput: answer.__practiceOutput.trim(), __selfReviewed: 'true' })
            }
        }
    } else {
        const answer = parseObject(payload.user_answer)
        if (!answer || typeof answer.prompt !== 'string') return invalid()
        const challenge = challenges.get(id)
        const phase = phases.get(id)
        if (!challenge && !phase) return invalid()
        const scored = scorePrompt(answer.prompt, (challenge || phase)!.scoringCriteria, (challenge || phase)!.points, phase ? 100 : 80, phase ? 60 : 70)
        if (!isSubstantivePrompt(answer.prompt, phase ? 100 : 80) || scored.pointsEarned === 0) return invalid()
        const reviewedCriteria = Array.isArray(answer.reviewedCriteria) ? answer.reviewedCriteria : []
        if (phase && (answer.completionVersion !== 2 || typeof answer.trialOutput !== 'string' || answer.trialOutput.trim().length < 20
            || typeof answer.reviewNotes !== 'string' || answer.reviewNotes.trim().length < 10
            || !Array.isArray(answer.reviewedCriteria) || phase.scoringCriteria.some(criterion => !reviewedCriteria.includes(criterion.id)))) return invalid()
        result = {
            exercise_id: id, exercise_type: 'prompt_builder', section_id: phase ? 'running-project' : 'hospital-challenges',
            user_answer: JSON.stringify(phase ? { prompt: answer.prompt, trialOutput: (answer.trialOutput as string).trim(),
                reviewedCriteria: phase.scoringCriteria.map(criterion => criterion.id), reviewNotes: (answer.reviewNotes as string).trim(),
                structureScore: scored.score, assessment: 'self-reviewed-trial', completionVersion: 2 }
                : { prompt: answer.prompt, structureScore: scored.score, assessment: 'structure-only-participation' }),
            is_correct: null, points_earned: (challenge || phase)!.points, requiredFeature: 'tools',
        }
    }
    if ((payload.exercise_type !== undefined && payload.exercise_type !== result.exercise_type)
        || (payload.section_id !== undefined && payload.section_id !== result.section_id)) return invalid()
    return { ok: true, exercise: result }
}

/** The unique user/exercise insert is the award boundary; retries never re-award. */
export async function recordExerciseCompletion(userId: string, payload: unknown, operation: 'insert' | 'upsert', db: CompletionDb) {
    const validated = validateExerciseSubmission(payload)
    if (!validated.ok) return { status: 400, body: { ok: false, error: validated.error } }
    const { requiredFeature, ...exercise } = validated.exercise
    if (requiredFeature && !await userHasFeature(userId, requiredFeature)) {
        return { status: 403, body: { ok: false, error: 'يلزم اشتراك نشط يشمل هذا التدريب' } }
    }
    const duplicate = (data: unknown = null) => operation === 'insert'
        ? { status: 409, body: { ok: false, error: 'تم تسجيل هذا التدريب مسبقًا', errorCode: '23505', data } }
        : { status: 200, body: { ok: true, data, alreadyCompleted: true } }
    // The migration is required: no partial insert/award fallback is safe.
    let result: { data: any; error: any }
    try { result = await db.rpc('complete_learning_exercise', { p_user_id: userId, p_exercise: exercise }) }
    catch { return { status: 503, body: { ok: false, error: 'تعذّر حفظ التدريب والنقاط معًا؛ حاول لاحقًا' } } }
    if (result.error || result.data?.record?.is_completed !== true || typeof result.data.alreadyCompleted !== 'boolean') return {
        status: 503, body: { ok: false, error: 'تعذّر حفظ التدريب والنقاط معًا؛ حاول لاحقًا' },
    }
    if (result.data.alreadyCompleted) return duplicate(result.data.record)
    // Mission notifications follow the committed exercise transaction. A
    // secondary mission failure must not report a successfully saved exercise as failed.
    try {
        await updateMissionProgress(userId, 'complete_exercise')
        if (exercise.exercise_type === 'quiz' && exercise.is_correct === true) await updateMissionProgress(userId, 'perfect_score')
    } catch (error) { dbLogger.error('Exercise mission notification failed', error) }
    return { status: 200, body: { ok: true, data: result.data.record } }
}
