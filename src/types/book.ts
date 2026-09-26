export interface PageContent {
    id: number;
    chapterNumber: number;
    pageNumber: number;
    title: string;
    description: string;
    image?: {
        src: string;
        alt: string;
        caption?: string;
        placement?: 'hero' | 'inline';
    };
    contentBlocks: {
        type: 'text' | 'code' | 'card' | 'image' | 'video' | 'interactive';
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
        // For type: 'interactive' — an in-page React animation rendered by key
        widget?: string;          // widget id, e.g. 'next-token-prediction'
    }[];
}
