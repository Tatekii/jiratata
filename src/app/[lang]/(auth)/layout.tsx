import { FC, PropsWithChildren, ReactNode } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import style from "./styles.module.css"
import { Locale } from "@/lib/i18n-config"
import { getDictionary } from "@/lib/get-dictionary"

const AuthLayout: FC<
	PropsWithChildren<{
		params: Promise<{ lang: Locale }>
	}>
> = async ({ children, params }) => {
	const { lang } = await params

	const dictionary = await getDictionary(lang)

	return (
		<main className="bg-neutral-100 min-h-screen">
			<div className="mx-auto max-w-screen-2xl p-4">
				<nav className="flex justify-between items-center">
					<div className={style["logo-wrapper"]}>
						<Image src="/logo.svg" alt={"logo"} objectFit={"cover"} fill={true} />
					</div>
					<Button variant={"secondary"}>{dictionary.auth.signup}</Button>
				</nav>
			</div>
			<div className="flex flex-col items-center justify-center pt-4 md:pt-14 ">{children}</div>
		</main>
	)
}

export default AuthLayout
