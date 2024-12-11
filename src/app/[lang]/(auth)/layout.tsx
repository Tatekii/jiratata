"use client"
import { FC, PropsWithChildren } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import style from "./styles.module.css"
import LocaleSwitcher from "@/components/LocaleSwitcher"
import { useDictionary } from "@/context/DictionaryProvider"

const AuthLayout: FC<PropsWithChildren> = ({ children }) => {

	const dic = useDictionary()

	return (
		<main className="bg-neutral-100 min-h-screen">
			<div className="mx-auto max-w-screen-2xl p-4">
				<nav className="flex justify-between items-center">
					<div className={style["logo-wrapper"]}>
						<Image src="/image/logo.svg" alt={"logo"} fill={true} priority={true} />
					</div>
					<div className="flex gap-2">
						<Button variant={"secondary"}>{dic.auth.signup}</Button>
						<LocaleSwitcher />
					</div>
				</nav>
			</div>
			<div className="flex flex-col items-center justify-center pt-4 md:pt-14 ">{children}</div>
		</main>
	)
}

export default AuthLayout
