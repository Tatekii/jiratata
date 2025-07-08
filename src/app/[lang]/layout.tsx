import { i18n, type Locale } from "../../lib/i18n-config"
import "../globals.css"
import DictionaryProvider from "@/context/DictionaryProvider"
import { getDictionary } from "@/lib/get-dictionary"
import LocaleProvider from "@/context/LocaleProvider"
import { QueryProvider } from "@/context/QueryProvider"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { Toaster } from "sonner"
import { Suspense } from "react"
import { Version } from "@/components/Version"

export async function generateStaticParams() {
	return i18n.locales.map((locale) => ({ lang: locale }))
}

export default async function LangLayout({
	children,
	params,
}: Readonly<{
	children: React.ReactNode
	params: Promise<{ lang: Locale }>
}>) {
	const { lang } = await params

	const dictionary = await getDictionary(lang)

	return (
		<LocaleProvider locale={lang}>
			<DictionaryProvider dictionary={dictionary}>
				<QueryProvider>
					<Toaster />
					<NuqsAdapter>
						<Suspense>{children}</Suspense>
					</NuqsAdapter>
					<Version />
				</QueryProvider>
			</DictionaryProvider>
		</LocaleProvider>
	)
}
