"use client"

import { usePathname, useRouter } from "next/navigation"
import { i18n, type Locale } from "../lib/i18n-config"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select"
import { useCallback } from "react"

export default function LocaleSwitcher() {
	const pathname = usePathname()
	const router = useRouter()

	const handleChangeLang = useCallback(
		(locale: Locale) => {
			if (!pathname) return "/"
			const segments = pathname.split("/")
			segments[1] = locale
			router.replace(segments.join("/"))
		},
		[pathname, router]
	)

	return (
		<Select defaultValue={'en'} onValueChange={(locale: Locale) => handleChangeLang(locale)}>
			<SelectTrigger className="w-[100px]">
				<SelectValue placeholder={"i18n"} />
			</SelectTrigger>
			<SelectContent>
				{i18n.locales.map((local) => {
					return (
						<SelectItem key={local} value={local}>
							{local}
						</SelectItem>
					)
				})}
			</SelectContent>
		</Select>
	)
}
