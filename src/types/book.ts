export interface PageContent {
    id: number;
    chapterNumber: number;
    pageNumber: number;
    title: string;
    description: string;
    /** Planned minutes including the practice (Level 1 lessons); falls back to a word-count estimate. */
    minutes?: number;
    image?: {
        src: string;
        alt: string;
        caption?: string;
        placement?: 'hero' | 'inline';
    };
    contentBlocks: {
        type: 'text' | 'code' | 'card' | 'image' | 'video' | 'interactive' | 'audio' | 'flashcards' | 'quiz' | 'confidence' | 'checklist' | 'answer' | 'grade' | 'save' | 'bag';
        title?: string;
        content: string;
        code?: string;
        imageUrl?: string;
        items?: { title: string; content: string; icon?: string }[];
        isReward?: boolean;
        points?: number;
        rewardId?: string;
        // ── Media blocks ──────────────────────────────────────────
        // For type: 'video' — a pre-rendered motion-graphics clip (e.g. Remotion mp4)
        videoUrl?: string;        // public-relative path, e.g. '/assets/content/unit-1/attention.mp4'
        poster?: string;          // still shown before the video plays / as fallback
        loop?: boolean;           // default true for short explainer loops
        autoplay?: boolean;       // default true (muted) — plays when scrolled into view
        /** A talking video (المستر): vertical, plays with sound only when the reader taps play, never loops. */
        narrated?: boolean;
        /** Narrated video only: the `anchor` of the block the page scrolls to when the video ends. */
        next?: string;
        /** An id for this block, so a video or link can jump to it. */
        anchor?: string;
        // For type: 'audio' — a listen-on-the-go summary (e.g. a NotebookLM audio overview)
        audioUrl?: string;
        // For type: 'flashcards' — each item is one card: title = front, content = back.
        // For type: 'answer' — title = the question, accept = accepted answers, hint after a miss, content = explanation.
        accept?: string[];
        hint?: string;
        // For type: 'checklist' — items = criteria the learner ticks; content = shown when all are ticked.
        // For type: 'confidence' — content = the AI reply, answer = where the mistake is; sound = the reply is correct.
        answer?: string;
        sound?: boolean;
        // For type: 'grade' — «المستر بيصحّح»: rubric = id in src/data/gradeRubrics.ts, content = what to paste, bag = save label.
        rubric?: string;
        // For type: 'save' — bag = the label it is saved under in «شنطتك», content = intro, placeholder = textarea hint.
        // For type: 'bag' — lists what this section saved in «شنطتك».
        bag?: string;
        placeholder?: string;
        // For type: 'quiz' — tap-to-answer questions; the result message is block.content.
        quiz?: { question: string; options: string[]; answer: number; why: string }[];
        // For type: 'interactive' — an in-page React animation rendered by key
        widget?: string;          // widget id, e.g. 'next-token-prediction'
        // ── Personalisation (onboarding v2) ───────────────────────
        /** '⚡ للمتمرسين' cards: collapsed to one tappable line for first-time AI users. */
        audience?: 'advanced';
        /** Replaced by the reader's own-profession live try when their profession is known. */
        personalize?: 'profession-try';
        /** Set at render time for collapsed advanced cards (not authored in data). */
        collapsed?: boolean;
        // ── Level-based course (docs/curriculum) ──────────────────
        /** Hidden behind a tappable line with this label (answers, worked solutions). */
        reveal?: string;
        /** Shown only to readers on this track; untagged blocks are shown to everyone. */
        track?: 'accounting' | 'service';
    }[];
}
