// dictionary-provider.tsx
'use client'

import { Locale } from "@/lib/i18n-config"
import React from "react"

const LocaleContext = React.createContext<Locale | null>(null)

export default function DictionaryProvider({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  return (
    <LocaleContext.Provider value={locale}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = React.useContext(LocaleContext)
  if (context === null) {
    throw new Error('useLocale hook must be used within LocaleProvider')
  }

  return context
}