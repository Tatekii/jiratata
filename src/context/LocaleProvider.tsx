// dictionary-provider.tsx
"use client"

import { Locale } from "@/lib/i18n-config"
import React, { useEffect } from "react"

const LocaleContext = React.createContext<Locale | null>(null)

export default function DictionaryProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
	useEffect(() => {
		// 设置 html 元素的 lang 属性
		document.documentElement.lang = locale

		// 可选：设置 dir 属性用于 RTL 语言
		// document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
	}, [locale])

	return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export function useLocale() {
	const context = React.useContext(LocaleContext)
	if (context === null) {
		throw new Error("useLocale hook must be used within LocaleProvider")
	}

	return context
}
