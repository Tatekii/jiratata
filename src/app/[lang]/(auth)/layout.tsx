"use client"
import { FC, PropsWithChildren } from "react"
import Image from "next/image"
import LocaleSwitcher from "@/components/LocaleSwitcher"
import AuthJumpButton from "@/components/AuthJumpButton"

const AuthLayout: FC<PropsWithChildren> = ({ children }) => {
	return (
		<main className="bg-neutral-100 min-h-screen">
			<div className="mx-auto max-w-screen-2xl p-4">
				<nav className="flex justify-between items-center">
					<Image src="/image/logo.svg" alt={"logo"} width={70} height={56}/>
					<div className="flex gap-2">
						<AuthJumpButton />
						<LocaleSwitcher />
					</div>
				</nav>
			</div>
			<div className="flex flex-col items-center justify-center pt-4 md:pt-14 p-4">{children}</div>
		</main>
	)
}

export default AuthLayout
