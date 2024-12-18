import { i18n, type Locale } from "../../lib/i18n-config"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import "../globals.css"
import DictionaryProvider from "@/context/DictionaryProvider"
import { getDictionary } from "@/lib/get-dictionary"
import LocaleProvider from "@/context/LocaleProvider"
import { QueryProvider } from "@/context/QueryProvider"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
	title: "Jiratata",
	description: "Siyn's jira clone but add i18n and customized",
}

export async function generateStaticParams() {
	return i18n.locales.map((locale) => ({ lang: locale }))
}

export default async function RootLayout({
	children,
	params,
}: Readonly<{
	children: React.ReactNode
	params: Promise<{ lang: Locale }>
}>) {
	const { lang } = await params

	const dictionary = await getDictionary(lang)

	return (
		<html lang={lang}>
			<body className={cn(inter.className, "antialiased min-h-screen")}>
				<LocaleProvider locale={lang}>
					<DictionaryProvider dictionary={dictionary}>
						<QueryProvider>
							<Toaster />
							<NuqsAdapter>{children}</NuqsAdapter>
						</QueryProvider>
					</DictionaryProvider>
				</LocaleProvider>
			</body>
		</html>
	)
}
