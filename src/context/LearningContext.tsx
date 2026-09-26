'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { UserLearningPreferences } from '@/types/learning'

interface LearningContextValue {
  preferences: UserLearningPreferences | null
  isLoading: boolean
  refreshPreferences: () => Promise<void>
}

const LearningContext = createContext<LearningContextValue | undefined>(undefined)

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : undefined
}

export function LearningProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserLearningPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchPreferences = useCallback(async () => {
    try {
      const userId = getCookie('ebook_user_id')
      if (!userId) {
        setPreferences(null)
        setIsLoading(false)
        return
      }

      const res = await fetch('/api/learning-preferences')
      if (!res.ok) {
        setPreferences(null)
        setIsLoading(false)
        return
      }
      const data = await res.json()
      setPreferences(data.preferences || null)
    } catch {
      setPreferences(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  return (
    <LearningContext.Provider
      value={{
        preferences,
        isLoading,
        refreshPreferences: fetchPreferences,
      }}
    >
      {children}
    </LearningContext.Provider>
  )
}

export function useLearning(): LearningContextValue {
  const ctx = useContext(LearningContext)
  if (!ctx) throw new Error('useLearning must be used within LearningProvider')
  return ctx
}
