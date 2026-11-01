import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import ExercisesHub from '@/components/exercises/ExercisesHub'
import { getCoursePractice } from '@/lib/server/course-exercises'
import '@/styles/exercises-hub.css'

export const metadata: Metadata = {
    title: 'التمارين',
    description: 'كل تمارين كورس PromptMaster، درس درس: «المستر بيصحّح»، وأسئلة تحسبها بنفسك، ومواقف تختار فيها، وقوايم مراجعة لشغلك.',
}

/** Rebuilt 2026-11-01 on the five levels (owner: the old page was the old book's chapter quizzes). */
export default function ExercisesPage() {
    return (
        <>
            <Navigation />
            <main className="xh-page">
                <header className="xh-head">
                    <span className="xh-kicker">🎯 التمارين</span>
                    <h1>تمارين الكورس، درس درس</h1>
                </header>
                <ExercisesHub levels={getCoursePractice()} />
            </main>
        </>
    )
}
