import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { allExercises, type ExerciseData } from '@/data/exercisesData'
import { hospitalChallenges } from '@/data/hospitalChallengesData'
import { runningProjects } from '@/data/runningProjectData'

const h = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), feature: vi.fn(), mission: vi.fn(), user: 'u1' as string | null }))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/subscription', () => ({ userHasFeature: h.feature }))
vi.mock('@/lib/missions', () => ({ updateMissionProgress: h.mission }))
vi.mock('@/lib/logger', () => ({ dbLogger: { error: vi.fn() } }))
vi.mock('@/lib/auth-middleware', () => ({ getAuthenticatedUser: async () => h.user }))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: (name: string) => h.user
    ? { value: name === 'ebook_user_id' ? h.user : 'session' } : undefined }) }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: () => ({ allowed: true }) }))
vi.mock('@/lib/supabase-admin', () => ({ getSupabaseAdmin: () => ({ rpc: h.rpc, from: h.from }) }))
import { validateExerciseSubmission, recordExerciseCompletion } from '@/lib/server/exercise-completion'
import { POST as proxy } from '@/app/api/auth/db-operation/route'
import { POST as claim, PUT as bulkClaim } from '@/app/api/achievements/claimed/route'
import { getReadingReward } from '@/lib/server/reading-rewards'

const catalog = Object.values(allExercises).flat()
const quiz = catalog.find(ex => ex.type === 'quiz') as Extract<ExerciseData, { type: 'quiz' }>
const blank = catalog.find(ex => ex.type === 'fill_blank') as Extract<ExerciseData, { type: 'fill_blank' }>
const builder = catalog.find(ex => ex.type === 'prompt_builder') as Extract<ExerciseData, { type: 'prompt_builder' }>
const fieldValue = 'حلل بيانات العملاء لمتجر إلكتروني محلي وحدد ثلاثة أسباب لتراجع المبيعات ثم اكتب خطة تحسين في جدول مع مراجعة دقة النتائج'
const output = 'هذه تجربة فعلية مرفقة بناتج نصي يحتاج مراجعة وتحسينًا في الجولة التالية.'
const payload = (exercise: ExerciseData) => ({
    exercise_id: exercise.exerciseId, exercise_type: exercise.type, section_id: exercise.sectionId,
    user_answer: exercise.type === 'quiz' ? exercise.correctAnswerId : exercise.type === 'fill_blank'
        ? JSON.stringify(Object.fromEntries(exercise.blanks.map(item => [item.id, ` ${item.correctAnswer.toUpperCase()} `])))
        : JSON.stringify({ ...Object.fromEntries(exercise.steps.map(step => [step.id, fieldValue])), __practiceOutput: output, __selfReviewed: 'true' }),
    points_earned: 999999, is_correct: true, user_id: 'other-user', completed_at: '2000-01-01',
})
const db = { rpc: h.rpc, from: h.from }
const request = (body: unknown) => new NextRequest('http://localhost/api/auth/db-operation', { method: 'POST', body: JSON.stringify(body) })

beforeEach(() => {
    vi.clearAllMocks(); h.user = 'u1'; h.feature.mockResolvedValue(true); h.mission.mockResolvedValue({})
    h.rpc.mockImplementation(async (name: string, args: any) => ({ data: name === 'claim_learning_reward'
        ? { alreadyClaimed: false, pointsEarned: args.p_points }
        : { alreadyCompleted: false, record: { id: 'record-1', user_id: args.p_user_id, ...args.p_exercise, is_completed: true } }, error: null }))
    h.from.mockImplementation((table: string) => {
        const chain: any = {}; chain.select = chain.eq = chain.gt = () => chain
        chain.maybeSingle = async () => ({ data: table === 'sessions' ? { id: 's' } : null, error: null })
        return chain
    })
})

