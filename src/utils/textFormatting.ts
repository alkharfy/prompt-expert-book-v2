import React from 'react'

const LINK_PATTERNS = [
    { pattern: /chat\.openai\.com/g, url: 'https://chat.openai.com' },
    { pattern: /claude\.ai/g, url: 'https://claude.ai' },
    { pattern: /gemini\.google\.com/g, url: 'https://gemini.google.com' },
    { pattern: /openai\.com/g, url: 'https://openai.com' },
    { pattern: /anthropic\.com/g, url: 'https://anthropic.com' },
]

let globalKeyCounter = 0
function nextKey(prefix: string) {
    return `${prefix}-${globalKeyCounter++}`
}

function formatLinks(text: string): (string | React.ReactElement)[] {
    if (!text) return [text]

    let parts: (string | React.ReactElement)[] = [text]

    for (const { pattern, url } of LINK_PATTERNS) {
        const newParts: (string | React.ReactElement)[] = []

        for (const part of parts) {
            if (typeof part !== 'string') {
                newParts.push(part)
                continue
            }

            const regex = new RegExp(pattern.source, 'g')
            let lastIndex = 0
            let match

            while ((match = regex.exec(part)) !== null) {
                if (match.index > lastIndex) {
                    newParts.push(part.slice(lastIndex, match.index))
                }
                newParts.push(
                    React.createElement('a', {
                        key: nextKey('link'),
                        href: url,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        style: {
                            color: '#FF6B35',
                            textDecoration: 'underline',
                            fontWeight: 600,
                            cursor: 'pointer',
                        },
                    }, match[0])
                )
                lastIndex = regex.lastIndex
            }
            if (lastIndex < part.length) {
                newParts.push(part.slice(lastIndex))
            } else if (lastIndex === 0 && newParts.length === 0) {
                newParts.push(part)
            }
        }

        if (newParts.length > 0) parts = newParts
    }

    return parts
}

function formatCharacterNames(parts: (string | React.ReactElement)[]): (string | React.ReactElement)[] {
    const finalParts: (string | React.ReactElement)[] = []

    for (const part of parts) {
        if (typeof part !== 'string') {
            finalParts.push(part)
            continue
        }

        const nameParts = part.split(/(سارة:|أحمد:)/g)
        for (const namePart of nameParts) {
            if (namePart === 'سارة:' || namePart === 'أحمد:') {
                finalParts.push(
                    React.createElement('span', {
                        key: nextKey('name'),
                        style: { color: '#FF6B35', fontWeight: 'bold' },
                    }, namePart)
                )
            } else if (namePart) {
                finalParts.push(namePart)
            }
        }
    }

    return finalParts
}

export function formatDialogue(text: string): (string | React.ReactElement)[] {
    if (!text) return [text]
    const linkedParts = formatLinks(text)
    return formatCharacterNames(linkedParts)
}

export function formatEnhancedText(text: string): (string | React.ReactElement)[] {
    if (!text) return [text]

    let processedText = text.replace(/\*\*/g, '')
    const parts = processedText.split(/(\d+|قول|الفرق)/g)

    return parts.map((part, i) => {
        if (/^\d+$/.test(part) || part === 'قول' || part === 'الفرق') {
            return React.createElement('span', {
                key: nextKey('enh'),
                style: { color: '#FF6B35', fontWeight: 'bold' },
            }, part)
        }
        return part
    })
}

export function formatBoldMarkdown(text: string): (string | React.ReactElement)[] {
    if (!text) return [text]
    return text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
        i % 2 === 1
            ? React.createElement('strong', { key: nextKey('bold') }, part)
            : part
    )
}

export function formatTextWithGlossary(
    text: string,
    glossaryPatterns: { termId: string; patterns: string[] }[],
    GlossaryTermComponent: React.ComponentType<{ termId: string; displayText: string }>
): (string | React.ReactElement)[] {
    if (!text) return [text]

    // First apply links
    let parts = formatLinks(text)

    // Then apply glossary terms
    for (const { termId, patterns } of glossaryPatterns) {
        const newParts: (string | React.ReactElement)[] = []

        for (const part of parts) {
            if (typeof part !== 'string') {
                newParts.push(part)
                continue
            }

            const patternRegex = new RegExp(`(${patterns.join('|')})`, 'gi')
            const segments = part.split(patternRegex)

            for (const segment of segments) {
                if (!segment) continue

                const isGlossaryTerm = patterns.some(
                    (p) => segment.toLowerCase() === p.toLowerCase()
                )

                if (isGlossaryTerm) {
                    newParts.push(
                        React.createElement(GlossaryTermComponent, {
                            key: nextKey('glossary'),
                            termId,
                            displayText: segment,
                        })
                    )
                } else {
                    newParts.push(segment)
                }
            }
        }

        parts = newParts
    }

    // Finally format character names
    return formatCharacterNames(parts)
}
