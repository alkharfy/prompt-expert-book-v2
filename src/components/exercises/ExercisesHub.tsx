'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { authSystem } from '@/lib/auth_system'
import { useLearning } from '@/context/LearningContext'
import { readerTrack, type ReaderTrack } from '@/lib/personalizeBlocks'
import { hasPassedGrade } from '@/components/reading/gradePass'
import { arabicCount } from '@/components/onboarding/arabicCounts'
import { lessonsWord } from '@/lib/tocProgress'
import type { ExerciseKind, LevelPractice } from '@/lib/server/course-exercises'

const KIND: Record<ExerciseKind, { icon: string; label: string; note: string }> = {
    grade: { icon: '🧑‍🏫', label: 'المستر بيصحّح', note: 'تلزق طلبك أو ردك، ويقولك عدّى على إيه وناقصه إيه' },
    answer: { icon: '✍️', label: 'اكتب الإجابة', note: 'تحسب أو تعدّ بنفسك من ملف الدرس، قبل ما تصدّق الـ AI' },
    quiz: { icon: '🎯', label: 'اختار الإجابة', note: 'مواقف من الشغل، وتختار تعمل إيه' },
    checklist: { icon: '✅', label: 'قايمة مراجعة', note: 'تعلّم على اللي عملته فعلاً في شغلك' },
}
const ORDER: ExerciseKind[] = ['grade', 'answer', 'quiz', 'checklist']

const exercisesWord = (n: number) => arabicCount(n, { one: 'تمرين واحد', two: 'تمرينين', few: 'تمارين', many: 'تمرين' })

/** Same key as the lessons' Ahmed/Mona switch (SectionPage TRACK_KEY). */
const TRACK_KEY = 'pm_track'

export default function ExercisesHub({ levels }: { levels: LevelPractice[] }) {
    const { preferences } = useLearning()
    const [savedTrack, setSavedTrack] = useState<ReaderTrack | null>(null)
    const [done, setDone] = useState<Set<string> | null>(null)
    const [passed, setPassed] = useState<Set<string>>(new Set())

    useEffect(() => {
        try {
            const saved = localStorage.getItem(TRACK_KEY)
            if (saved === 'accounting' || saved === 'service') setSavedTrack(saved)
        } catch { /* private window: the profession decides */ }
        setPassed(new Set(levels.flatMap(level => level.lessons.flatMap(lesson => lesson.exercises
            .map(exercise => exercise.rubric).filter((rubric): rubric is string => !!rubric && hasPassedGrade(rubric))))))
        if (!authSystem.getCurrentUserId()) return
        authSystem.getDetailedProgress()
            .then(progress => { if (progress?.completedLessons) setDone(new Set(progress.completedLessons)) })
            .catch(() => { /* no ticks, the list still works */ })
    }, [levels])

    // Same rule as the lessons: an onboarding answer decides; the saved switch is only for readers without one.
    const profession = preferences?.profession ?? null
    const track = profession ? readerTrack(profession) : savedTrack ?? readerTrack(null)
    const view = useMemo(() => levels.map(level => {
        const lessons = level.lessons
            .map(lesson => ({ ...lesson, exercises: lesson.exercises.filter(exercise => !exercise.track || exercise.track === track) }))
            .filter(lesson => lesson.exercises.length > 0)
        return {
            ...level,
            lessons,
            total: lessons.reduce((sum, lesson) => sum + lesson.exercises.length, 0),
            lessonsDone: done ? lessons.filter(lesson => done.has(`${level.sectionId}:${lesson.page}`)).length : 0,
        }
    }), [levels, track, done])

    const total = view.reduce((sum, level) => sum + level.total, 0)
    const graded = view.reduce((sum, level) => sum + level.lessons.reduce((n, lesson) => n + lesson.exercises.filter(e => e.kind === 'grade').length, 0), 0)
    const next = done
        ? view.flatMap(level => level.lessons.map(lesson => ({ level, lesson }))).find(({ level, lesson }) => !done.has(`${level.sectionId}:${lesson.page}`))
        : undefined

    return (
        <>
            <p className="xh-summary">{exercisesWord(total)} في الكورس، منهم {graded} «المستر بيصحّح». وكل تمرين بيتحل جوه درسه، على ملفات الدرس وأمثلته.</p>

            {next && (
                <Link className="xh-next" href={`/read/${next.level.sectionId}/${next.lesson.page}`}>
                    <span>كمّل من أول درس لسه مخلّصتوش</span>
                    <b>{next.level.label}: {next.lesson.title}</b>
                </Link>
            )}

            <ul className="xh-legend" aria-label="أنواع التمارين">
                {ORDER.map(kind => (
                    <li key={kind}><span aria-hidden="true">{KIND[kind].icon}</span> <b>{KIND[kind].label}:</b> {KIND[kind].note}</li>
                ))}
            </ul>

            <div className="xh-levels">
                {view.map((level, index) => (
                    <details key={level.sectionId} className="xh-level" open={index === 0 || (!!next && next.level.sectionId === level.sectionId)}>
                        <summary>
                            <span className="xh-level-icon" aria-hidden="true">{level.icon}</span>
                            <span className="xh-level-name">
                                <b>{level.label}: {level.name}</b>
                                <small>
                                    {exercisesWord(level.total)} في {lessonsWord(level.lessons.length)}
                                    {done && ` · خلّصت ${level.lessonsDone} من ${level.lessons.length}`}
                                    {level.free && ' · ببلاش'}
                                </small>
                            </span>
                            <span className="xh-arrow" aria-hidden="true">▾</span>
                        </summary>
                        <ol className="xh-lessons">
                            {level.lessons.map(lesson => {
                                const finished = !!done?.has(`${level.sectionId}:${lesson.page}`)
                                return (
                                    <li key={lesson.page}>
                                        <Link className={`xh-lesson ${finished ? 'done' : ''}`} href={`/read/${level.sectionId}/${lesson.page}`}>
                                            <span className="xh-tick" aria-label={finished ? 'خلّصته' : undefined}>{finished ? '✓' : lesson.page}</span>
                                            <span className="xh-lesson-body">
                                                <b>{lesson.title}</b>
                                                <span className="xh-chips">
                                                    {ORDER.map(kind => {
                                                        const ofKind = lesson.exercises.filter(exercise => exercise.kind === kind)
                                                        if (ofKind.length === 0) return null
                                                        const allPassed = kind === 'grade' && ofKind.every(exercise => exercise.rubric && passed.has(exercise.rubric))
                                                        return (
                                                            <span key={kind} className={`xh-chip ${allPassed ? 'on' : ''}`}>
                                                                {KIND[kind].icon} {KIND[kind].label}{ofKind.length > 1 ? ` ×${ofKind.length}` : ''}{allPassed ? ' ✓' : ''}
                                                            </span>
                                                        )
                                                    })}
                                                </span>
                                            </span>
                                            <span className="xh-go" aria-hidden="true">←</span>
                                        </Link>
                                    </li>
                                )
                            })}
                        </ol>
                    </details>
                ))}
            </div>
        </>
    )
}