describe('trusted exercise grading and one atomic award', () => {
    it('accepts all 45 known lesson IDs with their canonical answer shapes and limits', () => {
        expect(catalog).toHaveLength(45)
        for (const exercise of catalog) {
            const result = validateExerciseSubmission(payload(exercise))
            expect(result.ok, exercise.exerciseId).toBe(true)
            if (result.ok) {
                expect(result.exercise.points_earned).toBe(exercise.points)
                expect(result.exercise.is_correct).toBe(exercise.type === 'prompt_builder' ? null : true)
                expect(result.exercise.requiredFeature).toBe('exercises')
            }
        }
    })
    it('ignores forged correctness and unlimited points for an incorrect quiz answer', async () => {
        const submitted = { ...payload(quiz), user_answer: quiz.options.find(option => option.id !== quiz.correctAnswerId)!.id }
        const result = await recordExerciseCompletion('u1', submitted, 'upsert', db)
        expect(result.status).toBe(200)
        const args = h.rpc.mock.calls[0][1]
        expect(args.p_user_id).toBe('u1')
        expect(args.p_exercise).toMatchObject({ points_earned: 0, is_correct: false })
        expect(args.p_exercise).not.toHaveProperty('user_id'); expect(args.p_exercise).not.toHaveProperty('completed_at')
        expect(h.mission).toHaveBeenCalledWith('u1', 'complete_exercise')
        expect(h.mission).not.toHaveBeenCalledWith('u1', 'perfect_score')
        expect(h.from).not.toHaveBeenCalled()
    })
    it('normalizes fill answers and awards a bounded partial score rather than trusting the browser', () => {
        const answers = Object.fromEntries(blank.blanks.map((item, index) => [item.id, index === 0 ? ` ${item.correctAnswer.toUpperCase()} ` : 'إجابة خاطئة']))
        const result = validateExerciseSubmission({ ...payload(blank), user_answer: JSON.stringify(answers) })
        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.exercise.is_correct).toBe(false)
            expect(result.exercise.points_earned).toBe(Math.floor(blank.points / blank.blanks.length * 0.5))
        }
    })
    it.each([null, [], { exercise_id: 'invented', user_answer: 'a' },
        { ...payload(quiz), section_id: 'section-99' }, { ...payload(quiz), exercise_type: 'prompt_builder' },
        { ...payload(builder), user_answer: JSON.stringify({ __practiceOutput: output, __selfReviewed: 'true' }) },
        { ...payload(builder), user_answer: JSON.stringify({ ...Object.fromEntries(builder.steps.map(step => [step.id, fieldValue])), __practiceOutput: output }) }
    ])('rejects invalid or incomplete submitted work (%j)', async submitted => {
        expect((await recordExerciseCompletion('u1', submitted, 'insert', db)).status).toBe(400)
        expect(h.rpc).not.toHaveBeenCalled()
    })
    it('requires the exercises entitlement even for a chapter-one graded exercise', async () => {
        h.feature.mockResolvedValue(false)
        expect((await recordExerciseCompletion('u1', payload(quiz), 'upsert', db)).status).toBe(403)
        expect(h.feature).toHaveBeenCalledWith('u1', 'exercises'); expect(h.rpc).not.toHaveBeenCalled()
    })
    it.each(['insert', 'upsert'] as const)('does not re-award or re-notify for duplicate %s', async operation => {
        h.rpc.mockResolvedValue({ data: { alreadyCompleted: true, record: { id: 'old-record', is_completed: true } }, error: null })
        const result = await recordExerciseCompletion('u1', payload(quiz), operation, db)
        expect(result.status).toBe(operation === 'insert' ? 409 : 200)
        if (operation === 'insert') expect(result.body).toMatchObject({ errorCode: '23505' })
        expect(h.mission).not.toHaveBeenCalled(); expect(h.from).not.toHaveBeenCalled()
    })
    it('fails clearly when the transaction RPC is missing, with no partial write fallback', async () => {
        h.rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'private database details' } })
        const result = await recordExerciseCompletion('u1', payload(quiz), 'upsert', db)
        expect(result.status).toBe(503); expect(JSON.stringify(result)).not.toContain('private database details')
        expect(h.from).not.toHaveBeenCalled(); expect(h.mission).not.toHaveBeenCalled()
    })
    it('keeps a committed completion successful if a mission notification fails', async () => {
        h.mission.mockRejectedValue(new Error('secondary failure'))
        expect((await recordExerciseCompletion('u1', payload(quiz), 'upsert', db)).status).toBe(200)
    })
    it('accepts reviewed projects but never treats their self-assessment as correctness', async () => {
        const project = runningProjects[0], phase = project.phases[0]
        const submitted = { exercise_id: `running-project-${project.id}-phase-0`, exercise_type: 'prompt_builder', section_id: 'running-project',
            user_answer: JSON.stringify({ prompt: phase.idealPrompt, trialOutput: output, reviewNotes: 'راجعت معايير الناتج وأحتاج تحسين التفاصيل.',
                reviewedCriteria: phase.scoringCriteria.map(c => c.id), completionVersion: 2, structureScore: 100 }), points_earned: 999999, is_correct: true }
        expect((await recordExerciseCompletion('u1', submitted, 'insert', db)).status).toBe(200)
        expect(h.feature).toHaveBeenCalledWith('u1', 'tools')
        expect(h.rpc.mock.calls[0][1].p_exercise).toMatchObject({ points_earned: phase.points, is_correct: null })
        expect(h.mission).not.toHaveBeenCalledWith('u1', 'perfect_score')
        expect(validateExerciseSubmission({ ...submitted, user_answer: JSON.stringify({ prompt: phase.idealPrompt, completionVersion: 2 }) }).ok).toBe(false)
    })
    it('rechecks a hospital challenge instead of trusting a forged score', () => {
        const challenge = hospitalChallenges[0]
        expect(validateExerciseSubmission({ exercise_id: challenge.exerciseId, user_answer: JSON.stringify({ prompt: 'أنت جدول 100', structureScore: 100 }) }).ok).toBe(false)
        const valid = validateExerciseSubmission({ exercise_id: challenge.exerciseId, user_answer: JSON.stringify({ prompt: challenge.idealPrompt, structureScore: 0 }) })
        expect(valid.ok).toBe(true)
        if (valid.ok) expect(valid.exercise).toMatchObject({ is_correct: null, points_earned: challenge.points, requiredFeature: 'tools' })
    })
    it('accepts the displayed reference prompts for all projects and hospital challenges', () => {
        const failures: string[] = []
        for (const project of runningProjects) for (const [index, phase] of project.phases.entries()) {
            const result = validateExerciseSubmission({ exercise_id: `running-project-${project.id}-phase-${index}`,
                user_answer: JSON.stringify({ prompt: phase.idealPrompt, trialOutput: output,
                    reviewNotes: 'راجعت المعايير والناتج وأحتاج تحسين التفاصيل.', reviewedCriteria: phase.scoringCriteria.map(c => c.id), completionVersion: 2 }) })
            if (!result.ok) failures.push(`${project.id}/${index}`)
        }
        for (const challenge of hospitalChallenges) {
            if (!validateExerciseSubmission({ exercise_id: challenge.exerciseId,
                user_answer: JSON.stringify({ prompt: challenge.idealPrompt }) }).ok) failures.push(challenge.exerciseId)
        }
        expect(failures).toEqual([])
    })
})

