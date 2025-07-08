import type { Metadata } from "next"
import "./globals.css"
import { cn } from "@/lib/utils"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
	title: "Jiratata",
	description: "Siyn's jira clone but add i18n and customized",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html>
			<body className={cn(inter.className, "antialiased min-h-screen")}>{children}</body>
		</html>
	)
}
