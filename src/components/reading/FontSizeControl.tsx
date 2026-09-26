'use client'

import { useState, useEffect } from 'react'

type FontSize = 'small' | 'medium' | 'large'

const STORAGE_KEY = 'reading_font_size'

const sizes: { key: FontSize; label: string; title: string; fontSize: string }[] = [
    { key: 'small', label: 'ص', title: 'خط صغير', fontSize: '0.75rem' },
    { key: 'medium', label: 'م', title: 'خط متوسط', fontSize: '0.9rem' },
    { key: 'large', label: 'ك', title: 'خط كبير', fontSize: '1.1rem' },
]

interface FontSizeControlProps {
    onChange: (size: FontSize) => void
}

export default function FontSizeControl({ onChange }: FontSizeControlProps) {
    const [fontSize, setFontSize] = useState<FontSize>('medium')

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored === 'small' || stored === 'medium' || stored === 'large') {
            setFontSize(stored)
            onChange(stored)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleChange = (size: FontSize) => {
        setFontSize(size)
        localStorage.setItem(STORAGE_KEY, size)
        onChange(size)
    }

    return (
        <div className="font-size-control" role="group" aria-label="حجم الخط">
            {sizes.map((s) => (
                <button
                    key={s.key}
                    className={`font-size-btn ${fontSize === s.key ? 'active' : ''}`}
                    onClick={() => handleChange(s.key)}
                    title={s.title}
                    aria-pressed={fontSize === s.key}
                    style={{ fontSize: s.fontSize }}
                >
                    {s.label}
                </button>
            ))}
        </div>
    )
}

export type { FontSize }