describe('the proxy exposes no raw award operations', () => {
    it.each(['user_gamification', 'user_exercise_stats', 'points_history'].flatMap(table =>
        ['insert', 'update', 'upsert'].map(operation => ({ table, operation }))))('denies $operation on $table', async input => {
        expect((await proxy(request({ ...input, data: { total_points: 999999, points: 999999 } }))).status).toBe(403)
        expect(h.rpc).not.toHaveBeenCalled()
    })
    it.each(['update', 'delete'])('prevents %s from reopening an exercise for another award', async operation => {
        expect((await proxy(request({ operation, table: 'exercise_progress', data: { is_completed: false } }))).status).toBe(403)
    })
    it.each(['update_gamification_atomic', 'update_exercise_stats_atomic', 'complete_learning_exercise', 'claim_learning_reward'])('denies direct browser RPC %s', async rpcName => {
        expect((await proxy(request({ operation: 'rpc', rpcName, rpcParams: { p_points_earned: 999999 } }))).status).toBe(403)
        expect(h.rpc).not.toHaveBeenCalled()
    })
    it('routes the legacy exercise upsert into the validated transaction', async () => {
        expect((await proxy(request({ operation: 'upsert', table: 'exercise_progress', data: payload(quiz), onConflict: 'id' }))).status).toBe(200)
        expect(h.rpc).toHaveBeenCalledWith('complete_learning_exercise', expect.objectContaining({ p_user_id: 'u1' }))
    })
})

describe('metadata-only reading reward claims', () => {
    it('uses the published reward amount and current user in the atomic claim', async () => {
        const res = await claim(request({ rewardId: 'intro_complete', points: 999999, userId: 'other' }))
        expect(res.status).toBe(200)
        expect(h.rpc).toHaveBeenCalledWith('claim_learning_reward', { p_user_id: 'u1', p_reward_id: 'intro_complete', p_points: getReadingReward('intro_complete')!.points })
        expect(h.from).not.toHaveBeenCalled()
    })
    it('rejects invented rewards and paid chapter claims without entitlement', async () => {
        expect((await claim(request({ rewardId: 'invented' }))).status).toBe(400)
        h.feature.mockResolvedValue(false)
        expect((await claim(request({ rewardId: 'unit2_complete' }))).status).toBe(403)
        expect(h.rpc).not.toHaveBeenCalled()
    })
    it('returns an existing claim without a second award', async () => {
        h.rpc.mockResolvedValue({ data: { alreadyClaimed: true, pointsEarned: 0 }, error: null })
        expect(await (await claim(request({ rewardId: 'intro_complete' }))).json()).toMatchObject({ success: true, alreadyClaimed: true, pointsEarned: 0 })
    })
    it('fails visibly if the claim transaction cannot commit', async () => {
        h.rpc.mockResolvedValue({ data: null, error: { message: 'private details' } })
        const res = await claim(request({ rewardId: 'intro_complete' }))
        expect(res.status).toBe(503); expect(await res.json()).toEqual({ error: 'تعذّر حفظ المكافأة والنقاط معًا؛ حاول لاحقًا' })
        expect(h.from).not.toHaveBeenCalled()
    })
    it('does not import arbitrary browser-local claims or allow unauthenticated awards', async () => {
        expect((await bulkClaim()).status).toBe(403)
        h.user = null
        expect((await claim(request({ rewardId: 'intro_complete' }))).status).toBe(401)
        expect(h.rpc).not.toHaveBeenCalled()
    })
})
