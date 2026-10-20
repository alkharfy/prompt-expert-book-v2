'use client'

import type { PageContent } from '@/types/book'
import CopyButton from '@/components/reading/CopyButton'
import RevealCard from '@/components/reading/RevealCard'
import QuizBlock from '@/components/reading/QuizBlock'
import ChecklistBlock from '@/components/reading/ChecklistBlock'
import AnswerCheck from '@/components/reading/AnswerCheck'
import NarratedVideo from '@/components/reading/NarratedVideo'
import { formatDialogue, formatEnhancedText } from '@/utils/textFormatting'

type Block = PageContent['contentBlocks'][number]

/**
 * A workshop page's blocks, drawn like the lessons (same colours, copy button, quiz, checklist and answer check),
 * without the reader's progress, notes and paywall machinery: a workshop is one page outside the levels.
 */
export default function WorkshopBlocks({ slug, blocks }: { slug: string; blocks: Block[] }) {
    return (
        <div className="reading-blocks ws-blocks">
            {blocks.map((block, index) => (
                <div key={index}>
                    {block.type === 'text' && (
                        <div className="ws-text">
                            {block.title && <h4>{block.title}</h4>}
                            <p>{formatDialogue(block.content)}</p>
                        </div>
                    )}

                    {block.type === 'card' && block.reveal && (
                        <RevealCard label={block.reveal} title={block.title} content={block.content} items={block.items} formatText={formatDialogue} />
                    )}
                    {block.type === 'card' && !block.reveal && (
                        <div className="ws-card">
                            {block.title && <h3>{block.title}</h3>}
                            {block.content && <p>{formatDialogue(block.content)}</p>}
                            {block.items && (
                                <div className="ws-items">
                                    {block.items.map((item, i) => (
                                        <div key={i} className="ws-item">
                                            <b>{item.title}</b>
                                            <div>{formatDialogue(item.content)}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {block.type === 'code' && (
                        <div className="code-block-wrapper" role="region" aria-label={block.title || 'طلب جاهز'}>
                            {block.title && <h3 className="ws-code-title">{block.title}</h3>}
                            <div className="code-block ws-code">
                                <CopyButton text={block.code || ''} />
                                {/* plaintext bidi: each line takes the direction of its first letter */}
                                <pre><code>{block.code}</code></pre>
                                {block.content && <div className="ws-code-note">{formatDialogue(block.content)}</div>}
                            </div>
                        </div>
                    )}

                    {block.type === 'image' && block.imageUrl && (
                        <figure className={`ws-figure ${block.portrait ? 'portrait' : ''}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element -- small local webp at its own ratio */}
                            <img src={block.imageUrl} alt={block.title || ''} loading="lazy" />
                            {block.title && <figcaption>{formatEnhancedText(block.title)}</figcaption>}
                        </figure>
                    )}

                    {block.type === 'video' && block.videoUrl && block.narrated && (
                        <NarratedVideo src={block.videoUrl} poster={block.poster} title={block.title} note={block.content || undefined} />
                    )}
                    {block.type === 'video' && block.videoUrl && !block.narrated && (
                        <figure className={`ws-figure ${block.portrait ? 'portrait' : ''}`}>
                            <video src={block.videoUrl} poster={block.poster} controls playsInline preload="metadata" />
                            {block.title && <figcaption>{formatEnhancedText(block.title)}</figcaption>}
                        </figure>
                    )}

                    {block.type === 'quiz' && block.quiz && (
                        <QuizBlock id={`ws-${slug}-${index}`} title={block.title} questions={block.quiz} outro={block.content} formatText={formatEnhancedText} />
                    )}
                    {block.type === 'checklist' && block.items && (
                        <ChecklistBlock id={`ws-${slug}-${index}`} title={block.title} items={block.items} outro={block.content} formatText={formatEnhancedText} />
                    )}
                    {block.type === 'answer' && block.accept && block.title && (
                        <AnswerCheck id={`ws-${slug}-${index}`} question={block.title} accept={block.accept} hint={block.hint} explanation={block.content} formatText={formatDialogue} />
                    )}
                </div>
            ))}
        </div>
    )
}
